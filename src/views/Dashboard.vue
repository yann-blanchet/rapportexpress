<template>
  <div class="pt-16">
    <!-- Header with Icon - Fixed at Top -->
    <div class="fixed top-0 left-0 right-0 z-50 safe-area-top">
      <!-- Background with blur effect -->
      <div class="absolute inset-0 bg-base-100/95 backdrop-blur-xl border-b-2 border-base-300"></div>
      
      <!-- Content -->
      <div class="relative container mx-auto px-4 py-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-success rounded-lg flex items-center justify-center">
            <img src="/favicon-96x96.png" alt="App Icon" class="h-6 w-6" />
          </div>
          <h1 class="text-2xl font-bold">Inspection Reports</h1>
        </div>
      </div>
    </div>

    <!-- Time Period Tabs - Join Component -->
    <div class="flex justify-center mb-2">
      <div class="join w-fit">
        <button
          @click="periodFilter = 'All'"
          :class="[
            'join-item btn btn-xs font-medium px-3 h-7',
            periodFilter === 'All' 
              ? 'btn-success text-white' 
              : 'bg-base-100 text-base-content border-base-300'
          ]"
        >
          All
        </button>
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
          @click="statusFilter = 'All'"
          :class="[
            'join-item btn btn-xs font-medium px-3 h-7',
            statusFilter === 'All' 
              ? 'btn-success text-white' 
              : 'bg-base-100 text-base-content border-base-300'
          ]"
        >
          All
        </button>
        <button
          @click="statusFilter = 'In Progress'"
          :class="[
            'join-item btn btn-xs font-medium px-3 h-7',
            statusFilter === 'In Progress' 
              ? 'btn-success text-white' 
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
        v-for="(intervention, index) in filteredInterventions"
        :key="intervention.id"
        class="bg-base-100 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer p-4"
        @click="goToDetail(intervention)"
        @contextmenu.prevent="showContextMenu($event, intervention)"
        @touchstart="handleTouchStart(intervention, $event)"
        @touchend="handleTouchEnd"
      >
        <div class="flex justify-between items-start gap-3">
          <div class="flex-1 min-w-0">
            <h3 class="font-semibold text-base mb-1">{{ intervention.client_name || 'Unnamed Client' }}</h3>
            <p class="text-sm text-base-content/70 mb-2">{{ formatDateShort(intervention.date) }}</p>
            <div v-if="intervention.tags && intervention.tags.length > 0" class="flex flex-wrap gap-1">
              <span
                v-for="tag in intervention.tags"
                :key="tag"
                class="badge badge-sm badge-outline"
              >
                {{ tag }}
              </span>
            </div>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            <span
              :class="[
                'badge badge-sm font-medium border border-base-content px-3 py-2.5 h-8',
                intervention.status === 'Completed' ? 'badge-success' :
                'badge-warning'
              ]"
            >
              {{ intervention.status || 'In Progress' }}
            </span>
            <button
              @click.stop="openActionSheet(intervention)"
              class="btn btn-ghost btn-sm btn-circle p-0 min-h-0 h-8 w-8"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
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

    <!-- Action Bottom Sheet -->
    <div
      v-if="actionSheet.show"
      class="fixed inset-0 z-[60] flex items-end"
      @click="actionSheet.show = false"
    >
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/50" @click="actionSheet.show = false"></div>
      
      <!-- Sheet Content -->
      <div
        class="relative bg-base-100 rounded-t-3xl w-full shadow-2xl safe-area-bottom"
        @click.stop
      >
        <div class="p-4">
          <!-- Handle -->
          <div class="w-12 h-1 bg-base-300 rounded-full mx-auto mb-4"></div>
          
          <!-- Actions -->
          <div class="space-y-2">
            <button
              @click="handleDuplicate"
              class="w-full flex items-center gap-4 px-4 py-4 rounded-lg hover:bg-base-200 transition-colors text-left"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-base-content/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span class="font-medium">Duplicate</span>
            </button>
            
            <button
              @click="handleExport"
              class="w-full flex items-center gap-4 px-4 py-4 rounded-lg hover:bg-base-200 transition-colors text-left"
              :disabled="exportingPDF"
            >
              <span v-if="exportingPDF" class="loading loading-spinner loading-sm"></span>
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-base-content/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span class="font-medium">{{ exportingPDF ? 'Exporting...' : 'Export PDF' }}</span>
            </button>
            
            <button
              @click="handleDelete"
              class="w-full flex items-center gap-4 px-4 py-4 rounded-lg hover:bg-base-200 transition-colors text-left text-error"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span class="font-medium">Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Bottom Sheet -->
    <div
      v-if="deleteConfirm.show"
      class="fixed inset-0 z-[60] flex items-end"
      @click="deleteConfirm.show = false"
    >
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/50" @click="deleteConfirm.show = false"></div>
      
      <!-- Sheet Content -->
      <div
        class="relative bg-base-100 rounded-t-3xl w-full shadow-2xl safe-area-bottom"
        @click.stop
      >
        <div class="p-6">
          <!-- Handle -->
          <div class="w-12 h-1 bg-base-300 rounded-full mx-auto mb-6"></div>
          
          <h3 class="text-xl font-bold mb-2">
            Delete report {{ deleteConfirm.intervention?.client_name || 'Unnamed Client' }}?
          </h3>
          <p class="text-base-content/70 mb-6">
            Are you sure you want to delete this report? This action cannot be undone.
          </p>
          
          <div class="flex gap-3">
            <button
              @click="deleteConfirm.show = false"
              class="btn btn-ghost flex-1"
            >
              Cancel
            </button>
            <button
              @click="confirmDelete"
              class="btn btn-error flex-1"
              :disabled="deleting"
            >
              <span v-if="deleting" class="loading loading-spinner loading-sm"></span>
              {{ deleting ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '../db/indexeddb'
import { generateUUID } from '../utils/uuid'
import { generatePDF } from '../services/pdf'
import { deleteInterventionFromCloud } from '../services/supabase'

// Component name for keep-alive
defineOptions({
  name: 'Dashboard'
})

const router = useRouter()
const interventions = ref([])
const loading = ref(true)
const searchQuery = ref('')
const statusFilter = ref('All') // Changed default to 'All' to show all interventions
const periodFilter = ref('All') // Changed default to 'All' to show all interventions
const dateFrom = ref('')
const dateTo = ref('')

// Context menu state
const contextMenu = ref({
  show: false,
  x: 0,
  y: 0,
  intervention: null
})

const actionSheet = ref({
  show: false,
  intervention: null
})

const deleteConfirm = ref({
  show: false,
  intervention: null
})

const exportingPDF = ref(false)
const deleting = ref(false)

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
  if (statusFilter.value && statusFilter.value !== 'All') {
    filtered = filtered.filter(i => i.status === statusFilter.value)
  }

  // Period/Date range filter
  if (periodFilter.value && periodFilter.value !== 'All' && periodFilter.value !== 'custom') {
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

let isLoadingInterventions = false
let lastLoadTime = 0
const LOAD_DEBOUNCE_MS = 1000 // Prevent loads within 1 second of each other

async function loadInterventions() {
  // Prevent concurrent loads
  if (isLoadingInterventions) {
    return
  }
  
  // Debounce: prevent rapid successive loads
  const now = Date.now()
  if (now - lastLoadTime < LOAD_DEBOUNCE_MS) {
    return
  }
  lastLoadTime = now
  
  try {
    isLoadingInterventions = true
    loading.value = true
    
    // Wait for database to be ready
    await db.open()
    
    // Check if database is accessible
    if (!db || !db.interventions) {
      console.error('[Dashboard] Database or interventions table not available')
      interventions.value = []
      return
    }
    
    // Try to get count first
    const count = await db.interventions.count()
    
    if (count === 0) {
      interventions.value = []
      return
    }
    
    // Load all interventions
    const all = await db.interventions.toArray()
    
    // Load tags for all interventions
    const interventionsWithTags = await Promise.all(
      all.map(async (intervention) => {
        const tagLinks = await db.intervention_tags
          .where('intervention_id').equals(intervention.id)
          .toArray()
        
        const tagIds = tagLinks.map(link => link.tag_id)
        const tags = []
        for (const tagId of tagIds) {
          const tag = await db.tags.get(tagId)
          if (tag) tags.push(tag)
        }
        
        return {
          ...intervention,
          tags: tags.map(t => t.name) // For display, just use tag names
        }
      })
    )
    
    interventions.value = interventionsWithTags || []
    console.log('[Dashboard] Loaded interventions with tags:', interventions.value.map(i => ({ id: i.id, client_name: i.client_name, tags: i.tags })))
    
    if (all.length === 0 && count > 0) {
      console.warn('[Dashboard] Count shows interventions exist but toArray returned empty. Possible schema issue.')
      // Try alternative query
      try {
        const alt = await db.interventions.orderBy('date').toArray()
        if (alt.length > 0) {
          interventions.value = alt
        }
      } catch (altError) {
        console.error('[Dashboard] Alternative query also failed:', altError)
      }
    }
  } catch (error) {
    console.error('[Dashboard] Error loading interventions:', error)
    interventions.value = []
    // Don't let errors cause the component to remount
  } finally {
    loading.value = false
    isLoadingInterventions = false
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

function goToDetail(intervention) {
  if (!contextMenu.value.show) {
    // If status is "In Progress", go to edit page, otherwise go to detail page
    if (intervention.status === 'In Progress' || !intervention.status) {
      router.push(`/interventions/${intervention.id}/edit`)
    } else {
      router.push(`/interventions/${intervention.id}`)
    }
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

function openActionSheet(intervention) {
  actionSheet.value.intervention = intervention
  actionSheet.value.show = true
}

function handleDuplicate() {
  if (!actionSheet.value.intervention) return
  actionSheet.value.show = false
  duplicateIntervention(actionSheet.value.intervention)
}

async function duplicateIntervention(intervention) {
  if (!intervention) return
  
  try {
    const newId = generateUUID()
    const now = new Date().toISOString()
    
    // Create duplicate WITH checklist items but WITHOUT photos and comments
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
        : [], // Keep checklist items
      comments: [] // Empty - no comments
    }
    
    await db.interventions.put(duplicate)
    
    // Copy tags from junction table
    const tagLinks = await db.intervention_tags
      .where('intervention_id').equals(intervention.id)
      .toArray()
    
    for (const link of tagLinks) {
      await db.intervention_tags.add({
        intervention_id: newId,
        tag_id: link.tag_id
      })
    }
    
    await loadInterventions()
    router.push(`/interventions/${newId}/edit`)
  } catch (error) {
    console.error('Error duplicating intervention:', error)
    alert('Error duplicating report. Please try again.')
  }
}

async function handleExport() {
  if (!actionSheet.value.intervention) return
  
  exportingPDF.value = true
  actionSheet.value.show = false
  
  try {
    const intervention = actionSheet.value.intervention
    
    // Load checklist items and comments from JSONB
    const checklistItems = Array.isArray(intervention.checklist_items)
      ? intervention.checklist_items
      : []
    const comments = Array.isArray(intervention.comments)
      ? intervention.comments
      : []
    
    // Load photos (still separate table)
    const photos = await db.photos
      .where('intervention_id').equals(intervention.id)
      .toArray()
    
    const doc = await generatePDF(intervention, checklistItems, photos, comments)
    const filename = `intervention_${intervention.client_name}_${new Date(intervention.date).toISOString().split('T')[0]}.pdf`
    doc.save(filename)
  } catch (error) {
    console.error('Error generating PDF:', error)
    alert('Error generating PDF. Please try again.')
  } finally {
    exportingPDF.value = false
  }
}

function handleDelete() {
  if (!actionSheet.value.intervention) return
  deleteConfirm.value.intervention = actionSheet.value.intervention
  actionSheet.value.show = false
  deleteConfirm.value.show = true
}

async function confirmDelete() {
  if (!deleteConfirm.value.intervention) return
  
  deleting.value = true
  
  try {
    const intervention = deleteConfirm.value.intervention
    const interventionId = intervention.id
    
    // Delete from IndexedDB
    await db.photos.where('intervention_id').equals(interventionId).delete()
    await db.interventions.delete(interventionId)
    
    // Try to delete from cloud if synced
    if (intervention.synced) {
      try {
        await deleteInterventionFromCloud(interventionId)
      } catch (error) {
        console.error('Error deleting from cloud:', error)
      }
    }
    
    deleteConfirm.value.show = false
    await loadInterventions()
  } catch (error) {
    console.error('Error deleting intervention:', error)
    alert('Error deleting report. Please try again.')
  } finally {
    deleting.value = false
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

// Track if we're in the initial mount phase (first 3 seconds)
let initialMountTime = Date.now()
const INITIAL_MOUNT_GRACE_PERIOD = 3000 // 3 seconds

// Listen for sync completion events to refresh data
function handleSyncCompleted(event) {
  // Skip sync reload during initial mount grace period to avoid double loading
  const timeSinceMount = Date.now() - initialMountTime
  if (timeSinceMount < INITIAL_MOUNT_GRACE_PERIOD) {
    return
  }
  
  // Only reload if sync actually brought in new data
  const detail = event.detail || {}
  const fromCloud = detail.fromCloud || {}
  const toCloud = detail.toCloud || {}
  const hasNewData = (fromCloud.interventions > 0 || fromCloud.photos > 0 || toCloud.interventions > 0)
  
  if (hasNewData) {
    loadInterventions()
  }
}

onMounted(() => {
  // Record mount time for grace period
  initialMountTime = Date.now()
  
  // Listen for sync completion events
  window.addEventListener('syncCompleted', handleSyncCompleted)
  
  // Load interventions on mount
  loadInterventions()
})

// Refresh data when component is activated (user navigates back to Dashboard)
// Note: We don't load here on initial mount to avoid double loading
// The syncCompleted event will handle refreshing when needed
onActivated(() => {
  // Component activated - sync events will handle refreshes if needed
})

onUnmounted(() => {
  // Clean up event listener
  window.removeEventListener('syncCompleted', handleSyncCompleted)
  // Don't reset hasLoadedInitially - keep it true for next mount
})
</script>
