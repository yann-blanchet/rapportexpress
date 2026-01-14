<template>
  <div class="fixed inset-0 overflow-hidden">
    <!-- Header with Icon - Fixed at Top (matching Dashboard design) -->
    <div class="fixed top-0 left-0 right-0 z-50 safe-area-top bg-base-100/95 backdrop-blur-xl border-b-2 border-base-300" ref="headerRef">
      <!-- Content -->
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-success rounded-lg flex items-center justify-center">
              <img src="/favicon-96x96.png" alt="App Icon" class="h-6 w-6" />
            </div>
            <h1 class="text-2xl font-bold">Settings</h1>
          </div>
          <SyncIndicator />
        </div>
      </div>
    </div>

    <!-- Content - Scrollable between header and footer -->
    <div 
      class="absolute left-0 right-0 overflow-hidden"
      :style="{ top: `${headerHeight}px`, bottom: `${bottomBarHeight}px` }"
    >
      <div class="h-full w-full overflow-y-auto px-4 py-4" style="overscroll-behavior: contain; -webkit-overflow-scrolling: touch;">
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
        @click="activeTab = 'stats'"
        :class="['tab', activeTab === 'stats' ? 'tab-active' : '']"
      >
        Stats
      </button>
      <button
        type="button"
        @click="activeTab = 'about'"
        :class="['tab', activeTab === 'about' ? 'tab-active' : '']"
      >
        About
      </button>
    </div>

    <!-- Tab Content -->
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <!-- Profile Tab -->
        <div v-show="activeTab === 'profile'" class="space-y-4">
          <!-- Theme Settings -->
          <div>
            <label class="label py-1">
              <span class="label-text font-semibold">Theme</span>
            </label>
            <div ref="dropdownContainer" class="dropdown dropdown-end">
              <div ref="dropdownButton" tabindex="0" role="button" class="btn btn-outline btn-sm w-full justify-between">
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
          </div>

          <!-- User Profile (Readonly) -->
          <div>
            <label class="label py-1">
              <span class="label-text font-semibold">Name</span>
            </label>
            <input
              type="text"
              :value="profile.name || 'Not set'"
              readonly
              class="input input-bordered input-sm w-full bg-base-200"
            />
          </div>

          <div>
            <label class="label py-1">
              <span class="label-text font-semibold">Email</span>
            </label>
            <input
              type="email"
              :value="profile.email || 'Not set'"
              readonly
              class="input input-bordered input-sm w-full bg-base-200"
            />
          </div>

          <!-- Trade Selection (Readonly) -->
          <div>
            <label class="label py-1">
              <span class="label-text font-semibold">Trade / Job Type</span>
            </label>
            <input
              type="text"
              :value="selectedTrade ? tradeNames[selectedTrade] : 'Not set'"
              readonly
              class="input input-bordered input-sm w-full bg-base-200"
            />
          </div>

          <!-- PDF Settings (Readonly) -->
          <div>
            <label class="label py-1">
              <span class="label-text font-semibold">PDF Header Text</span>
            </label>
            <input
              type="text"
              :value="pdfSettings.header || 'Not set'"
              readonly
              class="input input-bordered input-sm w-full bg-base-200"
            />
          </div>

          <div>
            <label class="label py-1">
              <span class="label-text font-semibold">PDF Logo URL</span>
            </label>
            <input
              type="url"
              :value="pdfSettings.logoUrl || 'Not set'"
              readonly
              class="input input-bordered input-sm w-full bg-base-200"
            />
          </div>

          <button @click="goToProfileEdit" class="btn btn-success btn-sm w-full">
            Edit Profile
          </button>

          <div class="divider my-2"></div>

          <!-- Logout -->
          <button @click="logout" class="btn btn-error btn-sm w-full">
            Logout
          </button>
        </div>

        <!-- Stats Tab -->
        <div v-show="activeTab === 'stats'" class="space-y-4">
          <h2 class="card-title mb-2">Statistics</h2>
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

          <div class="divider"></div>

          <!-- Export Data -->
          <div>
            <h3 class="font-semibold text-sm mb-2">Data Export</h3>
            <p class="text-xs text-base-content/60 mb-3">Export all your data as a JSON backup file</p>
            <button @click="exportData" class="btn btn-secondary btn-sm w-full">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Data as JSON
            </button>
          </div>
        </div>

        <!-- About Tab -->
        <div v-show="activeTab === 'about'" class="space-y-4">
          <h2 class="card-title mb-2">About</h2>
          
          <div class="space-y-3">
            <div>
              <div class="flex items-center gap-3 mb-3">
                <div class="w-12 h-12 bg-success rounded-lg flex items-center justify-center">
                  <img src="/favicon-96x96.png" alt="App Icon" class="h-8 w-8" />
                </div>
                <div>
                  <h3 class="font-bold text-lg">RapportExpress</h3>
                  <p class="text-sm text-base-content/60">Version {{ appVersion }}</p>
                </div>
              </div>
            </div>

            <div class="divider"></div>

            <div>
              <h4 class="font-semibold text-sm mb-2">Description</h4>
              <p class="text-sm text-base-content/70">
                A mobile-first inspection report application for creating, managing, and exporting intervention reports with photos, audio transcriptions, and compliance tracking.
              </p>
            </div>

            <div class="divider"></div>

            <div>
              <h4 class="font-semibold text-sm mb-2">Technologies</h4>
              <div class="flex flex-wrap gap-2">
                <span class="badge badge-sm">Vue.js 3</span>
                <span class="badge badge-sm">IndexedDB</span>
                <span class="badge badge-sm">Supabase</span>
                <span class="badge badge-sm">PWA</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '../db/indexeddb'
