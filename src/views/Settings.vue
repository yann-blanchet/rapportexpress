<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-3xl font-bold">Settings</h1>
      <SyncIndicator />
    </div>

    <!-- Tab Bar -->
    <div class="tabs tabs-lifted mb-4">
      <button
        type="button"
        @click="activeTab = 'profile'"
        :class="['tab', activeTab === 'profile' ? 'tab-active' : '']"
      >
        Profile
      </button>
      <button
        type="button"
        @click="activeTab = 'pdf'"
        :class="['tab', activeTab === 'pdf' ? 'tab-active' : '']"
      >
        PDF
      </button>
      <button
        type="button"
        @click="activeTab = 'sync'"
        :class="['tab', activeTab === 'sync' ? 'tab-active' : '']"
      >
        Sync
      </button>
      <button
        type="button"
        @click="activeTab = 'stats'"
        :class="['tab', activeTab === 'stats' ? 'tab-active' : '']"
      >
        Stats
      </button>
      <button
        type="button"
        @click="activeTab = 'account'"
        :class="['tab', activeTab === 'account' ? 'tab-active' : '']"
      >
        Account
      </button>
    </div>

    <!-- Tab Content -->
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <!-- Profile Tab -->
        <div v-show="activeTab === 'profile'">
          <!-- Theme Settings -->
          <h2 class="card-title mb-4">Theme</h2>
        
        <div ref="dropdownContainer" class="dropdown dropdown-end">
          <div ref="dropdownButton" tabindex="0" role="button" class="btn btn-outline w-full justify-between">
            <span>{{ getThemeLabel(themeMode) }}</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <ul ref="dropdownMenu" tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-[1] w-full p-2 shadow-lg border border-base-300">
            <li>
              <a 
                @click="setThemeMode('auto', $event)"
                :class="{ 'active': themeMode === 'auto' }"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Auto (System)
              </a>
            </li>
            <li>
              <a 
                @click="setThemeMode('light', $event)"
                :class="{ 'active': themeMode === 'light' }"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Light
              </a>
            </li>
            <li>
              <a 
                @click="setThemeMode('dark', $event)"
                :class="{ 'active': themeMode === 'dark' }"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
                Dark
              </a>
            </li>
          </ul>
        </div>
          <div class="label mt-2">
            <span class="label-text-alt text-base-content/60">
              Current theme: {{ currentTheme }}
            </span>
          </div>

          <div class="divider"></div>

          <!-- User Profile -->
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

        <!-- PDF Tab -->
        <div v-show="activeTab === 'pdf'">
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

        <!-- Sync Tab -->
        <div v-show="activeTab === 'sync'">
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

        <!-- Stats Tab -->
        <div v-show="activeTab === 'stats'">
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

        <!-- Account Tab -->
        <div v-show="activeTab === 'account'">
          <h2 class="card-title mb-4">Account</h2>
          <button @click="logout" class="btn btn-error">
            Logout
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { db } from '../db/indexeddb'
import { supabase, syncInterventionToCloud, syncPhotoToCloud, syncFromCloud } from '../services/supabase'
import SyncIndicator from '../components/SyncIndicator.vue'

const activeTab = ref('profile')
const themeMode = ref('auto')
const currentTheme = ref('light')
const dropdownButton = ref(null)
const dropdownMenu = ref(null)
const dropdownContainer = ref(null)

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
let themeMediaQuery = null

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

function loadTheme() {
  const saved = localStorage.getItem('themeMode')
  if (saved) {
    themeMode.value = saved
  }
  applyTheme()
}

function applyTheme() {
  if (themeMode.value === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    currentTheme.value = prefersDark ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', currentTheme.value)
  } else {
    currentTheme.value = themeMode.value
    document.documentElement.setAttribute('data-theme', themeMode.value)
  }
}

function getThemeLabel(mode) {
  switch(mode) {
    case 'auto': return 'Auto (System)'
    case 'light': return 'Light'
    case 'dark': return 'Dark'
    default: return 'Auto (System)'
  }
}

function setThemeMode(mode, event) {
  if (event) {
    event.preventDefault()
    event.stopPropagation()
  }
  themeMode.value = mode
  saveTheme()
  // Close dropdown by removing focus
  nextTick(() => {
    // Remove focus from any element in the dropdown
    if (dropdownButton.value) {
      dropdownButton.value.blur()
    }
    if (dropdownMenu.value) {
      dropdownMenu.value.blur()
    }
    // Remove tabindex temporarily to force close
    if (dropdownButton.value) {
      const originalTabindex = dropdownButton.value.getAttribute('tabindex')
      dropdownButton.value.removeAttribute('tabindex')
      setTimeout(() => {
        if (dropdownButton.value) {
          dropdownButton.value.setAttribute('tabindex', originalTabindex || '0')
        }
      }, 50)
    }
  })
}

function saveTheme() {
  localStorage.setItem('themeMode', themeMode.value)
  applyTheme()
  // Notify main.js to update theme
  window.dispatchEvent(new CustomEvent('themeChanged'))
}

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
  // Dispatch sync started event
  window.dispatchEvent(new CustomEvent('syncStarted'))
  
  try {
    // First, pull data from Supabase
    const fromCloud = await syncFromCloud(db)
    
    // Then, push local unsynced data to cloud
    const unsynced = await db.interventions.where('synced').equals(0).toArray()
    let syncedToCloud = 0
    
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
        syncedToCloud++
      } catch (error) {
        console.error(`Error syncing intervention ${intervention.id}:`, error)
      }
    }
    
    // Show sync results
    const messages = []
    if (fromCloud.interventions > 0 || fromCloud.photos > 0) {
      messages.push(`Synced from cloud: ${fromCloud.interventions} intervention(s), ${fromCloud.photos} photo(s)`)
    }
    if (syncedToCloud > 0) {
      messages.push(`Synced to cloud: ${syncedToCloud} intervention(s)`)
    }
    
    if (messages.length > 0) {
      alert(`Sync completed!\n\n${messages.join('\n')}`)
    } else {
      alert('Sync completed! No changes to sync.')
    }
    
    // Notify components that sync completed
    window.dispatchEvent(new CustomEvent('syncCompleted', { 
      detail: { fromCloud, toCloud: { interventions: syncedToCloud } } 
    }))
    
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
      // Note: checklist_items and comments are now in interventions.checklist_items and interventions.comments
      photos: await db.photos.toArray(),
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
  loadTheme()
  loadProfile()
  loadPdfSettings()
  loadAutoSyncSettings()
  loadStats()
  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)
  
  // Listen for system theme changes if in auto mode
  themeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  themeMediaQuery.addEventListener('change', applyTheme)
  
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
  
  // Clean up theme listener
  if (themeMediaQuery) {
    themeMediaQuery.removeEventListener('change', applyTheme)
    themeMediaQuery = null
  }
})
</script>
