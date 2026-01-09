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

    <form @submit.prevent="saveIntervention">
      <!-- Tab Bar -->
      <div class="tabs tabs-lifted mb-4">
        <button
          type="button"
          @click="activeTab = 'infos'"
          :class="['tab', activeTab === 'infos' ? 'tab-active' : '']"
        >
          Infos
        </button>
        <button
          type="button"
          @click="activeTab = 'checklist'"
          :class="['tab', activeTab === 'checklist' ? 'tab-active' : '']"
        >
          Checklist
        </button>
        <button
          type="button"
          @click="activeTab = 'photos'"
          :class="['tab', activeTab === 'photos' ? 'tab-active' : '']"
        >
          Photos
        </button>
        <button
          type="button"
          @click="activeTab = 'comments'"
          :class="['tab', activeTab === 'comments' ? 'tab-active' : '']"
        >
          Comments
        </button>
      </div>

      <!-- Tab Content -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <!-- Infos Tab -->
          <div v-show="activeTab === 'infos'">
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

            <div class="form-control mb-4">
              <label class="label">
                <span class="label-text">Status</span>
              </label>
              <div class="flex items-center gap-2 flex-wrap">
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

            <div class="form-control">
              <label class="label">
                <span class="label-text">Tags</span>
              </label>
              <div class="flex flex-wrap gap-2 mb-2">
                <div
                  v-for="tag in selectedTags"
                  :key="tag.id"
                  class="badge badge-primary badge-lg gap-2"
                >
                  {{ tag.name }}
                  <button
                    type="button"
                    @click="removeTag(tag.id)"
                    class="btn btn-xs btn-circle btn-ghost p-0 h-4 w-4 min-h-0"
                  >
                    ×
                  </button>
                </div>
              </div>
              <div class="relative" @click.stop>
                <input
                  type="text"
                  v-model="tagInput"
                  @keydown.enter.prevent="addTag"
                  @keydown="handleTagInputKeydown"
                  @input="filterAvailableTags"
                  @focus="showTagSuggestions = true"
                  @blur="handleTagInputBlur"
                  placeholder="Type to search or create a new tag"
                  class="input input-bordered w-full"
                />
                <!-- Tag Suggestions Dropdown -->
                <div
                  v-if="showTagSuggestions && filteredAvailableTags.length > 0"
                  class="absolute z-10 w-full mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                >
                  <button
                    v-for="tag in filteredAvailableTags"
                    :key="tag.id"
                    type="button"
                    @click="selectTag(tag)"
                    class="w-full text-left px-4 py-2 hover:bg-base-200 transition-colors"
                  >
                    {{ tag.name }}
                  </button>
                </div>
              </div>
              <div class="label">
                <span class="label-text-alt text-base-content/60">
                  Type to search existing tags or press Enter to create a new one
                </span>
              </div>
            </div>
          </div>

          <!-- Checklist Tab -->
          <div v-show="activeTab === 'checklist'">
            <div class="flex justify-between items-center mb-4">
              <h2 class="card-title">Checklist</h2>
              <button
                type="button"
                @click="addChecklistItem"
                class="btn btn-sm btn-primary btn-circle"
                title="Add Item"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
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

          <!-- Photos Tab -->
          <div v-show="activeTab === 'photos'">
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
                class="btn btn-sm btn-primary btn-circle"
                title="Add Photo"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            <div v-if="photos.length === 0" class="text-center py-4 text-base-content/70">
              No photos added yet.
            </div>

            <div v-else class="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div
                v-for="(photo, index) in photos"
                :key="photo.id"
                class="relative"
              >
                <img
                  :src="getPhotoUrl(photo)"
                  alt="Intervention photo"
                  class="w-full h-32 object-cover rounded-lg cursor-pointer"
                  @click="openImageViewer(index)"
                  @error="handleImageError($event, photo)"
                />
                <input
                  type="text"
                  v-model="photo.description"
                  placeholder="Photo description"
                  class="input input-bordered input-sm mt-2 w-full"
                />
                <div class="absolute top-2 right-2 flex gap-1">
                  <button
                    type="button"
                    @click.stop="openImageEditor(photo)"
                    class="btn btn-sm btn-primary btn-circle"
                    title="Edit image"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    @click.stop="removePhoto(photo.id)"
                    class="btn btn-sm btn-error btn-circle"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Comments Tab -->
          <div v-show="activeTab === 'comments'">
            <div class="mb-4">
              <h2 class="card-title">Comments</h2>
            </div>
            <!-- Audio Dictation Button -->
            <div class="mb-3 flex items-center gap-2">
              <AudioDictation
                :intervention-id="currentInterventionId"
                @transcription="handleDictationTranscription"
                ref="audioDictationRef"
              />
              <span class="text-xs text-base-content/70">Hold to record voice note</span>
            </div>

            <textarea
              v-model="commentText"
              placeholder="Enter comments or notes... (or use voice dictation above)"
              class="textarea textarea-bordered h-32 w-full mb-3"
            ></textarea>
            
            <!-- Send Button -->
            <button
              type="button"
              @click="addComment"
              class="btn btn-primary w-full"
              :disabled="!commentText.trim()"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Send
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
      </div>

      <!-- Spacer for bottom bar -->
      <div class="h-20"></div>
    </form>

    <!-- Image Editor -->
    <ImageEditor
      v-model="imageEditor.show"
      :photo="imageEditor.photo"
      @save="handleImageSave"
    />

    <!-- Image Viewer -->
    <ImageViewer
      v-model="imageViewer.show"
      :photos="photos"
      :initial-index="imageViewer.index"
    />

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
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { db } from '../db/indexeddb'
import { generateUUID } from '../utils/uuid'
import { syncInterventionToCloud, uploadPhotoToCloud, syncPhotoToCloud, syncTagsToCloud, syncInterventionTagsToCloud } from '../services/supabase'
import { compressImage } from '../utils/imageCompression'
import ImageEditor from '../components/ImageEditor.vue'
import ImageViewer from '../components/ImageViewer.vue'
import AudioDictation from '../components/AudioDictation.vue'

