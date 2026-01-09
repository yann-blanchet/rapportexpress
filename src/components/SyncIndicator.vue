<template>
  <div class="flex items-center gap-2">
    <!-- Offline Indicator -->
    <div v-if="!isOnline" class="tooltip tooltip-bottom" data-tip="Offline">
      <div class="badge badge-error badge-sm">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
        </svg>
      </div>
    </div>
    
    <!-- Syncing Indicator -->
    <div v-else-if="isSyncing" class="tooltip tooltip-bottom" data-tip="Syncing...">
      <div class="badge badge-info badge-sm">
        <span class="loading loading-spinner loading-xs"></span>
      </div>
    </div>
    
    <!-- Synced Indicator -->
    <div v-else-if="hasUnsyncedItems" class="tooltip tooltip-bottom" data-tip="Pending sync">
      <div class="badge badge-warning badge-sm">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    </div>
    
    <!-- All Synced Indicator -->
    <div v-else class="tooltip tooltip-bottom" data-tip="All synced">
      <div class="badge badge-success badge-sm">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { db } from '../db/indexeddb'

const isOnline = ref(navigator.onLine)
const isSyncing = ref(false)
const hasUnsyncedItems = ref(false)

async function checkUnsyncedItems() {
  try {
    const unsynced = await db.interventions.where('synced').equals(0).count()
    hasUnsyncedItems.value = unsynced > 0
  } catch (error) {
    console.error('Error checking unsynced items:', error)
  }
}

function handleOnline() {
  isOnline.value = true
  checkUnsyncedItems()
}

function handleOffline() {
  isOnline.value = false
}

function handleSyncStart() {
  isSyncing.value = true
}

function handleSyncComplete() {
  isSyncing.value = false
  checkUnsyncedItems()
}

onMounted(() => {
  // Check initial sync status
  checkUnsyncedItems()
  
  // Listen to network status
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  
  // Listen to sync events
  window.addEventListener('syncStarted', handleSyncStart)
  window.addEventListener('syncCompleted', handleSyncComplete)
  
  // Check periodically for unsynced items (every 5 seconds)
  const interval = setInterval(checkUnsyncedItems, 5000)
  
  // Store interval ID for cleanup
  window.__syncIndicatorInterval = interval
})

onUnmounted(() => {
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
  window.removeEventListener('syncStarted', handleSyncStart)
  window.removeEventListener('syncCompleted', handleSyncComplete)
  
  if (window.__syncIndicatorInterval) {
    clearInterval(window.__syncIndicatorInterval)
    delete window.__syncIndicatorInterval
  }
})
</script>