import { loadProfile, updateProfile } from '../services/profile'
import SyncIndicator from '../components/SyncIndicator.vue'
import { TRADES, TRADE_NAMES, getSelectedTrade, setSelectedTrade, loadTradeFromCloud } from '../utils/categories'

const router = useRouter()

// Layout refs and heights
const headerRef = ref(null)
const headerHeight = ref(64) // Default height
const bottomBarHeight = ref(80) // Default height for bottom menu bar (if exists)

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

// Trade selection
const selectedTrade = ref(null)
const tradeNames = TRADE_NAMES

const pdfSettings = ref({
  header: 'Intervention Report',
  logoUrl: ''
})

const stats = ref({
  totalInterventions: 0,
  completed: 0,
  inProgress: 0,
  notSynced: 0
})

const appVersion = ref('1.0.0')

let themeMediaQuery = null

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

async function loadProfileSettings() {
  // Load local profile (name, email)
  const savedProfile = localStorage.getItem('userProfile')
  if (savedProfile) {
    profile.value = JSON.parse(savedProfile)
  }
  
  // Load PDF settings from profile service
  try {
    const userProfile = await loadProfile()
    if (userProfile) {
      if (userProfile.pdf_header) {
        pdfSettings.value.header = userProfile.pdf_header
      }
      if (userProfile.pdf_logo_url) {
        pdfSettings.value.logoUrl = userProfile.pdf_logo_url
      }
      // Also load name and email if available
      if (userProfile.name) {
        profile.value.name = userProfile.name
      }
      if (userProfile.email) {
        profile.value.email = userProfile.email
      }
    }
  } catch (error) {
    console.warn('[Settings] Error loading profile:', error)
    // Fallback to localStorage for PDF settings
    const saved = localStorage.getItem('pdfSettings')
    if (saved) {
      pdfSettings.value = JSON.parse(saved)
    }
  }
}

async function loadTrade() {
  try {
    // Try to load from profile first (if authenticated)
    const trade = await loadTradeFromCloud()
    selectedTrade.value = trade || null
  } catch (error) {
    console.warn('[Settings] Error loading trade:', error)
    // Fallback to localStorage
    selectedTrade.value = getSelectedTrade()
  }
}

async function saveTrade() {
  if (selectedTrade.value) {
    try {
      await setSelectedTrade(selectedTrade.value, true) // Sync to profile
      alert('Trade selection saved! Categories will now be based on your trade.')
    } catch (error) {
      console.error('[Settings] Error saving trade:', error)
      alert('Trade saved locally. Will sync to cloud when online.')
    }
  }
}

function goToProfileEdit() {
  router.push('/profile/edit')
}

async function saveProfile() {
  // Save local profile (name, email)
  localStorage.setItem('userProfile', JSON.stringify(profile.value))
  
  // Save PDF settings and profile to cloud profile
  try {
    await updateProfile({
      name: profile.value.name || null,
      email: profile.value.email || null,
      pdf_header: pdfSettings.value.header || null,
      pdf_logo_url: pdfSettings.value.logoUrl || null
    })
    alert('Profile saved!')
  } catch (error) {
    console.error('[Settings] Error saving profile:', error)
    // Still save PDF settings locally as fallback
    localStorage.setItem('pdfSettings', JSON.stringify(pdfSettings.value))
    alert('Profile saved locally. Will sync to cloud when online.')
  }
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

async function exportData() {
  try {
    const data = {
      interventions: await db.interventions.toArray(),
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
      const { signOut } = await import('../services/auth')
      await signOut()
      // Clear local data
      localStorage.clear()
      // Clear IndexedDB
      await db.delete()
      // Redirect to login
      window.location.href = '/login'
    } catch (error) {
      console.error('Error logging out:', error)
      // Still clear local storage even if logout fails
      localStorage.clear()
      window.location.href = '/login'
    }
  }
}


onMounted(() => {
  // Prevent body scroll
  document.body.style.overflow = 'hidden'
  document.documentElement.style.overflow = 'hidden'
  
  // Measure header height
  nextTick(() => {
    if (headerRef.value) {
      headerHeight.value = headerRef.value.offsetHeight
    }
  })
  
  loadTheme()
  loadProfileSettings()
  loadTrade()
  loadStats()
  
  // Listen for system theme changes if in auto mode
  themeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  themeMediaQuery.addEventListener('change', applyTheme)
})

onUnmounted(() => {
  // Restore body scroll
  document.body.style.overflow = ''
  document.documentElement.style.overflow = ''
  
  // Clean up theme listener
  if (themeMediaQuery) {
    themeMediaQuery.removeEventListener('change', applyTheme)
    themeMediaQuery = null
  }
})
</script>
