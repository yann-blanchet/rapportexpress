import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Configure Supabase client with session persistence
// This ensures sessions persist across app restarts (PWA-friendly)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Auto-refresh tokens in the background
    autoRefreshToken: true,
    // Persist session in localStorage (works offline, survives app restarts)
    persistSession: true,
    // Detect session from URL (for OAuth redirects - not used for OTP)
    detectSessionInUrl: false,
    // Storage key for session (default is fine)
    storage: window.localStorage,
    // Storage key prefix
    storageKey: 'sb-auth-token',
    // Flow type: 'pkce' is more secure but 'implicit' works fine for OTP
    flowType: 'pkce'
  }
})

// Sync utilities
export async function syncInterventionToCloud(intervention) {
  try {
    // Get current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.warn('[Sync] User not authenticated, skipping cloud sync')
      throw new Error('User must be authenticated to sync to cloud')
    }
    
    const userId = user.id
    
    // Ensure user_id is always set (required for RLS policies)
    const { data, error } = await supabase
      .from('interventions')
      .upsert({
        id: intervention.id,
        client_name: intervention.client_name,
        date: intervention.date,
        status: intervention.status,
        created_at: intervention.created_at,
        updated_at: intervention.updated_at,
        user_id: userId, // Always set user_id to current authenticated user
        sequence_number: intervention.sequence_number || null,
        observations: intervention.observations || '',
        conclusion: intervention.conclusion || '',
        feed_items: Array.isArray(intervention.feed_items) 
          ? intervention.feed_items 
          : []
      }, {
        onConflict: 'id' // Update if exists, insert if not
      })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error syncing intervention:', error)
    throw error
  }
}

// Note: syncChecklistItemsToCloud is deprecated - checklist_items are now synced as part of syncInterventionToCloud
// Keeping this function for backward compatibility but it's no longer used
export async function syncChecklistItemsToCloud(checklistItems) {
  console.warn('syncChecklistItemsToCloud is deprecated - checklist_items are now synced with interventions')
  return []
}

export async function uploadPhotoToCloud(photoFile, interventionId, photoId) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    // Use 'anonymous' folder if no user is authenticated (for MVP)
    const userId = user?.id || 'anonymous'
    
    const fileExt = photoFile.name.split('.').pop()
    const fileName = `${userId}/${interventionId}/${photoId}.${fileExt}`
    
    // First, try to check if file exists and delete it (for upsert behavior)
    // This works around RLS policy issues with upsert
    try {
      await supabase.storage
        .from('intervention-photos')
        .remove([fileName])
    } catch (removeError) {
      // Ignore errors when removing (file might not exist)
      // This is fine - we'll just upload normally
    }
    
    // Upload the file
    const { data, error } = await supabase.storage
      .from('intervention-photos')
      .upload(fileName, photoFile, {
        cacheControl: '3600',
        upsert: false // We handle upsert by removing first
      })

    // If upload fails with RLS policy error, try to get existing URL
    if (error) {
      const errorMessage = error.message?.toLowerCase() || ''
      
      // Check for RLS policy errors or "already exists" errors
      if (errorMessage.includes('row-level security') || 
          errorMessage.includes('policy') ||
          errorMessage.includes('already exists') || 
          errorMessage.includes('duplicate')) {
        // Try to get the public URL if file might exist
        try {
          const { data: { publicUrl } } = supabase.storage
            .from('intervention-photos')
            .getPublicUrl(fileName)
          // If we can construct the URL, return it (file might exist but RLS blocks access)
          if (publicUrl) {
            console.warn('Upload blocked by RLS, but file may exist. Using constructed URL:', publicUrl)
            return publicUrl
          }
        } catch (urlError) {
          // If we can't get URL, throw original error
        }
      }
      // For other errors, throw
      throw error
    }

    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('intervention-photos')
      .getPublicUrl(fileName)

    return publicUrl
  } catch (error) {
    console.error('Error uploading photo:', error)
    throw error
  }
}

