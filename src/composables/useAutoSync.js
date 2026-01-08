import { ref, onMounted, onUnmounted } from 'vue'
import { db } from '../db/indexeddb'
import { syncInterventionToCloud, syncPhotoToCloud, syncFromCloud } from '../services/supabase'

let syncInterval = null
let isSyncing = false
let isInitialized = false

// Default sync interval: 5 minutes (300000 ms)
const DEFAULT_SYNC_INTERVAL = 5 * 60 * 1000

/**
 * Get sync interval from localStorage or return default
 */
function getSyncInterval() {
  const saved = localStorage.getItem('syncInterval')
  if (saved) {
    const interval = parseInt(saved, 10)
    // Validate: between 30 seconds and 1 hour
    if (interval >= 30000 && interval <= 3600000) {
      return interval
    }
  }
  return DEFAULT_SYNC_INTERVAL
}

/**
 * Perform automatic sync of unsynced interventions
 */
async function performAutoSync() {
  // Don't sync if already syncing or offline
  if (isSyncing || !navigator.onLine) {
    return
  }

  try {
    isSyncing = true
    const unsynced = await db.interventions.where('synced').equals(0).toArray()
    
    if (unsynced.length === 0) {
      return // Nothing to sync
    }

    for (const intervention of unsynced) {
      try {
        // Sync intervention (includes checklist_items and comments as JSONB)
        await syncInterventionToCloud(intervention)
        
        // Sync photos (still separate table)
        const photos = await db.photos
          .where('intervention_id').equals(intervention.id)
          .toArray()
        for (const photo of photos) {
          if (!photo.url_cloud) {
            await syncPhotoToCloud(photo)
          }
        }
        
        intervention.synced = true
        await db.interventions.put(intervention)
      } catch (error) {
        console.error(`[Auto Sync] Error syncing intervention ${intervention.id}:`, error)
        // Continue with next intervention - don't let errors crash the app
      }
    }
    
    // Update last sync time
    const now = Date.now()
    localStorage.setItem('lastSyncTime', now.toString())
  } catch (error) {
    console.error('[Auto Sync] Error during sync:', error)
    // Make sure we don't crash the app - errors should be logged, not cause reloads
  } finally {
    isSyncing = false
  }
}

/**
 * Start automatic periodic sync
 */
function startAutoSync() {
  // Clear existing interval if any
  if (syncInterval) {
    clearInterval(syncInterval)
  }

  // Check if auto sync is enabled
  const autoSyncEnabled = localStorage.getItem('autoSyncEnabled') !== 'false' // Default: enabled
  
  if (!autoSyncEnabled) {
    return
  }

  const interval = getSyncInterval()
  
  // Perform initial sync from cloud and to cloud after a short delay
  setTimeout(async () => {
    try {
      // First, pull data from cloud
      const fromCloud = await syncFromCloud(db)
      // Then, push local unsynced data to cloud
      await performAutoSync()
      
      // Notify components that initial sync completed
      window.dispatchEvent(new CustomEvent('syncCompleted', { 
        detail: { fromCloud, toCloud: { interventions: 0 } } 
      }))
    } catch (error) {
      console.error('[Auto Sync] Initial sync error:', error)
    }
  }, 2000) // Wait 2 seconds after app load
  
  // Set up periodic sync (pulls from cloud, then pushes local to cloud)
  syncInterval = setInterval(async () => {
    try {
      // First pull from cloud (incremental - only new updates)
      const fromCloud = await syncFromCloud(db)
      // Then push local unsynced data to cloud
      await performAutoSync()
      
      // Notify components that sync completed
      if (fromCloud.interventions > 0 || fromCloud.photos > 0) {
        window.dispatchEvent(new CustomEvent('syncCompleted', { 
          detail: { fromCloud, toCloud: { interventions: 0 } } 
        }))
      }
    } catch (error) {
      console.error('[Auto Sync] Periodic sync error:', error)
    }
  }, interval)
  
}

/**
 * Stop automatic periodic sync
 */
function stopAutoSync() {
  if (syncInterval) {
    clearInterval(syncInterval)
    syncInterval = null
  }
}

/**
 * Restart automatic sync (useful when interval changes)
 */
function restartAutoSync() {
  stopAutoSync()
  startAutoSync()
}

/**
 * Composable for automatic sync
 */
export function useAutoSync() {
  onMounted(() => {
    // Only initialize once, even if component re-mounts
    if (isInitialized) {
      return
    }
    
    isInitialized = true
    startAutoSync()
    
    // Expose restartAutoSync globally for Settings page
    window.restartAutoSync = restartAutoSync
    
    // Listen for online/offline events (only add once)
    if (!window.__autoSyncOnlineHandler) {
      window.__autoSyncOnlineHandler = async () => {
        try {
          const fromCloud = await syncFromCloud(db)
          await performAutoSync()
          // Notify components that sync completed
          window.dispatchEvent(new CustomEvent('syncCompleted', { 
            detail: { fromCloud, toCloud: { interventions: 0 } } 
          }))
        } catch (error) {
          console.error('[Auto Sync] Online sync error:', error)
        }
      }
      window.addEventListener('online', window.__autoSyncOnlineHandler)
    }
  })

  onUnmounted(() => {
    // Don't stop sync on unmount since App.vue should stay mounted
    // Only clean up if this is truly being unmounted
  })

  return {
    performAutoSync,
    startAutoSync,
    stopAutoSync,
    restartAutoSync,
    getSyncInterval
  }
}
