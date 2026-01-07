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
        user_id: userId
      })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error syncing intervention:', error)
    throw error
  }
}

export async function syncChecklistItemsToCloud(checklistItems) {
  try {
    // Filter out items without intervention_id
    const validItems = checklistItems.filter(item => item.intervention_id)
    
    if (validItems.length === 0) {
      console.warn('No checklist items with valid intervention_id to sync')
      return []
    }
    
    // Verify intervention exists first (for RLS policy check)
    const interventionId = validItems[0].intervention_id
    if (!interventionId) {
      throw new Error('Intervention ID is required')
    }
    
    const { data: intervention, error: checkError } = await supabase
      .from('interventions')
      .select('id')
      .eq('id', interventionId)
      .single()
    
    if (checkError || !intervention) {
      throw new Error(`Intervention ${interventionId} not found in cloud`)
    }
    
    const { data, error } = await supabase
      .from('checklist_items')
      .upsert(validItems.map(item => ({
        id: item.id,
        intervention_id: item.intervention_id,
        label: item.label || '',
        checked: item.checked || false,
        photo_ids: item.photo_ids || []
      })), {
        onConflict: 'id'
      })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error syncing checklist items:', error)
    throw error
  }
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

export async function syncCommentToCloud(comment) {
  try {
    if (!comment.intervention_id) {
      console.warn('Comment missing intervention_id, skipping sync')
      return null
    }
    
    // Verify intervention exists first (for RLS policy check)
    const { data: intervention, error: checkError } = await supabase
      .from('interventions')
      .select('id')
      .eq('id', comment.intervention_id)
      .single()
    
    if (checkError || !intervention) {
      throw new Error(`Intervention ${comment.intervention_id} not found in cloud`)
    }
    
    const { data, error } = await supabase
      .from('comments')
      .upsert({
        id: comment.id,
        intervention_id: comment.intervention_id,
        text: comment.text || '',
        created_at: comment.created_at
      }, {
        onConflict: 'id'
      })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error syncing comment:', error)
    throw error
  }
}

// Delete intervention from cloud
export async function deleteInterventionFromCloud(interventionId) {
  try {
    // Delete related data first (due to foreign key constraints)
    await supabase.from('comments').delete().eq('intervention_id', interventionId)
    await supabase.from('photos').delete().eq('intervention_id', interventionId)
    await supabase.from('checklist_items').delete().eq('intervention_id', interventionId)
    
    // Delete intervention
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
