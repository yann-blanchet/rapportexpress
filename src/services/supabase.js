import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Sync utilities
export async function syncInterventionToCloud(intervention) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id || null
    
    const { data, error } = await supabase
      .from('interventions')
      .upsert({
        id: intervention.id,
        client_name: intervention.client_name,
        date: intervention.date,
        status: intervention.status,
        created_at: intervention.created_at,
        updated_at: intervention.updated_at,
        user_id: userId,
        checklist_items: Array.isArray(intervention.checklist_items) 
          ? intervention.checklist_items 
          : [],
        comments: Array.isArray(intervention.comments) 
          ? intervention.comments 
          : []
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
    
    const { data, error } = await supabase.storage
      .from('intervention-photos')
      .upload(fileName, photoFile, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from('intervention-photos')
      .getPublicUrl(fileName)

    return publicUrl
  } catch (error) {
    console.error('Error uploading photo:', error)
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
          if (cloudUpdated >= localUpdated) {
            await db.interventions.put({
              id: cloudIntervention.id,
              client_name: cloudIntervention.client_name,
              date: cloudIntervention.date,
              status: cloudIntervention.status,
              created_at: cloudIntervention.created_at,
              updated_at: cloudIntervention.updated_at,
              synced: true, // Mark as synced since we got it from cloud
              user_id: cloudIntervention.user_id,
              checklist_items: Array.isArray(cloudIntervention.checklist_items) 
                ? cloudIntervention.checklist_items 
                : [],
              comments: Array.isArray(cloudIntervention.comments) 
                ? cloudIntervention.comments 
                : []
            })
            interventionsSynced++
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
