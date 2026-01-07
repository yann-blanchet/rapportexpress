<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">Settings</h1>

    <!-- User Profile -->
    <div class="card bg-base-100 shadow-xl mb-6">
      <div class="card-body">
        <h2 class="card-title mb-4">User Profile</h2>
        
        <div class="form-control mb-4">
          <label class="label">
            <span class="label-text">Name</span>
          </label>
          <input
            type="text"
            v-model="profile.name"
            placeholder="Your name"
            class="input input-bordered"
          />
        </div>

        <div class="form-control mb-4">
          <label class="label">
            <span class="label-text">Email</span>
          </label>
          <input
            type="email"
            v-model="profile.email"
            placeholder="your.email@example.com"
            class="input input-bordered"
          />
        </div>

        <button @click="saveProfile" class="btn btn-primary">
          Save Profile
        </button>
      </div>
    </div>

    <!-- PDF Settings -->
    <div class="card bg-base-100 shadow-xl mb-6">
      <div class="card-body">
        <h2 class="card-title mb-4">PDF Settings</h2>
        
        <div class="form-control mb-4">
          <label class="label">
            <span class="label-text">Company/Header Text</span>
          </label>
          <input
            type="text"
            v-model="pdfSettings.header"
            placeholder="Company name or header text"
            class="input input-bordered"
          />
        </div>

        <div class="form-control mb-4">
          <label class="label">
            <span class="label-text">Logo URL (optional)</span>
          </label>
          <input
            type="url"
            v-model="pdfSettings.logoUrl"
            placeholder="https://example.com/logo.png"
            class="input input-bordered"
          />
        </div>

        <button @click="savePdfSettings" class="btn btn-primary">
          Save PDF Settings
        </button>
      </div>
    </div>

    <!-- Sync & Backup -->
    <div class="card bg-base-100 shadow-xl mb-6">
      <div class="card-body">
        <h2 class="card-title mb-4">Sync & Backup</h2>
        
        <div class="space-y-4">
          <div>
            <p class="mb-2">Sync Status: <span :class="isOnline ? 'text-success' : 'text-error'">{{ isOnline ? 'Online' : 'Offline' }}</span></p>
            <button
              @click="manualSync"
              class="btn btn-primary"
              :disabled="!isOnline || syncing"
            >
              <span v-if="syncing" class="loading loading-spinner loading-sm"></span>
              {{ syncing ? 'Syncing...' : 'Manual Sync' }}
            </button>
          </div>

          <div class="divider"></div>

          <!-- Auto Sync Settings -->
          <div>
            <div class="form-control mb-4">
              <label class="label cursor-pointer">
                <span class="label-text">
                  <div>
                    <div class="font-medium">Automatic Sync</div>
                    <div class="text-xs text-base-content/60">Automatically sync data to cloud</div>
                  </div>
                </span>
                <input 
                  type="checkbox" 
                  class="toggle toggle-primary" 
                  v-model="autoSyncEnabled"
                  @change="saveAutoSyncSettings"
                />
              </label>
            </div>

            <div v-if="autoSyncEnabled" class="form-control mb-4">
              <label class="label">
                <span class="label-text">Sync Interval</span>
              </label>
              <select 
                v-model.number="syncIntervalMinutes" 
                @change="saveSyncInterval"
                class="select select-bordered"
              >
                <option :value="0.5">30 seconds</option>
                <option :value="1">1 minute</option>
                <option :value="2">2 minutes</option>
                <option :value="5">5 minutes</option>
                <option :value="10">10 minutes</option>
                <option :value="15">15 minutes</option>
                <option :value="30">30 minutes</option>
                <option :value="60">1 hour</option>
              </select>
              <div class="label">
                <span class="label-text-alt text-base-content/60">
                  Next sync in: {{ nextSyncIn }}
                </span>
              </div>
            </div>
          </div>

          <div class="divider"></div>

          <div>
            <p class="mb-2">Export all data as JSON backup</p>
            <button @click="exportData" class="btn btn-secondary">
              Export Data
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Statistics -->
    <div class="card bg-base-100 shadow-xl mb-6">
      <div class="card-body">
        <h2 class="card-title mb-4">Statistics</h2>
        <div class="stats stats-vertical lg:stats-horizontal shadow w-full">
          <div class="stat">
            <div class="stat-title">Total Interventions</div>
            <div class="stat-value">{{ stats.totalInterventions }}</div>
          </div>
          <div class="stat">
            <div class="stat-title">Completed</div>
            <div class="stat-value text-success">{{ stats.completed }}</div>
          </div>
          <div class="stat">
            <div class="stat-title">In Progress</div>
            <div class="stat-value text-warning">{{ stats.inProgress }}</div>
          </div>
          <div class="stat">
            <div class="stat-title">Not Synced</div>
            <div class="stat-value text-error">{{ stats.notSynced }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Logout -->
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title mb-4">Account</h2>
        <button @click="logout" class="btn btn-error">
          Logout
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { db } from '../db/indexeddb'
import { supabase, syncInterventionToCloud, syncChecklistItemsToCloud, syncPhotoToCloud, syncCommentToCloud } from '../services/supabase'

const profile = ref({
  name: '',
  email: ''
})

const pdfSettings = ref({
  header: 'Intervention Report',
  logoUrl: ''
})

const isOnline = ref(navigator.onLine)
const syncing = ref(false)
const stats = ref({
  totalInterventions: 0,
  completed: 0,
  inProgress: 0,
  notSynced: 0
})

// Auto sync settings
const autoSyncEnabled = ref(true)
const syncIntervalMinutes = ref(5)
const lastSyncTime = ref(null)
let syncTimeInterval = null

// Compute next sync time display
const nextSyncIn = computed(() => {
  if (!autoSyncEnabled.value || !lastSyncTime.value) {
    return 'N/A'
  }
  
  const intervalMs = syncIntervalMinutes.value * 60 * 1000
  const elapsed = Date.now() - lastSyncTime.value
  const remaining = Math.max(0, intervalMs - elapsed)
  
  if (remaining === 0) {
    return 'Now'
  }
  
  const minutes = Math.floor(remaining / 60000)
  const seconds = Math.floor((remaining % 60000) / 1000)
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }
  return `${seconds}s`
})