export async function transcribeAudio(audioFile) {
  try {
    // Convert file to base64 for transmission
    const arrayBuffer = await audioFile.arrayBuffer()
    const base64 = btoa(
      new Uint8Array(arrayBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ''
      )
    )

    // Call Supabase Edge Function for transcription
    // Use fetch directly to ensure we always send the anon key for CORS
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
    
    const response = await fetch(`${supabaseUrl}/functions/v1/transcribe-audio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey
      },
      body: JSON.stringify({
        audioData: base64,
        fileName: audioFile.name,
        mimeType: audioFile.type
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { error: errorText }
      }
      
      // Check if it's an auth error
      if (response.status === 401 || errorData.error?.includes('Unauthorized')) {
        throw new Error('Authentication required for transcription. Please sign in or the audio will remain pending.')
      }
      
      // Check for rate limiting (429)
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again. Audio will remain pending.')
      }
      
      // Check for quota errors
      if (errorData.error?.includes('quota') || errorData.error?.includes('billing')) {
        throw new Error('OpenAI API quota exceeded. Please add credits to your OpenAI account. Audio will remain pending.')
      }
      
      throw new Error(errorData.error || `Transcription failed: ${response.status}`)
    }

    const data = await response.json()
    return data?.transcription || ''
  } catch (error) {
    console.error('Error transcribing audio:', error)
    throw error
  }
}

export async function syncPhotoToCloud(photo) {
  try {
    if (!photo.intervention_id) {
      console.warn('Photo missing intervention_id, skipping sync')
      return null
    }
    
    // Verify intervention exists first (for RLS policy check)
    const { data: intervention, error: checkError } = await supabase
      .from('interventions')
      .select('id')
      .eq('id', photo.intervention_id)
      .single()
    
    if (checkError || !intervention) {
      throw new Error(`Intervention ${photo.intervention_id} not found in cloud`)
    }
    
    const { data, error } = await supabase
      .from('photos')
      .upsert({
        id: photo.id,
        intervention_id: photo.intervention_id,
        url_cloud: photo.url_cloud,
        description: photo.description || '',
        taken_at: photo.taken_at
      }, {
        onConflict: 'id'
      })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error syncing photo:', error)
    throw error
  }
}

// Note: syncCommentToCloud is deprecated - comments are now synced as part of syncInterventionToCloud
// Keeping this function for backward compatibility but it's no longer used
export async function syncCommentToCloud(comment) {
  console.warn('syncCommentToCloud is deprecated - comments are now synced with interventions')
  return null
}

// Delete photo from cloud (Storage and database)
export async function deletePhotoFromCloud(photo) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id || 'anonymous'
    
    // Delete from Storage if url_cloud exists
    if (photo.url_cloud) {
      // Extract file path from URL or construct it
      let fileName = null
      if (photo.url_cloud.includes('/storage/v1/object/public/')) {
        // Extract path from public URL
        const urlParts = photo.url_cloud.split('/storage/v1/object/public/intervention-photos/')
        if (urlParts.length > 1) {
          fileName = urlParts[1]
        }
      } else {
        // Construct file path
        const fileExt = photo.file_name?.split('.').pop() || 'jpg'
        fileName = `${userId}/${photo.intervention_id}/${photo.id}.${fileExt}`
      }
      
      if (fileName) {
        try {
          const { error: storageError } = await supabase.storage
            .from('intervention-photos')
            .remove([fileName])
          
          if (storageError) {
            console.warn('Error deleting photo from storage:', storageError)
            // Continue with database deletion even if storage deletion fails
          }
        } catch (storageErr) {
          console.warn('Error deleting photo from storage:', storageErr)
          // Continue with database deletion
        }
      }
    }
    
    // Delete from photos table
    const { error: dbError } = await supabase
      .from('photos')
      .delete()
      .eq('id', photo.id)
    
    if (dbError) throw dbError
    
    return true
  } catch (error) {
    console.error('Error deleting photo from cloud:', error)
    throw error
  }
}

// Delete intervention from cloud
export async function deleteInterventionFromCloud(interventionId) {
  try {
    // Delete photos (checklist_items and comments are in JSONB, so they're deleted with intervention)
    await supabase.from('photos').delete().eq('intervention_id', interventionId)
    
    // Delete intervention (this also deletes checklist_items and comments in JSONB)
    const { error } = await supabase
      .from('interventions')
      .delete()
      .eq('id', interventionId)

    if (error) throw error
    
    // Note: Storage files are not automatically deleted
    // You may want to add cleanup for photos in storage bucket
    return true
  } catch (error) {
    console.error('Error deleting intervention from cloud:', error)
    throw error
  }
}

// Get last sync timestamp from localStorage
function getLastSyncTimestamp(db) {
  const lastSync = localStorage.getItem('lastSyncFromCloud')
  
  // Check if database is empty - if so, do a full sync
  return db.interventions.count().then(count => {
    if (count === 0) {
      // Database is empty, reset lastSync to fetch everything
      localStorage.removeItem('lastSyncFromCloud')
      return new Date(0).toISOString()
    }
    
    if (lastSync) {
      return new Date(lastSync).toISOString()
    }
    // If no last sync, return a date far in the past to sync everything
    return new Date(0).toISOString()
  })
}

// Store last sync timestamp
function setLastSyncTimestamp() {
  localStorage.setItem('lastSyncFromCloud', new Date().toISOString())
}

// Pull data from Supabase and sync to local IndexedDB (incremental sync)
// Returns: { interventions: count, photos: count }
export async function syncFromCloud(db) {
  try {
    if (!navigator.onLine) {
      return { interventions: 0, photos: 0 }
    }
    
    // Check if database is empty and get last sync timestamp
    const lastSync = await getLastSyncTimestamp(db)
    let interventionsSynced = 0
    let photosSynced = 0
    
    // Fetch only interventions updated since last sync
    const { data: cloudInterventions, error: interventionsError } = await supabase
      .from('interventions')
      .select('*')
      .gte('updated_at', lastSync) // Only fetch records updated since last sync
      .order('updated_at', { ascending: false })

    if (interventionsError) {
      console.error('[Sync From Cloud] Error fetching interventions:', interventionsError)
      throw interventionsError
    }

    if (cloudInterventions && cloudInterventions.length > 0) {
      // Sync each intervention to local DB with conflict resolution
      for (const cloudIntervention of cloudInterventions) {
        try {
          const localIntervention = await db.interventions.get(cloudIntervention.id)
          const cloudUpdated = new Date(cloudIntervention.updated_at)
          const localUpdated = localIntervention ? new Date(localIntervention.updated_at || 0) : new Date(0)
          
          // Conflict resolution: Use newer version (last write wins)
          // If local is newer and unsynced, we'll push it to cloud in performAutoSync
          // If cloud is newer or equal, use cloud data
          // Skip if local was just synced (within last 2 seconds) to prevent race conditions
          const timeDiff = cloudUpdated.getTime() - localUpdated.getTime()
          const justSynced = timeDiff >= 0 && timeDiff < 2000 // Within 2 seconds
          
          if (cloudUpdated >= localUpdated && !justSynced) {
            // Handle backward compatibility: merge checklist_items and comments into feed_items if needed
            let feedItems = []
            if (Array.isArray(cloudIntervention.feed_items) && cloudIntervention.feed_items.length > 0) {
              feedItems = cloudIntervention.feed_items
            } else {
              // Backward compatibility: migrate from checklist_items and comments
              const checklistItems = Array.isArray(cloudIntervention.checklist_items) ? cloudIntervention.checklist_items : []
              const comments = Array.isArray(cloudIntervention.comments) ? cloudIntervention.comments : []
              
              // Convert checklist items to feed items (type: 'text' with compliance)
              const checkItems = checklistItems.map(item => ({
                id: item.id || crypto.randomUUID(),
                type: 'text',
                text: item.label || '',
                compliance: item.checked === true ? 'compliant' : (item.checked === false ? 'not_compliant' : 'na'),
                category: item.category || null,
                created_at: item.created_at || new Date().toISOString(),
                status: 'completed'
              }))
              
              // Convert comments to feed items
              const commentItems = comments.map(entry => ({
                id: entry.id || crypto.randomUUID(),
                type: entry.type || 'text',
                text: entry.text || '',
                photo_id: entry.photo_id || null,
                transcription: entry.transcription || null,
                category: entry.category || null,
                created_at: entry.created_at || new Date().toISOString(),
                status: entry.status || 'completed'
              }))
              
              feedItems = [...checkItems, ...commentItems].sort((a, b) => 
                new Date(a.created_at) - new Date(b.created_at)
              )
            }
            
            await db.interventions.put({
              id: cloudIntervention.id,
              client_name: cloudIntervention.client_name,
              sequence_number: cloudIntervention.sequence_number || null,
              date: cloudIntervention.date,
              status: cloudIntervention.status,
              observations: cloudIntervention.observations || '',
              conclusion: cloudIntervention.conclusion || '',
              created_at: cloudIntervention.created_at,
              updated_at: cloudIntervention.updated_at,
              synced: true, // Mark as synced since we got it from cloud
              user_id: cloudIntervention.user_id,
              feed_items: feedItems
            })
            interventionsSynced++
          } else if (justSynced) {
            // Skip - local was just synced, don't overwrite
            console.log(`[Sync From Cloud] Skipping ${cloudIntervention.id} - just synced locally`)
          } else {
            // Local is newer - keep local, but mark for sync to cloud
            // This will be handled by performAutoSync
            if (localIntervention && !localIntervention.synced) {
              // Already marked as unsynced, will be pushed to cloud
            }
          }
        } catch (error) {
          console.error(`[Sync From Cloud] Error syncing intervention ${cloudIntervention.id}:`, error)
        }
      }
    }

    // Check if database is empty to determine if we need full photo sync
    const localInterventionCount = await db.interventions.count()
    const isDatabaseEmpty = localInterventionCount === 0
    
    // Fetch photos - if database is empty, fetch all; otherwise limit to recent
    // Note: Photos table might not have updated_at, so we use a simpler approach
    // For efficiency, we could add updated_at to photos table in the future
    let photosQuery = supabase
      .from('photos')
      .select('*')
      .order('taken_at', { ascending: false })
    
    if (!isDatabaseEmpty) {
      photosQuery = photosQuery.limit(100) // Limit to recent photos for efficiency
    }
    
    const { data: cloudPhotos, error: photosError } = await photosQuery

    if (photosError) {
      console.error('[Sync From Cloud] Error fetching photos:', photosError)
      // Don't throw - photos are optional
    } else if (cloudPhotos && cloudPhotos.length > 0) {
      // Sync photos to local DB
      for (const cloudPhoto of cloudPhotos) {
        try {
          const localPhoto = await db.photos.get(cloudPhoto.id)
          const cloudTaken = new Date(cloudPhoto.taken_at)
          const localTaken = localPhoto ? new Date(localPhoto.taken_at || 0) : new Date(0)
          
          // Use newer version
          if (cloudTaken >= localTaken) {
            await db.photos.put({
              id: cloudPhoto.id,
              intervention_id: cloudPhoto.intervention_id,
              url_local: cloudPhoto.url_local || '',
              url_cloud: cloudPhoto.url_cloud || null,
              description: cloudPhoto.description || '',
              taken_at: cloudPhoto.taken_at
            })
            photosSynced++
          }
        } catch (error) {
          console.error(`[Sync From Cloud] Error syncing photo ${cloudPhoto.id}:`, error)
        }
      }
    }

    // Update last sync timestamp after successful sync
    setLastSyncTimestamp()

    return { interventions: interventionsSynced, photos: photosSynced }

  } catch (error) {
    console.error('[Sync From Cloud] Error:', error)
    throw error
  }
}


// Profile sync functions (uses profiles table)
// These functions are kept for backward compatibility but now use profiles table
export async function syncTradeToCloud(trade) {
  try {
    // Use the profile service instead
    const { updateProfile } = await import('./profile')
    const profile = await updateProfile({ trade })
    return profile
  } catch (error) {
    console.error('Error syncing trade to cloud:', error)
    return null
  }
}

export async function loadTradeFromCloud() {
  try {
    // Use the profile service instead
    const { getProfileField } = await import('./profile')
    const trade = await getProfileField('trade')
    return trade
  } catch (error) {
    console.warn('Error loading trade from cloud:', error)
    return null
  }
}
