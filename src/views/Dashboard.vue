<template>
  <div>
    <div class="mb-6">
      <h1 class="text-3xl font-bold">Interventions</h1>
    </div>

    <!-- Filters and Search - Compact -->
    <div class="bg-base-100 rounded-lg shadow-md mb-4 p-3">
      <div class="flex flex-wrap gap-2 items-center">
        <!-- Search -->
        <div class="flex-1 min-w-[150px]">
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Search..."
            class="input input-bordered input-sm w-full"
          />
        </div>

        <!-- Status Filter - Badge Line -->
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-xs text-base-content/60">Status:</span>
          <button
            @click="statusFilter = ''"
            :class="[
              'badge badge-sm cursor-pointer transition-all',
              statusFilter === '' ? 'badge-primary' : 'badge-outline'
            ]"
          >
            All
          </button>
          <button
            @click="statusFilter = 'To Do'"
            :class="[
              'badge badge-sm cursor-pointer transition-all',
              statusFilter === 'To Do' ? 'badge-info' : 'badge-outline'
            ]"
          >
            To Do
          </button>
          <button
            @click="statusFilter = 'In Progress'"
            :class="[
              'badge badge-sm cursor-pointer transition-all',
              statusFilter === 'In Progress' ? 'badge-warning' : 'badge-outline'
            ]"
          >
            In Progress
          </button>
          <button
            @click="statusFilter = 'Completed'"
            :class="[
              'badge badge-sm cursor-pointer transition-all',
              statusFilter === 'Completed' ? 'badge-success' : 'badge-outline'
            ]"
          >
            Completed
          </button>
        </div>

        <!-- Period Filter -->
        <div class="min-w-[160px]">
          <select v-model="periodFilter" class="select select-bordered select-sm w-full" @change="updateDateFilterFromPeriod">
            <option value="">All Periods</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="thisWeek">This Week</option>
            <option value="lastWeek">Last Week</option>
            <option value="thisMonth">This Month</option>
            <option value="lastMonth">Last Month</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
        
        <!-- Custom Date Range (shown when "Custom Range" is selected) -->
        <div v-if="periodFilter === 'custom'" class="flex gap-2 items-center">
          <input
            type="date"
            v-model="dateFrom"
            placeholder="From"
            class="input input-bordered input-sm w-32"
          />
          <span class="text-xs text-base-content/60">to</span>
          <input
            type="date"
            v-model="dateTo"
            placeholder="To"
            class="input input-bordered input-sm w-32"
          />
        </div>
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

    <div v-else class="space-y-2">
      <div
        v-for="intervention in filteredInterventions"
        :key="intervention.id"
        class="bg-base-100 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer p-3 border border-base-300/50"
        @click="goToDetail(intervention.id)"
      >
        <div class="flex justify-between items-center gap-3">
          <div class="flex-1 min-w-0">
            <h3 class="font-semibold text-base truncate">{{ intervention.client_name || 'Unnamed Client' }}</h3>
            <p class="text-xs text-base-content/60 mt-1">{{ formatDate(intervention.date) }}</p>
          </div>
          <div class="flex items-center gap-1.5 flex-shrink-0">
            <span
              :class="[
                'badge badge-sm',
                intervention.status === 'Completed' ? 'badge-success' :
                intervention.status === 'In Progress' ? 'badge-warning' :
                'badge-info'
              ]"
            >
              {{ intervention.status || 'To Do' }}
            </span>
            <div v-if="!intervention.synced" class="badge badge-error badge-outline badge-sm" title="Not synced">
              ⚠
            </div>
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

// Component name for keep-alive
defineOptions({
  name: 'Dashboard'
})

const router = useRouter()
const interventions = ref([])
const loading = ref(true)
const searchQuery = ref('')
const statusFilter = ref('')
const periodFilter = ref('')
const dateFrom = ref('')
const dateTo = ref('')

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

function formatDate(dateString) {
  if (!dateString) return 'No date'
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function goToDetail(id) {
  router.push(`/interventions/${id}`)
}

function updateDateFilterFromPeriod() {
  // Clear custom date inputs when switching away from custom
  if (periodFilter.value !== 'custom') {
    dateFrom.value = ''
    dateTo.value = ''
  }
}

onMounted(() => {
  loadInterventions()
})

// Refresh data when component is activated (user navigates back to Dashboard)
onActivated(() => {
  loadInterventions()
})
</script>
