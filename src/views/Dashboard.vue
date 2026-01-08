<template>
  <div class="pt-20">
    <!-- Header with Icon - Fixed at Top -->
    <div class="fixed top-0 left-0 right-0 z-50 safe-area-top">
      <!-- Background with blur effect -->
      <div class="absolute inset-0 bg-base-100/95 backdrop-blur-xl border-b border-base-300"></div>
      
      <!-- Content -->
      <div class="relative container mx-auto px-4 py-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-success rounded-lg flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-success-content" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 class="text-3xl font-bold">Inspection Reports</h1>
        </div>
      </div>
    </div>

    <!-- Time Period Tabs - Join Component -->
    <div class="flex justify-center mb-2">
      <div class="join w-fit">
        <button
          @click="periodFilter = 'today'"
          :class="[
            'join-item btn btn-xs font-medium px-3 h-7',
            periodFilter === 'today' 
              ? 'btn-success text-white' 
              : 'bg-base-100 text-base-content border-base-300'
          ]"
        >
          Today
        </button>
        <button
          @click="periodFilter = 'thisWeek'"
          :class="[
            'join-item btn btn-xs font-medium px-3 h-7',
            periodFilter === 'thisWeek' 
              ? 'btn-success text-white' 
              : 'bg-base-100 text-base-content border-base-300'
          ]"
        >
          This Week
        </button>
        <button
          @click="periodFilter = 'thisMonth'"
          :class="[
            'join-item btn btn-xs font-medium px-3 h-7',
            periodFilter === 'thisMonth' 
              ? 'btn-success text-white' 
              : 'bg-base-100 text-base-content border-base-300'
          ]"
        >
          This Month
        </button>
      </div>
    </div>

    <!-- Status Filter Buttons - Join Component -->
    <div class="flex justify-center mb-3">
      <div class="join w-fit">
        <button
          @click="statusFilter = 'In Progress'"
          :class="[
            'join-item btn btn-xs font-medium px-3 h-7',
            statusFilter === 'In Progress' 
              ? 'btn-info text-white' 
              : 'bg-base-100 text-base-content border-base-300'
          ]"
        >
          In Progress
        </button>
        <button
          @click="statusFilter = 'Completed'"
          :class="[
            'join-item btn btn-xs font-medium px-3 h-7',
            statusFilter === 'Completed' 
              ? 'btn-success text-white' 
              : 'bg-base-100 text-base-content border-base-300'
          ]"
        >
          Completed
        </button>
      </div>
    </div>

    <!-- Search Bar -->
    <div class="mb-4">
      <div class="relative">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Search client or site..."
          class="input input-bordered w-full pl-10"
        />
      </div>
    </div>

    <!-- Interventions List -->
    <div v-if="loading" class="text-center py-8">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else-if="filteredInterventions.length === 0" class="card bg-base-100 shadow-xl">
      <div class="card-body text-center">
        <p class="text-lg">No interventions found</p>
        <p class="text-sm text-base-content/70 mt-2">Use the + button below to create your first intervention</p>
      </div>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="intervention in filteredInterventions"
        :key="intervention.id"
        class="bg-base-100 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer p-4"
        @click="goToDetail(intervention.id)"
        @contextmenu.prevent="showContextMenu($event, intervention)"
        @touchstart="handleTouchStart(intervention, $event)"
        @touchend="handleTouchEnd"
      >
        <div class="flex justify-between items-start gap-3">
          <div class="flex-1 min-w-0">
            <h3 class="font-semibold text-base mb-1">{{ intervention.client_name || 'Unnamed Client' }}</h3>
            <p class="text-sm text-base-content/70 mb-2">{{ formatDateShort(intervention.date) }}</p>
            <p class="text-xs text-base-content/50">Long-press for options...</p>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            <span
              :class="[
                'badge badge-sm font-medium',
                intervention.status === 'Completed' ? 'badge-success' :
                'badge-warning'
              ]"
            >
              {{ intervention.status || 'In Progress' }}
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Context Menu -->
    <div
      v-if="contextMenu.show"
      class="fixed bg-base-100 rounded-lg shadow-xl border border-base-300 z-50 min-w-[200px]"
      :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
      @click.stop
    >
      <div class="p-2">
        <button
          @click="duplicateIntervention(contextMenu.intervention)"
          class="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-base-200 transition-colors text-left"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-base-content/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span>Duplicate Report</span>
        </button>
        <button
          @click="deleteInterventionFromList(contextMenu.intervention)"
          class="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-base-200 transition-colors text-left text-error"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span>Delete Report</span>
        </button>
      </div>
    </div>

    <!-- Backdrop to close context menu -->
    <div
      v-if="contextMenu.show"
      class="fixed inset-0 z-40"
      @click="contextMenu.show = false"
    ></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '../db/indexeddb'
