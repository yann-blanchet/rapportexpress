<template>
  <div>
    <div v-if="loading" class="text-center py-8">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else-if="!intervention" class="card bg-base-100 shadow-xl">
      <div class="card-body text-center">
        <p class="text-lg">Intervention not found</p>
        <router-link to="/" class="btn btn-primary mt-4">Back to Dashboard</router-link>
      </div>
    </div>

    <div v-else>
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <div class="flex items-center gap-3 flex-1">
          <router-link to="/" class="btn btn-ghost btn-circle btn-sm">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </router-link>
          <div class="flex-1">
            <h1 class="text-3xl font-bold">{{ intervention.client_name || 'Unnamed Client' }}</h1>
            <p class="text-base-content/70 mt-1">{{ formatDate(intervention.date) }}</p>
          </div>
        </div>
        <div class="flex gap-2">
          <div
            :class="[
              'badge badge-lg',
              intervention.status === 'Completed' ? 'badge-success' :
              intervention.status === 'In Progress' ? 'badge-warning' :
              'badge-info'
            ]"
          >
            {{ intervention.status || 'To Do' }}
          </div>
          <div v-if="!intervention.synced" class="badge badge-lg badge-error badge-outline" title="Not synced">
            Offline
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex gap-2 mb-6 flex-wrap">
        <button
          @click="downloadPDF"
          class="btn btn-primary"
          :disabled="generatingPDF"
        >
          <span v-if="generatingPDF" class="loading loading-spinner loading-sm"></span>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {{ generatingPDF ? 'Generating...' : 'Download PDF' }}
        </button>
        <button
          v-if="intervention.status !== 'Completed'"
          @click="editIntervention"
          class="btn btn-secondary"
        >
          Edit
        </button>
        <button
          @click="deleteIntervention"
          class="btn btn-error"
          :disabled="deleting"
        >
          <span v-if="deleting" class="loading loading-spinner loading-sm"></span>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          {{ deleting ? 'Deleting...' : 'Delete' }}
        </button>
      </div>

      <!-- Checklist -->
      <div v-if="checklistItems.length > 0" class="card bg-base-100 shadow-xl mb-6">
        <div class="card-body">
          <h2 class="card-title mb-4">Checklist</h2>
          <div class="space-y-2">
            <div
              v-for="item in checklistItems"
              :key="item.id"
              class="flex items-center gap-3 p-3 bg-base-200 rounded-lg"
            >
              <input
                type="checkbox"
                :checked="item.checked"
                disabled
                class="checkbox checkbox-primary"
              />
              <span :class="{ 'line-through opacity-50': item.checked }">
                {{ item.label }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Photos -->
      <div v-if="photos.length > 0" class="card bg-base-100 shadow-xl mb-6">
        <div class="card-body">
          <h2 class="card-title mb-4">Photos</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="photo in photos"
              :key="photo.id"
              class="relative"
            >
              <img
                :src="photo.url_local || photo.url_cloud"
                alt="Intervention photo"
                class="w-full h-48 object-cover rounded-lg"
              />
              <p v-if="photo.description" class="mt-2 text-sm text-base-content/70">
                {{ photo.description }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Comments -->
      <div v-if="comments.length > 0" class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title mb-4">Comments</h2>
          <div class="space-y-4">
            <div
              v-for="comment in comments"
              :key="comment.id"
              class="p-4 bg-base-200 rounded-lg"
            >
              <p class="whitespace-pre-wrap">{{ comment.text }}</p>
              <p class="text-xs text-base-content/70 mt-2">
                {{ formatDate(comment.created_at) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="checklistItems.length === 0 && photos.length === 0 && comments.length === 0" class="card bg-base-100 shadow-xl">
        <div class="card-body text-center">
          <p class="text-base-content/70">No additional details available for this intervention.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { db } from '../db/indexeddb'
import { generatePDF } from '../services/pdf'
import { deleteInterventionFromCloud } from '../services/supabase'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const generatingPDF = ref(false)
const deleting = ref(false)
const intervention = ref(null)
const checklistItems = ref([])
const photos = ref([])
const comments = ref([])

async function loadIntervention() {
  try {
    loading.value = true
    const id = route.params.id
    
    intervention.value = await db.interventions.get(id)
    
    if (intervention.value) {
      checklistItems.value = await db.checklist_items
        .where('intervention_id').equals(id)
        .toArray()
      
      photos.value = await db.photos
        .where('intervention_id').equals(id)
        .toArray()
      
      comments.value = await db.comments
        .where('intervention_id').equals(id)
        .toArray()
    }
  } catch (error) {
    console.error('Error loading intervention:', error)
  } finally {
    loading.value = false
  }
}

function formatDate(dateString) {
  if (!dateString) return 'No date'
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

async function downloadPDF() {
  if (!intervention.value) return
  
  generatingPDF.value = true
  try {
    const doc = await generatePDF(
      intervention.value,
      checklistItems.value,
      photos.value,
      comments.value
    )
    
    const filename = `intervention_${intervention.value.client_name}_${new Date(intervention.value.date).toISOString().split('T')[0]}.pdf`
    doc.save(filename)
  } catch (error) {
    console.error('Error generating PDF:', error)
    alert('Error generating PDF. Please try again.')
  } finally {
    generatingPDF.value = false
  }
}

function editIntervention() {
  router.push(`/interventions/${route.params.id}/edit`)
}

async function deleteIntervention() {
  if (!intervention.value) return
  
  const confirmed = confirm(
    `Are you sure you want to delete this intervention?\n\n` +
    `Client: ${intervention.value.client_name}\n` +
    `Date: ${formatDate(intervention.value.date)}\n\n` +
    `This action cannot be undone.`
  )
  
  if (!confirmed) return
  
  deleting.value = true
  try {
    const interventionId = intervention.value.id
    
    // Delete from IndexedDB (cascade will handle related data if configured)
    // But we'll delete explicitly to be sure
    await db.checklist_items.where('intervention_id').equals(interventionId).delete()
    await db.photos.where('intervention_id').equals(interventionId).delete()
    await db.comments.where('intervention_id').equals(interventionId).delete()
    await db.interventions.delete(interventionId)
    
    // Try to delete from cloud if synced
    if (intervention.value.synced) {
      try {
        await deleteInterventionFromCloud(interventionId)
      } catch (error) {
        console.error('Error deleting from cloud (intervention may still exist in cloud):', error)
        // Continue even if cloud delete fails
      }
    }
    
    // Redirect to dashboard
    router.push('/')
  } catch (error) {
    console.error('Error deleting intervention:', error)
    alert('Error deleting intervention. Please try again.')
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  loadIntervention()
})
</script>
