<template>
  <div class="pb-20">
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
            <h1 class="text-3xl font-bold">{{ getDisplayTitle(intervention) }}</h1>
            <p class="text-base-content/70 mt-1">{{ formatDate(intervention.date) }}</p>
            <div v-if="intervention.tags && intervention.tags.length > 0" class="flex flex-wrap gap-2 mt-2">
              <span
                v-for="tag in intervention.tags"
                :key="tag"
                class="badge badge-sm badge-primary"
              >
                {{ tag }}
              </span>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <div
            :class="[
              'badge badge-lg',
              intervention.status === 'Completed' ? 'badge-success' :
              intervention.status === 'In Progress' ? 'badge-warning' :
              'badge-info'
            ]"
          >
            {{ intervention.status || 'In Progress' }}
          </div>
          <SyncIndicator />
        </div>
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
      <div class="card bg-base-100 shadow-xl mb-6">
        <div class="card-body">
          <h2 class="card-title mb-4">Photos</h2>
          <div v-if="photos.length === 0" class="text-center py-4 text-base-content/70">
            No photos available.
          </div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="(photo, index) in photos"
              :key="photo.id || `photo-${index}`"
              class="relative"
            >
              <div class="relative w-full h-48 bg-base-200 rounded-lg overflow-hidden">
                <img
                  :src="getPhotoUrl(photo)"
                  alt="Intervention photo"
                  class="w-full h-full object-cover cursor-pointer"
                  @click="openImageViewer(index)"
                  @error="handleImageError($event, photo)"
                />
              </div>
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
              <p v-if="comment.text" class="whitespace-pre-wrap mb-2">{{ comment.text }}</p>
              <div v-if="comment.audio" class="mb-2">
                <audio :src="comment.audio.url_cloud || comment.audio.url_local" controls class="w-full max-w-md"></audio>
              </div>
              <p class="text-xs text-base-content/70 mt-2">
                {{ formatDate(comment.created_at) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="checklistItems.length === 0 && photos.length === 0 && comments.length === 0" class="card bg-base-100 shadow-xl mb-20">
        <div class="card-body text-center">
          <p class="text-base-content/70">No additional details available for this intervention.</p>
        </div>
      </div>
    </div>

    <!-- Bottom Action Bar (only show when intervention is loaded) -->
    <div v-if="intervention && !loading" class="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
      <!-- Background with blur effect -->
      <div class="absolute inset-0 bg-base-100/95 backdrop-blur-xl border-t border-base-300/50"></div>
      
      <!-- Content -->
      <div class="relative max-w-md mx-auto px-4 py-3">
        <div class="flex gap-3">
          <button
            @click="createSimilarIntervention"
            class="btn btn-primary flex-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Create Similar
          </button>
          <button
            @click="downloadPDF"
            class="btn btn-secondary flex-1"
            :disabled="generatingPDF"
          >
            <span v-if="generatingPDF" class="loading loading-spinner loading-sm"></span>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {{ generatingPDF ? 'Generating...' : 'PDF' }}
          </button>
          <button
            v-if="intervention && intervention.status !== 'Completed'"
            @click="editIntervention"
            class="btn btn-ghost flex-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
        </div>
      </div>
    </div>

    <!-- Image Viewer -->
    <ImageViewer
      v-model="imageViewer.show"
      :photos="photos"
      :initial-index="imageViewer.index"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onActivated, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { db } from '../db/indexeddb'
import SyncIndicator from '../components/SyncIndicator.vue'
import { generatePDF } from '../services/pdf'
import { deleteInterventionFromCloud } from '../services/supabase'
import ImageViewer from '../components/ImageViewer.vue'
import { generateUUID } from '../utils/uuid'
import { getNextSequenceNumber, getDisplayTitle } from '../utils/sequenceNumber'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const generatingPDF = ref(false)
const deleting = ref(false)
const intervention = ref(null)
const checklistItems = ref([])
const photos = ref([])
const comments = ref([])

// Computed property to ensure reactivity
const hasPhotos = computed(() => photos.value && photos.value.length > 0)

// Image Viewer State
const imageViewer = ref({
  show: false,
  index: 0
})

async function loadIntervention() {
  try {
    loading.value = true
    const id = route.params.id
    
    // Load intervention
    intervention.value = await db.interventions.get(id)
    
    if (!intervention.value) {
      return
    }
    
    // Load checklist items from JSONB column
    checklistItems.value = Array.isArray(intervention.value.checklist_items)
      ? intervention.value.checklist_items
      : []
    
    // Load photos (still separate table)
    const loadedPhotos = await db.photos
      .where('intervention_id').equals(id)
      .toArray()
    
    // Filter out invalid photos (must have id and at least one URL)
    photos.value = loadedPhotos.filter(p => {
      return !!p.id && !!(p.url_local || p.url_cloud)
    })
    
    // Load comments from JSONB column
    comments.value = Array.isArray(intervention.value.comments)
      ? intervention.value.comments
      : []
    
    // Load tags from junction table
    const tagLinks = await db.intervention_tags
      .where('intervention_id').equals(id)
      .toArray()
    
    const tagIds = tagLinks.map(link => link.tag_id)
    const tags = []
    for (const tagId of tagIds) {
      const tag = await db.tags.get(tagId)
      if (tag) tags.push(tag)
    }
    
    // Add tags to intervention for display
    intervention.value.tags = tags.map(t => t.name)
  } catch (error) {
    console.error('[InterventionDetail] Error loading intervention:', error)
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

// Image Viewer Functions
function openImageViewer(index) {
  imageViewer.value.index = index
  imageViewer.value.show = true
}

function getPhotoUrl(photo) {
  // Try local first, then cloud, fallback to empty string
  const url = photo.url_local || photo.url_cloud || ''
  if (!url) {
    console.warn('[InterventionDetail] Photo has no URL:', photo.id)
  }
  return url
}

function handleImageError(event, photo) {
  // Try cloud URL if local failed
  if (event.target.src === photo.url_local && photo.url_cloud) {
    event.target.src = photo.url_cloud
    return
  }
  // Show a placeholder if both fail
  event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBub3QgYXZhaWxhYmxlPC90ZXh0Pjwvc3ZnPg=='
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

async function createSimilarIntervention() {
  if (!intervention.value) return
  
  try {
    const baseTitle = intervention.value.client_name || 'Unnamed Client'
    const nextSequence = await getNextSequenceNumber(db, baseTitle)
    const newId = generateUUID()
    const now = new Date().toISOString()
    
    // Create new intervention with same base title and next sequence
    const newIntervention = {
      id: newId,
      client_name: baseTitle, // Same base title
      sequence_number: nextSequence, // Next sequence number
      date: now,
      status: 'In Progress',
      created_at: now,
      updated_at: now,
      synced: false,
      checklist_items: [], // Empty - fresh report
      comments: [] // Empty - fresh report
    }
    
    await db.interventions.put(newIntervention)
    
    // Navigate to edit page
    router.push(`/interventions/${newId}/edit`)
  } catch (error) {
    console.error('Error creating similar intervention:', error)
    alert('Error creating similar report. Please try again.')
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
    
    // Delete from IndexedDB
    // Note: checklist_items and comments are now in JSONB, so deleting intervention removes them
    await db.photos.where('intervention_id').equals(interventionId).delete()
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

// Load on mount
onMounted(() => {
  loadIntervention()
})

// Also load on activation (for keep-alive)
onActivated(() => {
  loadIntervention()
})

// Watch for route changes
watch(() => route.params.id, (newId) => {
  if (newId) {
    loadIntervention()
  }
}, { immediate: true })
</script>