import { generateUUID } from '../utils/uuid'

// Component name for keep-alive
defineOptions({
  name: 'Dashboard'
})

const router = useRouter()
const interventions = ref([])
const loading = ref(true)
const searchQuery = ref('')
const statusFilter = ref('In Progress')
const periodFilter = ref('today')
const dateFrom = ref('')
const dateTo = ref('')

// Context menu state
const contextMenu = ref({
  show: false,
  x: 0,
  y: 0,
  intervention: null
})

// Long-press detection
let touchTimer = null
const LONG_PRESS_DURATION = 500 // milliseconds

const filteredInterventions = computed(() => {
  let filtered = [...interventions.value]

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(i =>
      (i.client_name || '').toLowerCase().includes(query)
    )
  }

  // Status filter
  if (statusFilter.value) {
    filtered = filtered.filter(i => i.status === statusFilter.value)
  }

  // Period/Date range filter
  if (periodFilter.value && periodFilter.value !== 'custom') {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    let startDate = new Date()
    let endDate = new Date()
    endDate.setHours(23, 59, 59, 999)
    
    switch (periodFilter.value) {
      case 'today':
        startDate = new Date(today)
        break
      case 'yesterday':
        startDate = new Date(today)
        startDate.setDate(startDate.getDate() - 1)
        endDate = new Date(startDate)
        endDate.setHours(23, 59, 59, 999)
        break
      case 'thisWeek':
        startDate = new Date(today)
        startDate.setDate(today.getDate() - today.getDay()) // Start of week (Sunday)
        break
      case 'lastWeek':
        startDate = new Date(today)
        startDate.setDate(today.getDate() - today.getDay() - 7) // Start of last week
        endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + 6)
        endDate.setHours(23, 59, 59, 999)
        break
      case 'thisMonth':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1)
        break
      case 'lastMonth':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        endDate = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999)
        break
    }
    
    filtered = filtered.filter(i => {
      const interventionDate = new Date(i.date)
      return interventionDate >= startDate && interventionDate <= endDate
    })
  } else if (periodFilter.value === 'custom' && (dateFrom.value || dateTo.value)) {
    // Custom date range
    const from = dateFrom.value ? new Date(dateFrom.value) : new Date(0)
    from.setHours(0, 0, 0, 0)
    const to = dateTo.value ? new Date(dateTo.value) : new Date()
    to.setHours(23, 59, 59, 999)
    
    filtered = filtered.filter(i => {
      const interventionDate = new Date(i.date)
      return interventionDate >= from && interventionDate <= to
    })
  }

  // Sort by date (newest first)
  return filtered.sort((a, b) => new Date(b.date) - new Date(a.date))
})

async function loadInterventions() {
  try {
    loading.value = true
    const all = await db.interventions.toArray()
    interventions.value = all
  } catch (error) {
    console.error('[Dashboard] Error loading interventions:', error)
    // Don't let errors cause the component to remount
  } finally {
    loading.value = false
  }
}

