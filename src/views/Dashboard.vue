<template>
  <div>
    <div class="mb-6">
      <h1 class="text-3xl font-bold">Interventions</h1>
    </div>

    <!-- Filters and Search -->
    <div class="card bg-base-100 shadow-xl mb-6">
      <div class="card-body">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Search -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Search</span>
            </label>
            <input
              type="text"
              v-model="searchQuery"
              placeholder="Client or site name..."
              class="input input-bordered"
            />
          </div>

          <!-- Status Filter -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Status</span>
            </label>
            <select v-model="statusFilter" class="select select-bordered">
              <option value="">All Statuses</option>
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <!-- Date Filter -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Date</span>
            </label>
            <input
              type="date"
              v-model="dateFilter"
              class="input input-bordered"
            />
          </div>
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

    <div v-else class="space-y-4">
      <div
        v-for="intervention in filteredInterventions"
        :key="intervention.id"
        class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer"
        @click="goToDetail(intervention.id)"
      >
        <div class="card-body">
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <h2 class="card-title">{{ intervention.client_name || 'Unnamed Client' }}</h2>
              <p class="text-sm text-base-content/70 mt-1">
                {{ formatDate(intervention.date) }}
              </p>
            </div>
            <div class="flex items-center gap-2">
              <div
                :class="[
                  'badge',
                  intervention.status === 'Completed' ? 'badge-success' :
                  intervention.status === 'In Progress' ? 'badge-warning' :
                  'badge-info'
                ]"
              >
                {{ intervention.status || 'To Do' }}
              </div>
              <div v-if="!intervention.synced" class="badge badge-error badge-outline" title="Not synced">
                Offline
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '../db/indexeddb'

const router = useRouter()
const interventions = ref([])
const loading = ref(true)
const searchQuery = ref('')
const statusFilter = ref('')
const dateFilter = ref('')

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

  // Date filter
  if (dateFilter.value) {
    const filterDate = new Date(dateFilter.value).toDateString()
    filtered = filtered.filter(i => {
      const interventionDate = new Date(i.date).toDateString()
      return interventionDate === filterDate
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
    console.error('Error loading interventions:', error)
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

onMounted(() => {
  loadInterventions()
  
  // Refresh list periodically
  setInterval(loadInterventions, 5000)
})
</script>
