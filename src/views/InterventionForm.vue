<template>
  <div class="pb-20">
    <div class="flex items-center gap-3 mb-6">
      <router-link to="/" class="btn btn-ghost btn-circle btn-sm">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </router-link>
      <h1 class="text-3xl font-bold">
        {{ isEdit ? 'Edit Intervention' : 'Create New Intervention' }}
      </h1>
    </div>

    <form @submit.prevent="saveIntervention" class="space-y-6">
      <!-- Basic Information -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title mb-4">Basic Information</h2>
          
          <div class="form-control mb-4">
            <label class="label">
              <span class="label-text">Client / Site Name *</span>
            </label>
            <input
              type="text"
              v-model="form.client_name"
              required
              placeholder="Enter client or site name"
              class="input input-bordered"
            />
          </div>

          <div class="form-control mb-4">
            <label class="label">
              <span class="label-text">Date & Time *</span>
            </label>
            <input
              type="datetime-local"
              v-model="form.date"
              required
              class="input input-bordered"
            />
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">Status</span>
            </label>
            <div class="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                @click="form.status = 'To Do'"
                :class="[
                  'badge badge-lg cursor-pointer transition-all px-4 py-2',
                  form.status === 'To Do' ? 'badge-info' : 'badge-outline'
                ]"
              >
                To Do
              </button>
              <button
                type="button"
                @click="form.status = 'In Progress'"
                :class="[
                  'badge badge-lg cursor-pointer transition-all px-4 py-2',
                  form.status === 'In Progress' ? 'badge-warning' : 'badge-outline'
                ]"
              >
                In Progress
              </button>
              <button
                type="button"
                @click="form.status = 'Completed'"
                :class="[
                  'badge badge-lg cursor-pointer transition-all px-4 py-2',
                  form.status === 'Completed' ? 'badge-success' : 'badge-outline'
                ]"
              >
                Completed
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Checklist -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <div class="flex justify-between items-center mb-4">
            <h2 class="card-title">Checklist</h2>
            <button
              type="button"
              @click="addChecklistItem"
              class="btn btn-sm btn-primary"
            >
              Add Item
            </button>
          </div>

          <div v-if="checklistItems.length === 0" class="text-center py-4 text-base-content/70">
            No checklist items. Click "Add Item" to create one.
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="(item, index) in checklistItems"
              :key="item.id"
              class="flex items-center gap-2 p-2 border rounded-lg"
            >
              <input
                type="checkbox"
                v-model="item.checked"
                class="checkbox checkbox-primary"
              />
              <input
                type="text"
                v-model="item.label"
                placeholder="Checklist item label"
                class="input input-bordered flex-1"
              />
              <button
                type="button"
                @click="removeChecklistItem(index)"
                class="btn btn-sm btn-error btn-circle"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Photos -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <div class="flex justify-between items-center mb-4">
            <h2 class="card-title">Photos</h2>
            <input
              type="file"
              ref="photoInput"
              @change="handlePhotoUpload"
              accept="image/*"
              capture="environment"
              class="hidden"
            />
            <button
              type="button"
              @click="$refs.photoInput.click()"
              class="btn btn-sm btn-primary"
            >
              Add Photo
            </button>
          </div>

          <div v-if="photos.length === 0" class="text-center py-4 text-base-content/70">
            No photos added yet.
          </div>

          <div v-else class="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div
              v-for="photo in photos"
              :key="photo.id"
              class="relative"
            >
              <img
                :src="photo.url_local"
                alt="Intervention photo"
                class="w-full h-32 object-cover rounded-lg"
              />
              <input
                type="text"
                v-model="photo.description"
                placeholder="Photo description"
                class="input input-bordered input-sm mt-2 w-full"
              />
              <button
                type="button"
                @click="removePhoto(photo.id)"
                class="btn btn-sm btn-error btn-circle absolute top-2 right-2"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Comments -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title mb-4">Comments</h2>
          <textarea
            v-model="commentText"
            placeholder="Enter comments or notes..."
            class="textarea textarea-bordered h-32"
          ></textarea>
          <button
            type="button"
            @click="addComment"
            class="btn btn-primary btn-sm mt-2"
            :disabled="!commentText.trim()"
          >
            Add Comment
          </button>

          <div v-if="comments.length > 0" class="mt-4 space-y-2">
            <div
              v-for="comment in comments"
              :key="comment.id"
              class="p-3 bg-base-200 rounded-lg"
            >
              <p class="text-sm">{{ comment.text }}</p>
              <p class="text-xs text-base-content/70 mt-1">
                {{ formatDate(comment.created_at) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Spacer for bottom bar -->
      <div class="h-20"></div>
    </form>

    <!-- Bottom Action Bar -->
    <div class="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
      <!-- Background with blur effect -->
      <div class="absolute inset-0 bg-base-100/95 backdrop-blur-xl border-t border-base-300/50"></div>
      
      <!-- Content -->
      <div class="relative max-w-md mx-auto px-4 py-3">
        <div class="flex gap-3">
          <router-link to="/" class="btn btn-ghost flex-1">
            Cancel
          </router-link>
          <button 
            type="button"
            @click="saveIntervention" 
            class="btn btn-primary flex-1 font-semibold" 
            :disabled="saving || !form.client_name.trim()"
          >
            <span v-if="saving" class="loading loading-spinner loading-sm"></span>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {{ saving ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { db } from '../db/indexeddb'
import { generateUUID } from '../utils/uuid'
import { syncInterventionToCloud, uploadPhotoToCloud, syncPhotoToCloud } from '../services/supabase'
import { compressImage } from '../utils/imageCompression'

const route = useRoute()
const router = useRouter()
const isEdit = ref(false)
const saving = ref(false)
const photoInput = ref(null)

const form = ref({
  client_name: '',
  date: new Date().toISOString().slice(0, 16),
  status: 'To Do'
})

const checklistItems = ref([])
const photos = ref([])
const comments = ref([])
const commentText = ref('')

async function loadIntervention() {
  if (route.params.id) {
    isEdit.value = true
    try {
      const intervention = await db.interventions.get(route.params.id)
      if (intervention) {
        form.value = {
          client_name: intervention.client_name || '',
          date: intervention.date ? new Date(intervention.date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
          status: intervention.status || 'To Do'
        }

        // Load checklist items from JSONB column
        checklistItems.value = Array.isArray(intervention.checklist_items) 
          ? intervention.checklist_items.map(item => ({
              id: item.id || generateUUID(),
              label: item.label || '',
              checked: item.checked || false,
              photo_ids: Array.isArray(item.photo_ids) ? item.photo_ids : []
            }))
          : []

        // Load photos (still separate table)
        photos.value = await db.photos
          .where('intervention_id').equals(route.params.id)
          .toArray()

        // Load comments from JSONB column
        comments.value = Array.isArray(intervention.comments)
          ? intervention.comments.map(comment => ({
              id: comment.id || generateUUID(),
              text: comment.text || '',
              created_at: comment.created_at || new Date().toISOString()
            }))
          : []
      }
    } catch (error) {
      console.error('Error loading intervention:', error)
    }
  }
}

function addChecklistItem() {
  checklistItems.value.push({
    id: generateUUID(),
    intervention_id: route.params.id || null,
    label: '',
    checked: false,
    photo_ids: []
  })
}

function removeChecklistItem(index) {
  checklistItems.value.splice(index, 1)
}

async function handlePhotoUpload(event) {
  const file = event.target.files[0]
  if (!file) return

  const photoId = generateUUID()
  const reader = new FileReader()
  
  reader.onload = async (e) => {
    const photo = {
      id: photoId,
      intervention_id: route.params.id || null,
      url_local: e.target.result, // Base64 data URL (stored in IndexedDB)
      url_cloud: null,
      description: '',
      taken_at: new Date().toISOString(),
      file_name: file.name, // Store original filename
      file_type: file.type, // Store MIME type
      file_size: file.size // Store file size
    }
    
    photos.value.push(photo)
  }
  
  reader.readAsDataURL(file) // Convert to base64
  event.target.value = '' // Reset input
}

function removePhoto(photoId) {
  const index = photos.value.findIndex(p => p.id === photoId)
  if (index > -1) {
    photos.value.splice(index, 1)
  }
}

function addComment() {
  if (!commentText.value.trim()) return
  
  const comment = {
    id: generateUUID(),
    intervention_id: route.params.id || null,
    text: commentText.value.trim(),
    created_at: new Date().toISOString()
  }
  
  comments.value.push(comment)
  commentText.value = ''
}

function formatDate(dateString) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString()
}

async function saveIntervention() {
  saving.value = true
  
  try {
    const interventionId = route.params.id || generateUUID()
    const now = new Date().toISOString()
    
    // Prepare checklist items as JSONB array
    const checklistItemsData = checklistItems.value.map(item => ({
      id: item.id || generateUUID(),
      label: item.label || '',
      checked: item.checked || false,
      photo_ids: Array.isArray(item.photo_ids) ? [...item.photo_ids] : []
    }))
    
    // Prepare comments as JSONB array
    const commentsData = comments.value.map(comment => ({
      id: comment.id || generateUUID(),
      text: comment.text || '',
      created_at: comment.created_at || new Date().toISOString()
    }))
    
    // Save intervention with JSONB columns
    const intervention = {
      id: interventionId,
      client_name: form.value.client_name,
      date: new Date(form.value.date).toISOString(),
      status: form.value.status,
      created_at: isEdit.value ? (await db.interventions.get(interventionId))?.created_at || now : now,
      updated_at: now,
      synced: false,
      checklist_items: checklistItemsData,
      comments: commentsData
    }
    
    await db.interventions.put(intervention)
    
    // Save photos (still separate table)
    for (const photo of photos.value) {
      const cleanPhoto = {
        id: photo.id,
        intervention_id: interventionId,
        url_local: photo.url_local || '',
        url_cloud: photo.url_cloud || null,
        description: photo.description || '',
        taken_at: photo.taken_at || new Date().toISOString(),
        file_name: photo.file_name || null,
        file_type: photo.file_type || null,
        file_size: photo.file_size || null
      }
      await db.photos.put(cleanPhoto)
    }
    
    // Try to sync to cloud
    try {
      // Sync intervention (includes checklist_items and comments as JSONB)
      await syncInterventionToCloud(intervention)
      
      // Upload photos (convert base64 back to File, compress, then upload)
      for (const photo of photos.value) {
        if (photo.url_local && !photo.url_cloud) {
          try {
            // Convert base64 data URL back to File object
            const response = await fetch(photo.url_local)
            const blob = await response.blob()
            const originalFile = new File([blob], photo.file_name || `photo_${photo.id}.jpg`, { 
              type: photo.file_type || 'image/jpeg' 
            })
            
            // Compress image before uploading to reduce storage and bandwidth
            const compressedFile = await compressImage(originalFile, {
              maxSizeMB: 1, // Max 1MB per image
              maxWidthOrHeight: 1920, // Max dimension
              initialQuality: 0.8 // 80% quality
            })
            
            const cloudUrl = await uploadPhotoToCloud(compressedFile, interventionId, photo.id)
            
            // Create clean photo object with updated cloud URL
            const cleanPhoto = {
              id: photo.id,
              intervention_id: interventionId,
              url_local: photo.url_local || '',
              url_cloud: cloudUrl,
              description: photo.description || '',
              taken_at: photo.taken_at || new Date().toISOString(),
              file_name: photo.file_name || null,
              file_type: photo.file_type || null,
              file_size: photo.file_size || null
            }
            
            await db.photos.put(cleanPhoto)
            await syncPhotoToCloud(cleanPhoto)
          } catch (error) {
            console.error('Error uploading photo:', error)
          }
        }
      }
      
      // Mark as synced
      intervention.synced = true
      await db.interventions.put(intervention)
    } catch (error) {
      console.error('Error syncing to cloud (will sync later):', error)
    }
    
    router.push(`/interventions/${interventionId}`)
  } catch (error) {
    console.error('Error saving intervention:', error)
    alert('Error saving intervention. Please try again.')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadIntervention()
})
</script>
