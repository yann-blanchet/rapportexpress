<template>
  <div class="fixed inset-0 overflow-hidden">
    <!-- Header with Back Button -->
    <div class="fixed top-0 left-0 right-0 z-50 safe-area-top bg-base-100/95 backdrop-blur-xl border-b-2 border-base-300" ref="headerRef">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center gap-3">
          <button
            @click="goBack"
            class="btn btn-ghost btn-sm btn-circle"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 class="text-2xl font-bold">Edit Profile</h1>
        </div>
      </div>
    </div>

    <!-- Content - Scrollable between header and footer -->
    <div 
      class="absolute left-0 right-0 overflow-hidden"
      :style="{ top: `${headerHeight}px`, bottom: `${bottomBarHeight}px` }"
    >
      <div class="h-full w-full overflow-y-auto px-4 py-4" style="overscroll-behavior: contain; -webkit-overflow-scrolling: touch;">
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body space-y-4">
            <!-- Name -->
            <div>
              <label class="label py-1">
                <span class="label-text font-semibold">Name</span>
              </label>
              <input
                type="text"
                v-model="profile.name"
                placeholder="Your name"
                class="input input-bordered w-full"
              />
            </div>

            <!-- Email -->
            <div>
              <label class="label py-1">
                <span class="label-text font-semibold">Email</span>
              </label>
              <input
                type="email"
                v-model="profile.email"
                placeholder="your.email@example.com"
                class="input input-bordered w-full"
              />
            </div>

            <!-- Trade Selection -->
            <div>
              <label class="label py-1">
                <span class="label-text font-semibold">Trade / Job Type</span>
              </label>
              <select
                v-model="selectedTrade"
                class="select select-bordered w-full"
              >
                <option :value="null" disabled>Select a trade...</option>
                <option
                  v-for="(name, id) in tradeNames"
                  :key="id"
                  :value="id"
                >
                  {{ name }}
                </option>
              </select>
            </div>

            <div class="divider"></div>

            <!-- PDF Settings -->
            <h3 class="font-semibold text-lg">PDF Settings</h3>

            <!-- PDF Header Text -->
            <div>
              <label class="label py-1">
                <span class="label-text font-semibold">PDF Header Text</span>
              </label>
              <input
                type="text"
                v-model="pdfSettings.header"
                placeholder="Company name or header text"
                class="input input-bordered w-full"
              />
            </div>

            <!-- PDF Logo URL -->
            <div>
              <label class="label py-1">
                <span class="label-text font-semibold">PDF Logo URL (optional)</span>
              </label>
              <input
                type="url"
                v-model="pdfSettings.logoUrl"
                placeholder="https://example.com/logo.png"
                class="input input-bordered w-full"
              />
            </div>

            <!-- Save Button -->
            <div class="pt-4">
              <button 
                @click="saveProfile" 
                class="btn btn-success w-full"
                :disabled="saving"
              >
                <span v-if="saving" class="loading loading-spinner loading-sm"></span>
                {{ saving ? 'Saving...' : 'Save Profile' }}
              </button>
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
import { loadProfile, updateProfile } from '../services/profile'
import { TRADE_NAMES, getSelectedTrade, setSelectedTrade, loadTradeFromCloud } from '../utils/categories'

const router = useRouter()

// Layout refs and heights
const headerRef = ref(null)
const headerHeight = ref(64) // Default height
const bottomBarHeight = ref(80) // Default height for bottom menu bar

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

const saving = ref(false)

function goBack() {
  router.push('/settings')
}

async function loadProfileData() {
  // Load local profile (name, email)
  const savedProfile = localStorage.getItem('userProfile')
  if (savedProfile) {
    profile.value = JSON.parse(savedProfile)
  }
  
  // Load PDF settings and profile from profile service
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
    console.warn('[ProfileEdit] Error loading profile:', error)
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
    console.warn('[ProfileEdit] Error loading trade:', error)
    // Fallback to localStorage
    selectedTrade.value = getSelectedTrade()
  }
}

async function saveProfile() {
  saving.value = true
  
  try {
    // Save local profile (name, email)
    localStorage.setItem('userProfile', JSON.stringify(profile.value))
    
    // Save trade if selected
    if (selectedTrade.value) {
      await setSelectedTrade(selectedTrade.value, true) // Sync to profile
    }
    
    // Save PDF settings and profile to cloud profile
    await updateProfile({
      name: profile.value.name || null,
      email: profile.value.email || null,
      pdf_header: pdfSettings.value.header || null,
      pdf_logo_url: pdfSettings.value.logoUrl || null
    })
    
    alert('Profile saved successfully!')
    router.push('/settings')
  } catch (error) {
    console.error('[ProfileEdit] Error saving profile:', error)
    // Still save PDF settings locally as fallback
    localStorage.setItem('pdfSettings', JSON.stringify(pdfSettings.value))
    alert('Profile saved locally. Will sync to cloud when online.')
  } finally {
    saving.value = false
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
  
  loadProfileData()
  loadTrade()
})

onUnmounted(() => {
  // Restore body scroll
  document.body.style.overflow = ''
  document.documentElement.style.overflow = ''
})
</script>