const route = useRoute()
const router = useRouter()
const isEdit = ref(false)
const saving = ref(false)
const photoInput = ref(null)
const activeTab = ref('infos')
const audioDictationRef = ref(null)

// Computed intervention ID for dictation (create temp ID for new interventions)
const currentInterventionId = computed(() => {
  if (route.params.id) {
    return route.params.id
  }
  // For new interventions, generate a temporary ID that will be used when saved
  if (!tempInterventionId.value) {
    tempInterventionId.value = generateUUID()
  }
  return tempInterventionId.value
})
const tempInterventionId = ref(null)

const form = ref({
  client_name: '',
  date: new Date().toISOString().slice(0, 16),
  status: 'In Progress'
})

const checklistItems = ref([])
const photos = ref([])
const comments = ref([])
const commentText = ref('')
const selectedTags = ref([]) // Tags selected for this intervention
const availableTags = ref([]) // All available tags from database
const filteredAvailableTags = ref([]) // Filtered tags for suggestions
const tagInput = ref('')
const showTagSuggestions = ref(false)

// Image Editor State
const imageEditor = ref({
  show: false,
  photo: null
})

// Image Viewer State
const imageViewer = ref({
  show: false,
  index: 0
})

async function loadIntervention() {
  if (route.params.id) {
    isEdit.value = true
    try {
      const intervention = await db.interventions.get(route.params.id)
      if (intervention) {
        form.value = {
          client_name: intervention.client_name || '',
          date: intervention.date ? new Date(intervention.date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
          status: intervention.status || 'In Progress'
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

        // Load tags from junction table
        await loadInterventionTags(route.params.id)
      }
    } catch (error) {
      console.error('Error loading intervention:', error)
    }
  } else {
    // Initialize tags for new intervention
    selectedTags.value = []
  }
  
  // Load all available tags
  await loadAvailableTags()
}

async function loadAvailableTags() {
  try {
    availableTags.value = await db.tags.orderBy('name').toArray()
    filteredAvailableTags.value = availableTags.value
  } catch (error) {
    console.error('Error loading available tags:', error)
    availableTags.value = []
    filteredAvailableTags.value = []
  }
}

async function loadInterventionTags(interventionId) {
  try {
    // Get tag IDs linked to this intervention
    const interventionTagLinks = await db.intervention_tags
      .where('intervention_id').equals(interventionId)
      .toArray()
    
    const tagIds = interventionTagLinks.map(link => link.tag_id)
    
    // Load the actual tag objects
    const tags = []
    for (const tagId of tagIds) {
      const tag = await db.tags.get(tagId)
      if (tag) {
        tags.push(tag)
      }
    }
    
    selectedTags.value = tags
    console.log('[InterventionForm] Loaded intervention tags:', selectedTags.value)
  } catch (error) {
    console.error('Error loading intervention tags:', error)
    selectedTags.value = []
  }
}

function handleTagInputKeydown(event) {
  // Handle comma key (keyCode 188 or key === ',')
  if (event.key === ',' || event.keyCode === 188) {
    event.preventDefault()
    addTag()
  }
  // Close suggestions on Escape
  if (event.key === 'Escape') {
    showTagSuggestions.value = false
  }
}

function handleTagInputBlur() {
  // Delay closing suggestions to allow clicking on them
  window.setTimeout(() => {
    showTagSuggestions.value = false
  }, 200)
}

function filterAvailableTags() {
  const query = tagInput.value.trim().toLowerCase()
  if (!query) {
    filteredAvailableTags.value = availableTags.value.filter(tag => 
      !selectedTags.value.some(st => st.id === tag.id)
    )
  } else {
    filteredAvailableTags.value = availableTags.value.filter(tag => 
      tag.name.toLowerCase().includes(query) &&
      !selectedTags.value.some(st => st.id === tag.id)
    )
  }
}

async function addTag() {
  const tagName = tagInput.value.trim()
  if (!tagName) return
  
  // Check if tag already exists in available tags
  let tag = availableTags.value.find(t => t.name.toLowerCase() === tagName.toLowerCase())
  
  if (!tag) {
    // Create new tag
    const newTag = {
      id: generateUUID(),
      name: tagName,
      color: '#3b82f6', // Default blue
      created_at: new Date().toISOString(),
      user_id: null
    }
    
    try {
      await db.tags.add(newTag)
      availableTags.value.push(newTag)
      tag = newTag
      console.log('[InterventionForm] Created new tag:', tag)
    } catch (error) {
      console.error('Error creating tag:', error)
      return
    }
  }
  
  // Add to selected tags if not already selected
  if (!selectedTags.value.some(st => st.id === tag.id)) {
    selectedTags.value.push(tag)
    console.log('[InterventionForm] Tag added, selected tags:', selectedTags.value)
  }
  
  tagInput.value = ''
  showTagSuggestions.value = false
  filterAvailableTags()
}

function selectTag(tag) {
  if (!selectedTags.value.some(st => st.id === tag.id)) {
    selectedTags.value.push(tag)
  }
  tagInput.value = ''
  showTagSuggestions.value = false
  filterAvailableTags()
}

function removeTag(tagId) {
  selectedTags.value = selectedTags.value.filter(t => t.id !== tagId)
  filterAvailableTags()
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

// Image Editor Functions
function openImageEditor(photo) {
  imageEditor.value.photo = photo
  imageEditor.value.show = true
}

// Image Viewer Functions
function openImageViewer(index) {
  imageViewer.value.index = index
  imageViewer.value.show = true
}

function getPhotoUrl(photo) {
  // Try local first, then cloud, fallback to empty string
  return photo.url_local || photo.url_cloud || ''
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

function handleImageSave(dataURL) {
  if (!imageEditor.value.photo) return
  
  // Update the photo with the edited image
  const photoIndex = photos.value.findIndex(p => p.id === imageEditor.value.photo.id)
  if (photoIndex > -1) {
    photos.value[photoIndex].url_local = dataURL
    // Reset cloud URL since image has been edited
    photos.value[photoIndex].url_cloud = null
  }
}

function handleDictationTranscription(transcription) {
  // Append transcribed text to comment textarea
  if (commentText.value.trim()) {
    commentText.value += ' ' + transcription
  } else {
    commentText.value = transcription
  }
  
  // Focus the textarea so user can edit
  nextTick(() => {
    const textarea = document.querySelector('textarea[v-model="commentText"]')
    if (textarea) {
      textarea.focus()
      // Move cursor to end
      textarea.setSelectionRange(textarea.value.length, textarea.value.length)
    }
  })
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

async function saveInterventionTags(interventionId) {
  try {
    // Remove all existing tag links for this intervention
    await db.intervention_tags
      .where('intervention_id').equals(interventionId)
      .delete()
    
    // Add new tag links
    for (const tag of selectedTags.value) {
      await db.intervention_tags.add({
        intervention_id: interventionId,
        tag_id: tag.id
      })
    }
    
    console.log('[InterventionForm] Saved intervention tags:', selectedTags.value.map(t => t.name))
  } catch (error) {
    console.error('Error saving intervention tags:', error)
  }
}

function formatDate(dateString) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString()
}

async function saveIntervention() {
  saving.value = true
  
  try {
    // Use temp ID if we have one (for new interventions with dictation)
    const interventionId = route.params.id || tempInterventionId.value || generateUUID()
    // Update temp ID if we just generated one
    if (!route.params.id && !tempInterventionId.value) {
      tempInterventionId.value = interventionId
    }
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
    
    // Save intervention (without tags - tags are in separate table)
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
    
    console.log('[InterventionForm] Intervention object before save:', intervention)
    await db.interventions.put(intervention)
    
    // Save tags to junction table
    await saveInterventionTags(interventionId)
    
    // Update pending audio records with actual intervention ID (if we had a temp ID)
    if (tempInterventionId.value && tempInterventionId.value !== interventionId) {
      try {
        const pendingAudios = await db.pending_audio
          .where('intervention_id')
          .equals(tempInterventionId.value)
          .toArray()
        
        for (const pendingAudio of pendingAudios) {
          await db.pending_audio.update(pendingAudio.id, {
            intervention_id: interventionId
          })
        }
      } catch (error) {
        console.error('Error updating pending audio IDs:', error)
      }
    }
    
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
            // Log error but don't block the save process
            // The photo will remain with url_cloud = null and can be uploaded later
            console.warn('Error uploading photo (will retry later):', error.message || error)
          }
        }
      }
      
      // Sync tags to cloud
      await syncTagsToCloud(selectedTags.value)
      await syncInterventionTagsToCloud(interventionId, selectedTags.value)
      
      // Mark as synced
      intervention.synced = true
      await db.interventions.put(intervention)
      console.log('[InterventionForm] Intervention marked as synced')
    } catch (error) {
      console.error('Error syncing to cloud (will sync later):', error)
    }
    
    router.push('/')
  } catch (error) {
    console.error('Error saving intervention:', error)
    alert('Error saving intervention. Please try again.')
  } finally {
    saving.value = false
  }
}

// Global audio transcription handler
function handleGlobalAudioTranscribed(event) {
  const { interventionId, transcription } = event.detail
  const currentId = route.params.id || tempInterventionId.value
  if (interventionId === currentId) {
    handleDictationTranscription(transcription)
  }
}

onMounted(() => {
  loadIntervention()
  window.addEventListener('audioTranscribed', handleGlobalAudioTranscribed)
})

onUnmounted(() => {
  window.removeEventListener('audioTranscribed', handleGlobalAudioTranscribed)
})
</script>