function formatDateShort(dateString) {
  if (!dateString) return 'No date'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

function goToDetail(id) {
  if (!contextMenu.value.show) {
    router.push(`/interventions/${id}`)
  }
}

function showContextMenu(event, intervention) {
  contextMenu.value = {
    show: true,
    x: event.clientX,
    y: event.clientY,
    intervention
  }
}

function handleTouchStart(intervention, event) {
  touchTimer = setTimeout(() => {
    const touch = event.touches[0]
    contextMenu.value = {
      show: true,
      x: touch.clientX,
      y: touch.clientY,
      intervention
    }
    // Prevent default click action
    event.preventDefault()
  }, LONG_PRESS_DURATION)
}

function handleTouchEnd() {
  if (touchTimer) {
    clearTimeout(touchTimer)
    touchTimer = null
  }
}

async function duplicateIntervention(intervention) {
  if (!intervention) return
  
  contextMenu.value.show = false
  
  try {
    const newId = generateUUID()
    const now = new Date().toISOString()
    
    // Create duplicate
    const duplicate = {
      id: newId,
      client_name: `${intervention.client_name} (Copy)`,
      date: now,
      status: 'In Progress',
      created_at: now,
      updated_at: now,
      synced: false,
      checklist_items: Array.isArray(intervention.checklist_items) 
        ? JSON.parse(JSON.stringify(intervention.checklist_items))
        : [],
      comments: Array.isArray(intervention.comments)
        ? JSON.parse(JSON.stringify(intervention.comments))
        : []
    }
    
    await db.interventions.put(duplicate)
    
    // Duplicate photos
    const photos = await db.photos
      .where('intervention_id').equals(intervention.id)
      .toArray()
    
    for (const photo of photos) {
      await db.photos.put({
        id: generateUUID(),
        intervention_id: newId,
        url_local: photo.url_local || '',
        url_cloud: null, // Will need to re-upload
        description: photo.description || '',
        taken_at: photo.taken_at || now
      })
    }
    
    await loadInterventions()
    router.push(`/interventions/${newId}/edit`)
  } catch (error) {
    console.error('Error duplicating intervention:', error)
    alert('Error duplicating report. Please try again.')
  }
}

async function deleteInterventionFromList(intervention) {
  if (!intervention) return
  
  contextMenu.value.show = false
  
  const confirmed = confirm(
    `Are you sure you want to delete this report?\n\n` +
    `Client: ${intervention.client_name}\n\n` +
    `This action cannot be undone.`
  )
  
  if (!confirmed) return
  
  try {
    const interventionId = intervention.id
    
    // Delete from IndexedDB
    await db.photos.where('intervention_id').equals(interventionId).delete()
    await db.interventions.delete(interventionId)
    
    // Try to delete from cloud if synced
    if (intervention.synced) {
      try {
        const { deleteInterventionFromCloud } = await import('../services/supabase')
        await deleteInterventionFromCloud(interventionId)
      } catch (error) {
        console.error('Error deleting from cloud:', error)
      }
    }
    
    await loadInterventions()
  } catch (error) {
    console.error('Error deleting intervention:', error)
    alert('Error deleting report. Please try again.')
  }
}

function updateDateFilterFromPeriod() {
  // Clear custom date inputs when switching away from custom
  if (periodFilter.value !== 'custom') {
    dateFrom.value = ''
    dateTo.value = ''
  }
}

// Listen for sync completion events to refresh data
function handleSyncCompleted() {
  loadInterventions()
}

onMounted(() => {
  loadInterventions()
  // Listen for sync completion events
  window.addEventListener('syncCompleted', handleSyncCompleted)
})

// Refresh data when component is activated (user navigates back to Dashboard)
onActivated(() => {
  loadInterventions()
})

onUnmounted(() => {
  // Clean up event listener
  window.removeEventListener('syncCompleted', handleSyncCompleted)
})
</script>