function loadProfile() {
  const savedProfile = localStorage.getItem('userProfile')
  if (savedProfile) {
    profile.value = JSON.parse(savedProfile)
  }
}

function saveProfile() {
  localStorage.setItem('userProfile', JSON.stringify(profile.value))
  alert('Profile saved!')
}

function loadPdfSettings() {
  const saved = localStorage.getItem('pdfSettings')
  if (saved) {
    pdfSettings.value = JSON.parse(saved)
  }
}

function savePdfSettings() {
  localStorage.setItem('pdfSettings', JSON.stringify(pdfSettings.value))
  alert('PDF settings saved!')
}

function loadAutoSyncSettings() {
  const enabled = localStorage.getItem('autoSyncEnabled')
  autoSyncEnabled.value = enabled !== 'false' // Default: enabled
  
  const interval = localStorage.getItem('syncInterval')
  if (interval) {
    const intervalMs = parseInt(interval, 10)
    syncIntervalMinutes.value = intervalMs / (60 * 1000)
  } else {
    // Default: 5 minutes
    syncIntervalMinutes.value = 5
  }
  
  const lastSync = localStorage.getItem('lastSyncTime')
  if (lastSync) {
    lastSyncTime.value = parseInt(lastSync, 10)
  }
}

function saveAutoSyncSettings() {
  localStorage.setItem('autoSyncEnabled', autoSyncEnabled.value.toString())
  
  // Restart auto sync with new settings
  if (typeof window.restartAutoSync === 'function') {
    window.restartAutoSync()
  }
  
  alert('Auto sync settings saved!')
}

function saveSyncInterval() {
  const intervalMs = syncIntervalMinutes.value * 60 * 1000
  localStorage.setItem('syncInterval', intervalMs.toString())
  
  // Restart auto sync with new interval
  if (typeof window.restartAutoSync === 'function') {
    window.restartAutoSync()
  }
  
  alert('Sync interval updated!')
}

async function loadStats() {
  try {
    const all = await db.interventions.toArray()
    stats.value = {
      totalInterventions: all.length,
      completed: all.filter(i => i.status === 'Completed').length,
      inProgress: all.filter(i => i.status === 'In Progress').length,
      notSynced: all.filter(i => !i.synced).length
    }
  } catch (error) {
    console.error('Error loading stats:', error)
  }
}

async function manualSync() {
  if (!isOnline.value) {
    alert('You are offline. Please check your internet connection.')
    return
  }

  syncing.value = true
  try {
    const unsynced = await db.interventions.where('synced').equals(0).toArray()
    
    for (const intervention of unsynced) {
      try {
        await syncInterventionToCloud(intervention)
        
        // Sync related data
        const checklistItems = await db.checklist_items
          .where('intervention_id').equals(intervention.id)
          .toArray()
        if (checklistItems.length > 0) {
          await syncChecklistItemsToCloud(checklistItems)
        }
        
        const photos = await db.photos
          .where('intervention_id').equals(intervention.id)
          .toArray()
        for (const photo of photos) {
          if (photo.url_cloud) {
            await syncPhotoToCloud(photo)
          }
        }
        
        const comments = await db.comments
          .where('intervention_id').equals(intervention.id)
          .toArray()
        for (const comment of comments) {
          await syncCommentToCloud(comment)
        }
        
        intervention.synced = true
        await db.interventions.put(intervention)
      } catch (error) {
        console.error(`Error syncing intervention ${intervention.id}:`, error)
      }
    }
    
    alert(`Sync completed! ${unsynced.length} intervention(s) synced.`)
    await loadStats()
  } catch (error) {
    console.error('Error during sync:', error)
    alert('Error during sync. Please try again.')
  } finally {
    syncing.value = false
  }
}

async function exportData() {
  try {
    const data = {
      interventions: await db.interventions.toArray(),
      checklistItems: await db.checklist_items.toArray(),
      photos: await db.photos.toArray(),
      comments: await db.comments.toArray(),
      exportDate: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rapportexpress_backup_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error exporting data:', error)
    alert('Error exporting data. Please try again.')
  }
}

async function logout() {
  if (confirm('Are you sure you want to logout?')) {
    try {
      await supabase.auth.signOut()
      localStorage.clear()
      // Clear IndexedDB
      await db.delete()
      window.location.reload()
    } catch (error) {
      console.error('Error logging out:', error)
      // Still clear local storage even if Supabase logout fails
      localStorage.clear()
      window.location.reload()
    }
  }
}

function updateOnlineStatus() {
  isOnline.value = navigator.onLine
}

onMounted(() => {
  loadProfile()
  loadPdfSettings()
  loadAutoSyncSettings()
  loadStats()
  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)
  
  // Update last sync time display periodically
  syncTimeInterval = setInterval(() => {
    const lastSync = localStorage.getItem('lastSyncTime')
    if (lastSync) {
      lastSyncTime.value = parseInt(lastSync, 10)
    }
  }, 1000)
})

onUnmounted(() => {
  window.removeEventListener('online', updateOnlineStatus)
  window.removeEventListener('offline', updateOnlineStatus)
  
  // Clean up interval
  if (syncTimeInterval) {
    clearInterval(syncTimeInterval)
    syncTimeInterval = null
  }
})
</script>
