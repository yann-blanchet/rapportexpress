<template>
  <div class="pb-20">
    <div class="flex items-center justify-between gap-3 mb-6">
      <div class="flex items-center gap-3">
        <router-link to="/" class="btn btn-ghost btn-circle btn-sm">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </router-link>
        <h1 class="text-3xl font-bold">
          {{ isEdit && form.sequence_number ? getDisplayTitle({ client_name: form.client_name, sequence_number: form.sequence_number }) : (isEdit ? 'Edit Intervention' : 'Create New Intervention') }}
        </h1>
      </div>
      <SyncIndicator />
    </div>

    <div>
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
          @click="activeTab = 'feed'"
          :class="['tab', activeTab === 'feed' ? 'tab-active' : '']"
        >
          Feed
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
              <div class="relative" @click.stop>
                <input
                  type="text"
                  v-model="form.client_name"
                  @input="filterBaseTitleSuggestions"
                  @focus="showBaseTitleSuggestions = true"
                  @blur="handleBaseTitleInputBlur"
                  required
                  placeholder="Enter client or site name"
                  class="input input-bordered w-full"
                  list="base-title-suggestions"
                />
                <!-- Base Title Suggestions Dropdown -->
                <div
                  v-if="showBaseTitleSuggestions && filteredBaseTitleSuggestions.length > 0"
                  class="absolute z-10 w-full mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                >
                  <button
                    v-for="title in filteredBaseTitleSuggestions"
                    :key="title"
                    type="button"
                    @click="selectBaseTitle(title)"
                    class="w-full text-left px-4 py-2 hover:bg-base-200 transition-colors"
                  >
                    {{ title }}
                  </button>
                </div>
              </div>
              <div class="label">
                <span class="label-text-alt text-base-content/60">
                  Type to see suggestions from recent reports
                </span>
              </div>
            </div>
            
            <!-- Sequence Number Display (read-only, auto-generated) -->
            <div v-if="form.sequence_number" class="form-control mb-4">
              <label class="label">
                <span class="label-text">Report Number</span>
              </label>
              <div class="badge badge-lg badge-outline p-3">
                {{ formatSequenceNumber(form.sequence_number) }}
              </div>
              <div class="label">
                <span class="label-text-alt text-base-content/60">
                  Auto-generated sequence number
                </span>
              </div>
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
                class="flex flex-col gap-2 p-2 border rounded-lg"
              >
                <div class="flex items-center gap-2">
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
                <!-- Category Badge for Checklist Item -->
                <div v-if="item.category" class="flex items-center gap-2">
                  <span class="badge badge-sm badge-primary">
                    {{ getCategoryName(item.category) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Feed Tab (WhatsApp-style: text, photos, audio) -->
          <div v-show="activeTab === 'feed'">
            <div class="mb-4">
              <h2 class="card-title">Feed</h2>
            </div>

            <!-- Feed Entries (WhatsApp-style) -->
            <div ref="feedContainer" class="space-y-4 mb-4 max-h-96 overflow-y-auto">
              <div
                v-for="entry in feedEntries"
                :key="entry.id"
                class="flex flex-col gap-2"
                @contextmenu.prevent="showEntryMenu($event, entry)"
                @touchstart="handleEntryTouchStart(entry)"
                @touchend="handleEntryTouchEnd"
              >
                <!-- Entry Content -->
                <div class="flex items-start gap-3">
                  <!-- Avatar/Bubble -->
                  <div class="flex-shrink-0">
                    <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-content text-xs">
                      <svg v-if="entry.type === 'text'" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <svg v-else-if="entry.type === 'photo'" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <svg v-else-if="entry.type === 'audio'" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    </div>
                  </div>

                  <!-- Entry Bubble -->
                  <div class="flex-1 bg-base-200 rounded-lg p-3 relative group">
                    <!-- Category Badge -->
                    <div v-if="entry.category" class="mb-2">
                      <span class="badge badge-sm badge-primary">
                        {{ getCategoryName(entry.category) }}
                      </span>
                    </div>
                    
                    <!-- Action buttons (3-dot menu and delete) -->
                    <div class="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <!-- Delete button -->
                      <button
                        type="button"
                        @click.stop="deleteEntry(entry)"
                        class="btn btn-xs btn-error btn-circle"
                        title="Delete entry"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      <!-- 3-dot menu -->
                      <button
                        type="button"
                        @click.stop="showEntryMenu($event, entry)"
                        class="btn btn-xs btn-ghost btn-circle"
                        title="More options"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    </div>

                    <!-- Text Entry -->
                    <div v-if="entry.type === 'text'">
                      <p class="text-sm whitespace-pre-wrap">{{ entry.text }}</p>
                    </div>

                    <!-- Photo Entry -->
                    <div v-else-if="entry.type === 'photo'">
                      <div v-if="getPhotoById(entry.photo_id)" class="relative">
                        <img
                          :src="getPhotoUrl(getPhotoById(entry.photo_id))"
                          alt="Photo"
                          class="w-full max-w-xs rounded-lg cursor-pointer"
                          @click="openPhotoViewer(entry.photo_id)"
                          @error="handleImageError($event, getPhotoById(entry.photo_id))"
                        />
                        <div v-if="entry.status === 'uploading'" class="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center z-10">
                          <span class="loading loading-spinner loading-md text-white"></span>
                        </div>
                        <div v-if="entry.status === 'pending'" class="absolute top-2 right-2 badge badge-warning badge-sm z-10">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Pending upload
                        </div>
                        <div v-if="entry.status === 'completed' && getPhotoById(entry.photo_id)?.url_cloud" class="absolute top-2 right-2 badge badge-success badge-sm z-10 opacity-70">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                      <div v-else class="text-xs text-base-content/70">Photo not found</div>
                    </div>

                    <!-- Audio Entry -->
                    <div v-else-if="entry.type === 'audio'">
                      <div v-if="entry.status === 'transcribing'" class="flex items-center gap-2">
                        <span class="loading loading-spinner loading-sm"></span>
                        <span class="text-xs">Transcribing...</span>
                      </div>
                      <div v-else-if="entry.status === 'pending'" class="flex items-center gap-2">
                        <span class="badge badge-warning badge-sm">Pending transcription</span>
                      </div>
                      <div v-else-if="entry.transcription">
                        <p class="text-sm">{{ entry.transcription }}</p>
                        <div v-if="entry.pending_audio_id" class="text-xs text-base-content/70 mt-1">
                          Audio stored locally
                        </div>
                      </div>
                      <div v-else class="text-xs text-base-content/70">
                        Processing audio...
                      </div>
                    </div>

                    <!-- Timestamp -->
                    <p class="text-xs text-base-content/70 mt-2">
                      {{ formatDate(entry.created_at) }}
                    </p>
                  </div>
                </div>
              </div>

              <div v-if="feedEntries.length === 0" class="text-center py-8 text-base-content/70">
                No entries yet. Add text, photos, or audio below.
              </div>
            </div>

            <!-- Input Area (WhatsApp-style bottom input) -->
            <div class="border-t pt-4 space-y-3">
              <!-- Category Selection (one-tap buttons) -->
              <div v-if="availableCategories.length > 0" class="flex flex-wrap gap-2 mb-2">
                <button
                  v-for="category in availableCategories"
                  :key="category.id"
                  type="button"
                  @click="selectCategory(category.id)"
                  :class="[
                    'btn btn-xs',
                    selectedCategoryId === category.id ? 'btn-primary' : 'btn-outline'
                  ]"
                >
                  {{ category.name }}
                </button>
              </div>
              
              <!-- Text Input -->
              <textarea
                v-model="feedTextInput"
                placeholder="Type a message..."
                class="textarea textarea-bordered w-full"
                rows="2"
                @keydown.ctrl.enter="addFeedEntry('text')"
                @keydown.meta.enter="addFeedEntry('text')"
              ></textarea>

              <!-- Action Buttons -->
              <div class="flex items-center gap-2">
                <!-- Photo Button -->
                <input
                  type="file"
                  ref="feedPhotoInput"
                  @change="handleFeedPhotoUpload"
                  accept="image/*"
                  capture="environment"
                  class="hidden"
                />
                <button
                  type="button"
                  @click="$refs.feedPhotoInput.click()"
                  class="btn btn-sm btn-circle btn-primary"
                  title="Add Photo"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>

                <!-- Audio Button -->
                <AudioDictation
                  :intervention-id="currentInterventionId"
                  @transcription="handleFeedAudioTranscription"
                  ref="feedAudioDictationRef"
                />

                <!-- Send Button -->
                <button
                  type="button"
                  @click="addFeedEntry('text')"
                  class="btn btn-sm btn-primary flex-1"
                  :disabled="!feedTextInput.trim()"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- Entry Context Menu -->
    <div
      v-if="entryMenu.show"
      class="fixed z-50 bg-base-100 border border-base-300 rounded-lg shadow-lg p-2 min-w-32"
      :style="{ left: entryMenu.x + 'px', top: entryMenu.y + 'px' }"
      @click.stop
    >
      <button
        type="button"
        @click="duplicateEntry(entryMenu.entry)"
        class="btn btn-sm btn-ghost w-full justify-start"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        Duplicate
      </button>
      <button
        type="button"
        @click="deleteEntry(entryMenu.entry)"
        class="btn btn-sm btn-ghost text-error w-full justify-start"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Delete
      </button>
    </div>

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

    <!-- Auto-save indicator -->
    <div v-if="autoSaving || lastSaved" class="fixed bottom-4 right-4 z-50">
      <div class="badge badge-sm" :class="autoSaving ? 'badge-info' : 'badge-success'">
        <span v-if="autoSaving" class="loading loading-spinner loading-xs mr-1"></span>
        <span v-else class="mr-1">✓</span>
        {{ autoSaving ? 'Saving...' : 'Saved' }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { db } from '../db/indexeddb'
import { generateUUID } from '../utils/uuid'
import { syncInterventionToCloud, uploadPhotoToCloud, syncPhotoToCloud, deletePhotoFromCloud } from '../services/supabase'
import { compressImage } from '../utils/imageCompression'
import ImageEditor from '../components/ImageEditor.vue'
import ImageViewer from '../components/ImageViewer.vue'
import AudioDictation from '../components/AudioDictation.vue'
import SyncIndicator from '../components/SyncIndicator.vue'
import { getNextSequenceNumber, getBaseTitleSuggestions, formatSequenceNumber, getDisplayTitle } from '../utils/sequenceNumber'
import { 
  getSelectedTrade, 
  getCategoriesForTrade, 
  getCategoryName, 
  getLastUsedCategory, 
  saveLastUsedCategory,
  getDefaultCategory,
  TRADES
} from '../utils/categories'

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
const loadedInterventionId = ref(null) // Store the ID of the intervention we're editing

const form = ref({
  client_name: '',
  date: new Date().toISOString().slice(0, 16),
  status: 'In Progress',
  sequence_number: null // Auto-generated when saving
})

const checklistItems = ref([])
const photos = ref([])
const comments = ref([]) // Old comments structure (for migration)
const commentText = ref('') // Old comment text (for migration)

// Base title autocomplete state
const baseTitleSuggestions = ref([])
const filteredBaseTitleSuggestions = ref([])
const showBaseTitleSuggestions = ref(false)

// Feed state (unified feed)
const feedEntries = ref([]) // Unified feed entries (text, photo, audio)
const feedTextInput = ref('')
const feedPhotoInput = ref(null)
const feedContainer = ref(null) // Ref for feed container (for auto-scroll)

// Auto-save state
const autoSaving = ref(false)
const lastSaved = ref(false)
const autoSaveTimeout = ref(null)
const isSavingLocal = ref(false) // Flag to prevent concurrent local saves
const isSyncing = ref(false) // Flag to prevent concurrent cloud syncs
const feedAudioDictationRef = ref(null)
const entryMenu = ref({ show: false, entry: null, x: 0, y: 0 })
const longPressTimer = ref(null)
const initialLoadComplete = ref(false)

// Category state
const selectedCategoryId = ref(null)
const availableCategories = ref([])

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
    // Store the intervention ID we're editing
    loadedInterventionId.value = route.params.id
    // Clear temp ID when editing existing intervention
    tempInterventionId.value = null
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
              photo_ids: Array.isArray(item.photo_ids) ? item.photo_ids : [],
              category: item.category || null
            }))
          : []

        // Load photos (still separate table)
        photos.value = await db.photos
          .where('intervention_id').equals(route.params.id)
          .toArray()

        // Load feed entries from JSONB column (new unified structure)
        feedEntries.value = Array.isArray(intervention.comments)
          ? intervention.comments
              .filter(entry => entry.type) // Only entries with type (new format)
              .map(entry => {
                // For photo entries, check if photo has url_cloud to determine status
                let status = entry.status || 'completed'
                if (entry.type === 'photo' && entry.photo_id) {
                  const photo = photos.value.find(p => p.id === entry.photo_id)
                  if (photo) {
                    // If photo doesn't have url_cloud, it's pending upload
                    if (!photo.url_cloud) {
                      status = 'pending'
                    } else {
                      status = 'completed'
                    }
                  }
                }
                return {
                  id: entry.id || generateUUID(),
                  type: entry.type || 'text',
                  text: entry.text || '',
                  photo_id: entry.photo_id || null,
                  transcription: entry.transcription || null,
                  pending_audio_id: entry.pending_audio_id || null,
                  category: entry.category || null,
                  created_at: entry.created_at || new Date().toISOString(),
                  status: status
                }
              })
              .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
          : []
        
        // Load old comments format for migration
        comments.value = Array.isArray(intervention.comments)
          ? intervention.comments
              .filter(entry => !entry.type) // Old format entries
              .map(comment => ({
                id: comment.id || generateUUID(),
                text: comment.text || '',
                created_at: comment.created_at || new Date().toISOString()
              }))
          : []
        
        // Check for pending audio (for status display)
        const pendingAudios = await db.pending_audio
          .where('intervention_id')
          .equals(route.params.id)
          .toArray()
        
        // Update feed entries with pending audio status
        for (const entry of feedEntries.value) {
          if (entry.type === 'audio' && entry.pending_audio_id) {
            const pendingAudio = pendingAudios.find(pa => pa.id === entry.pending_audio_id)
            if (pendingAudio && !entry.transcription) {
              entry.status = 'pending'
            }
          }
        }

        
        // Offline-first: Load images from local storage first
        // Then trigger background sync if online and there are unsynced items
        if (navigator.onLine) {
          // Check if intervention needs syncing
          const needsSync = !intervention.synced || 
            photos.value.some(p => p.url_local && !p.url_cloud)
          
          if (needsSync) {
            // Trigger background sync (non-blocking, offline-first)
            // Load images from local first, then sync in background
            syncInterventionToCloudBackground(intervention, route.params.id).catch(err => 
              console.error('Background sync error on load:', err)
            )
          }
        }
      }
    } catch (error) {
      console.error('Error loading intervention:', error)
    }
  } else {
    // New intervention - clear loaded ID
    loadedInterventionId.value = null
  }
  
  // Load base title suggestions
  await loadBaseTitleSuggestions()
  
  // Load categories based on selected trade
  loadCategories()
  
  // Listen for audio transcription events from global processor
  window.addEventListener('audioTranscribed', handleGlobalAudioTranscription)
  window.addEventListener('audioTranscribing', handleGlobalAudioTranscribing)
  
  // Mark initial load as complete (after all data is loaded)
  // Use nextTick to ensure all reactive updates are complete
  await nextTick()
  initialLoadComplete.value = true
}

function handleGlobalAudioTranscribing(event) {
  const { interventionId, pendingAudioId } = event.detail
  
  // Only handle if it's for the current intervention
  if (interventionId === currentInterventionId.value || interventionId === route.params.id) {
    // Find the feed entry matching the pending audio ID
    const entry = feedEntries.value.find(e => 
      e.type === 'audio' && 
      e.pending_audio_id === pendingAudioId
    )
    
    // Update status to "transcribing"
    if (entry && entry.status === 'pending') {
      entry.status = 'transcribing'
      // Trigger auto-save after status change
      if (initialLoadComplete.value) {
        autoSave()
      }
    }
  }
}

function handleGlobalAudioTranscription(event) {
  const { interventionId, pendingAudioId, transcription } = event.detail
  
  // Only handle if it's for the current intervention
  if (interventionId === currentInterventionId.value || interventionId === route.params.id) {
    // Find the feed entry matching the pending audio ID
    let entry = feedEntries.value.find(e => 
      e.type === 'audio' && 
      e.pending_audio_id === pendingAudioId
    )
    
    // If not found by pending_audio_id, find most recent pending entry
    if (!entry) {
      entry = feedEntries.value
        .filter(e => e.type === 'audio' && e.status === 'pending' && !e.transcription)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
    }
    
    if (entry) {
      // Update existing entry with transcription
      entry.transcription = transcription
      entry.status = 'completed'
      // Clear pending_audio_id since it's been transcribed
      entry.pending_audio_id = null
      
      // Scroll to bottom when transcription completes
      scrollFeedToBottom()
      
      // Trigger auto-save after transcription update
      if (initialLoadComplete.value) {
        autoSave()
      }
    } else {
      // Create new entry if none found (shouldn't happen, but fallback)
      const newEntry = {
        id: generateUUID(),
        type: 'audio',
        transcription: transcription,
        pending_audio_id: null,
        created_at: new Date().toISOString(),
        status: 'completed'
      }
      feedEntries.value.push(newEntry)
      
      // Scroll to bottom after adding fallback audio entry
      scrollFeedToBottom()
      
      // Trigger auto-save after adding fallback audio entry
      if (initialLoadComplete.value) {
        autoSave()
      }
    }
  }
}


async function loadBaseTitleSuggestions() {
  try {
    baseTitleSuggestions.value = await getBaseTitleSuggestions(db, 10)
    filteredBaseTitleSuggestions.value = baseTitleSuggestions.value
  } catch (error) {
    console.error('Error loading base title suggestions:', error)
    baseTitleSuggestions.value = []
    filteredBaseTitleSuggestions.value = []
  }
}

function filterBaseTitleSuggestions() {
  const query = form.value.client_name.trim().toLowerCase()
  if (!query) {
    filteredBaseTitleSuggestions.value = baseTitleSuggestions.value
  } else {
    filteredBaseTitleSuggestions.value = baseTitleSuggestions.value.filter(title =>
      title.toLowerCase().includes(query)
    )
  }
}

function handleBaseTitleInputBlur() {
  // Delay closing suggestions to allow clicking on them
  window.setTimeout(() => {
    showBaseTitleSuggestions.value = false
  }, 200)
}

function selectBaseTitle(title) {
  form.value.client_name = title
  showBaseTitleSuggestions.value = false
  filterBaseTitleSuggestions()
}


function addChecklistItem() {
  // Get category for checklist item
  const trade = getSelectedTrade() || TRADES.GENERAL
  const categoryId = selectedCategoryId.value || getLastUsedCategory(trade) || getDefaultCategory(trade)
  
  checklistItems.value.push({
    id: generateUUID(),
    intervention_id: route.params.id || null,
    label: '',
    checked: false,
    photo_ids: [],
    category: categoryId
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

async function removePhoto(photoId) {
  const index = photos.value.findIndex(p => p.id === photoId)
  if (index > -1) {
    const photo = photos.value[index]
    
    // Remove from local array first
    photos.value.splice(index, 1)
    
    // Delete from IndexedDB
    try {
      await db.photos.delete(photoId)
    } catch (error) {
      console.error('Error deleting photo from IndexedDB:', error)
    }
    
    // Delete from Supabase if synced (has url_cloud)
    if (photo.url_cloud && navigator.onLine) {
      try {
        await deletePhotoFromCloud(photo)
        console.log('[InterventionForm] Deleted photo from cloud:', photoId)
      } catch (error) {
        console.error('Error deleting photo from cloud:', error)
        // Photo is already removed locally, so user can continue
        // It will be cleaned up later or can be manually removed
      }
    }
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

// Scroll feed to bottom
function scrollFeedToBottom() {
  nextTick(() => {
    if (feedContainer.value) {
      feedContainer.value.scrollTop = feedContainer.value.scrollHeight
    }
  })
}

// Category Functions
function loadCategories() {
  const trade = getSelectedTrade() || TRADES.GENERAL
  availableCategories.value = getCategoriesForTrade(trade)
  
  // Set default category (last used or default)
  if (!selectedCategoryId.value) {
    selectedCategoryId.value = getLastUsedCategory(trade)
  }
}

function selectCategory(categoryId) {
  selectedCategoryId.value = categoryId
  const trade = getSelectedTrade() || TRADES.GENERAL
  saveLastUsedCategory(trade, categoryId)
}

// Feed Functions
function addFeedEntry(type) {
  if (type === 'text' && !feedTextInput.value.trim()) return
  
  // Get category (use selected or default)
  const trade = getSelectedTrade() || TRADES.GENERAL
  const categoryId = selectedCategoryId.value || getLastUsedCategory(trade) || getDefaultCategory(trade)
  
  const entry = {
    id: generateUUID(),
    type: type,
    text: type === 'text' ? feedTextInput.value.trim() : '',
    photo_id: null,
    transcription: null,
    pending_audio_id: null,
    category: categoryId,
    created_at: new Date().toISOString(),
    status: 'completed'
  }
  
  feedEntries.value.push(entry)
  feedTextInput.value = ''
  
  // Scroll to bottom after adding entry
  scrollFeedToBottom()
  
  // Trigger auto-save after adding text entry
  if (initialLoadComplete.value) {
    autoSave()
  }
}

async function handleFeedPhotoUpload(event) {
  const file = event.target.files[0]
  if (!file) return

  const photoId = generateUUID()
  const reader = new FileReader()
  
  reader.onload = async (e) => {
    // Create photo object with base64 local storage (offline-first)
    const photo = {
      id: photoId,
      intervention_id: currentInterventionId.value,
      url_local: e.target.result, // Base64 data URL - stored locally
      url_cloud: null, // Will be set during sync
      description: '',
      taken_at: new Date().toISOString(),
      file_name: file.name,
      file_type: file.type,
      file_size: file.size
    }
    
    // Save to IndexedDB immediately (offline-first)
    await db.photos.put(photo)
    photos.value.push(photo)
    
    // Get category for photo entry
    const trade = getSelectedTrade() || TRADES.GENERAL
    const categoryId = selectedCategoryId.value || getLastUsedCategory(trade) || getDefaultCategory(trade)
    
    // Create feed entry for photo
    const entry = {
      id: generateUUID(),
      type: 'photo',
      photo_id: photoId,
      category: categoryId,
      created_at: new Date().toISOString(),
      status: navigator.onLine ? 'pending' : 'pending' // Will be uploaded during sync
    }
    
    feedEntries.value.push(entry)
    
    // Scroll to bottom after adding photo entry
    scrollFeedToBottom()
    
    // Trigger auto-save after adding photo entry
    if (initialLoadComplete.value) {
      autoSave()
    }
    
    // Note: Photo upload to Supabase Storage happens during sync, not immediately
    // This ensures offline-first behavior - photos are always saved locally first
  }
  
  reader.readAsDataURL(file)
  event.target.value = ''
}

async function handleFeedAudioRecordingStarted() {
  // Get category for audio entry
  const trade = getSelectedTrade() || TRADES.GENERAL
  const categoryId = selectedCategoryId.value || getLastUsedCategory(trade) || getDefaultCategory(trade)
  
  // Create a pending audio entry immediately when recording starts
  // The pending_audio_id will be set when the audio is saved to IndexedDB
  const entry = {
    id: generateUUID(),
    type: 'audio',
    transcription: null,
    pending_audio_id: null, // Will be set when audio blob is saved
    category: categoryId,
    created_at: new Date().toISOString(),
    status: 'pending'
  }
  
  feedEntries.value.push(entry)
  
  // Scroll to bottom when recording starts
  scrollFeedToBottom()
  
  // Wait a bit for the audio to be saved, then update the entry with pending_audio_id
  setTimeout(async () => {
    const pendingAudios = await db.pending_audio
      .where('intervention_id')
      .equals(currentInterventionId.value)
      .toArray()
    
    const mostRecent = pendingAudios.sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    )[0]
    
    if (mostRecent && entry.status === 'pending' && !entry.pending_audio_id) {
      entry.pending_audio_id = mostRecent.id
    }
  }, 500)
}

async function handleFeedAudioTranscription(transcription) {
  // Find the most recent pending audio entry in feed (created when recording started)
  const pendingAudioEntries = feedEntries.value
    .filter(e => e.type === 'audio' && e.status === 'pending' && !e.transcription)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  
  if (pendingAudioEntries.length > 0) {
    // Update existing pending entry with transcription
    const entry = pendingAudioEntries[0]
    entry.transcription = transcription
    entry.status = 'completed'
  } else {
    // Create new entry if none found (shouldn't happen, but fallback)
    const pendingAudios = await db.pending_audio
      .where('intervention_id')
      .equals(currentInterventionId.value)
      .toArray()
    
    const pendingAudio = pendingAudios.sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    )[0]
    
    // Get category for audio entry
    const trade = getSelectedTrade() || TRADES.GENERAL
    const categoryId = selectedCategoryId.value || getLastUsedCategory(trade) || getDefaultCategory(trade)
    
    const entry = {
      id: generateUUID(),
      type: 'audio',
      transcription: transcription,
      pending_audio_id: pendingAudio?.id || null,
      category: categoryId,
      created_at: pendingAudio?.created_at || new Date().toISOString(),
      status: 'completed'
    }
    
    feedEntries.value.push(entry)
    
    // Scroll to bottom after adding audio entry
    scrollFeedToBottom()
    
    // Trigger auto-save after adding audio entry
    if (initialLoadComplete.value) {
      autoSave()
    }
  }
}


function getPhotoById(photoId) {
  return photos.value.find(p => p.id === photoId)
}


function openPhotoViewer(photoId) {
  const index = photos.value.findIndex(p => p.id === photoId)
  if (index > -1) {
    openImageViewer(index)
  }
}

function showEntryMenu(event, entry) {
  event.stopPropagation()
  const x = event.clientX || event.touches?.[0]?.clientX || window.innerWidth / 2
  const y = event.clientY || event.touches?.[0]?.clientY || window.innerHeight / 2
  
  entryMenu.value = {
    show: true,
    entry: entry,
    x: Math.min(x, window.innerWidth - 150), // Keep menu on screen
    y: Math.min(y, window.innerHeight - 100)
  }
  
  // Close menu when clicking outside
  setTimeout(() => {
    const closeMenu = (e) => {
      if (!e.target.closest('.fixed.z-50')) {
        entryMenu.value.show = false
        document.removeEventListener('click', closeMenu)
      }
    }
    document.addEventListener('click', closeMenu)
  }, 100)
}

function duplicateEntry(entry) {
  const duplicated = {
    ...entry,
    id: generateUUID(),
    created_at: new Date().toISOString()
  }
  
  // If it's a photo entry, duplicate the photo too
  if (entry.type === 'photo' && entry.photo_id) {
    const originalPhoto = getPhotoById(entry.photo_id)
    if (originalPhoto) {
      const newPhotoId = generateUUID()
      const newPhoto = {
        ...originalPhoto,
        id: newPhotoId,
        taken_at: new Date().toISOString()
      }
      photos.value.push(newPhoto)
      duplicated.photo_id = newPhotoId
    }
  }
  
  // For audio entries, don't duplicate pending_audio_id (it's already transcribed)
  if (entry.type === 'audio') {
    duplicated.pending_audio_id = null
  }
  
  // Clean up duplicated entry
  
  // Preserve category if it exists
  if (!duplicated.category) {
    const trade = getSelectedTrade() || TRADES.GENERAL
    duplicated.category = getLastUsedCategory(trade) || getDefaultCategory(trade)
  }
  
  feedEntries.value.push(duplicated)
  entryMenu.value.show = false
  
  // Scroll to bottom after duplicating entry
  scrollFeedToBottom()
  
  // Trigger auto-save after duplicating entry
  if (initialLoadComplete.value) {
    autoSave()
  }
}

function deleteEntry(entry) {
  if (!entry) return
  
  // Confirm deletion
  if (!confirm('Are you sure you want to delete this entry?')) {
    return
  }
  
  const index = feedEntries.value.findIndex(e => e.id === entry.id)
  if (index > -1) {
    feedEntries.value.splice(index, 1)
    
    // Also delete associated photo/audio if needed
    if (entry.type === 'photo' && entry.photo_id) {
      // Remove photo from local, IndexedDB, and Supabase
      removePhoto(entry.photo_id).catch(err => 
        console.error('Error removing photo:', err)
      )
    }
    // For audio entries, delete the pending_audio record if it exists
    if (entry.type === 'audio' && entry.pending_audio_id) {
      db.pending_audio.delete(entry.pending_audio_id).catch(err => 
        console.error('Error deleting pending audio:', err)
      )
    }
    
    // Trigger auto-save after deleting entry
    if (initialLoadComplete.value) {
      autoSave()
    }
  }
  entryMenu.value.show = false
}

let touchStartTime = 0
function handleEntryTouchStart(entry) {
  touchStartTime = Date.now()
  longPressTimer.value = setTimeout(() => {
    showEntryMenu({ touches: [{ clientX: 0, clientY: 0 }] }, entry)
  }, 500) // 500ms long press
}

function handleEntryTouchEnd() {
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
    longPressTimer.value = null
  }
}

// Old comment function (kept for backward compatibility during migration)
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

// Save to local DB only (instant, non-blocking)
async function saveInterventionLocal() {
  try {
    // Determine intervention ID:
    // 1. If we have a loaded intervention ID (editing), use it
    // 2. If route.params.id exists (editing), use it
    // 3. Otherwise, use temp ID or generate one (creating)
    let interventionId
    if (loadedInterventionId.value) {
      // We're editing - use the loaded intervention ID
      interventionId = loadedInterventionId.value
      // Clear temp ID if it was set (shouldn't happen in edit mode, but safety check)
      if (tempInterventionId.value && tempInterventionId.value !== interventionId) {
        console.warn('[InterventionForm] Clearing tempInterventionId in edit mode:', tempInterventionId.value)
        tempInterventionId.value = null
      }
    } else if (route.params.id) {
      // Route has ID but we haven't loaded yet - use route ID (shouldn't happen, but safety)
      interventionId = route.params.id
      loadedInterventionId.value = route.params.id // Store it
      // Clear temp ID
      if (tempInterventionId.value && tempInterventionId.value !== interventionId) {
        console.warn('[InterventionForm] Clearing tempInterventionId in edit mode:', tempInterventionId.value)
        tempInterventionId.value = null
      }
    } else {
      // New intervention - use temp ID or generate one
      interventionId = tempInterventionId.value || generateUUID()
      // Update temp ID if we just generated one
      if (!tempInterventionId.value) {
        tempInterventionId.value = interventionId
      }
    }
    const now = new Date().toISOString()
    
    // Prepare checklist items as JSONB array
    // Deep clone to avoid Vue reactivity issues with IndexedDB
    const checklistItemsData = JSON.parse(JSON.stringify(
      checklistItems.value.map(item => ({
        id: item.id || generateUUID(),
        label: item.label || '',
        checked: item.checked || false,
        photo_ids: Array.isArray(item.photo_ids) ? [...item.photo_ids] : [],
        category: item.category || null
      }))
    ))
    
    // Prepare feed entries as JSONB array (unified structure)
    // Deep clone to avoid Vue reactivity issues with IndexedDB
    const feedEntriesData = feedEntries.value.map(entry => ({
      id: entry.id || generateUUID(),
      type: entry.type || 'text',
      text: entry.text || '',
      photo_id: entry.photo_id || null,
      transcription: entry.transcription || null,
      pending_audio_id: entry.pending_audio_id || null,
      category: entry.category || null,
      created_at: entry.created_at || new Date().toISOString(),
      status: entry.status || 'completed'
    }))
    
    // Also include old comments format for backward compatibility (during migration)
    const oldCommentsData = comments.value.map(comment => ({
      id: comment.id || generateUUID(),
      text: comment.text || '',
      created_at: comment.created_at || new Date().toISOString()
    }))
    
    // Merge both (new feed entries first, then old comments)
    // Use JSON.parse(JSON.stringify()) to ensure deep serialization and remove Vue reactivity
    const commentsData = JSON.parse(JSON.stringify([...feedEntriesData, ...oldCommentsData]))
    
    // Get existing intervention to preserve created_at and other fields
    const existingIntervention = await db.interventions.get(interventionId)
    
    // Compute sequence number for new interventions
    let sequenceNumber = form.value.sequence_number
    if (!existingIntervention) {
      // New intervention - compute next sequence number
      if (!sequenceNumber && form.value.client_name.trim()) {
        sequenceNumber = await getNextSequenceNumber(db, form.value.client_name.trim())
      } else if (!sequenceNumber) {
        sequenceNumber = 1 // Default to 1 if no base title
      }
    } else {
      // Editing existing - preserve sequence number or compute if missing
      sequenceNumber = existingIntervention.sequence_number || sequenceNumber
      if (!sequenceNumber && form.value.client_name.trim()) {
        // If base title changed, recompute sequence
        if (existingIntervention.client_name !== form.value.client_name.trim()) {
          sequenceNumber = await getNextSequenceNumber(db, form.value.client_name.trim())
        } else {
          sequenceNumber = 1 // Default if missing
        }
      }
    }
    
    // Save intervention
    const intervention = {
      id: interventionId,
      client_name: form.value.client_name,
      sequence_number: sequenceNumber, // Auto-computed sequence number
      date: new Date(form.value.date).toISOString(),
      status: form.value.status,
      // Preserve created_at if editing, otherwise use now
      created_at: existingIntervention?.created_at || now,
      updated_at: now,
      // Preserve synced status if editing and already synced, otherwise mark as unsynced
      synced: existingIntervention?.synced || false,
      checklist_items: checklistItemsData,
      comments: commentsData
    }
    
    // Use put() which will update if exists, create if not
    // This ensures we're updating the same intervention, not creating a duplicate
    // Log for debugging
    if (loadedInterventionId.value || route.params.id) {
      console.log('[InterventionForm] Updating intervention:', interventionId, 'isEdit:', isEdit.value, 'loadedId:', loadedInterventionId.value, 'routeId:', route.params.id)
    } else {
      console.log('[InterventionForm] Creating new intervention:', interventionId)
    }
    await db.interventions.put(intervention)
    
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
    
    return { intervention, interventionId }
  } catch (error) {
    console.error('Error saving intervention locally:', error)
    throw error
  }
}

// Sync to cloud (background, non-blocking)
async function syncInterventionToCloudBackground(intervention, interventionId) {
  // Prevent multiple simultaneous syncs
  if (isSyncing.value) {
    console.log('[InterventionForm] Sync already in progress, skipping')
    return
  }
  
  isSyncing.value = true
  
  try {
    // Mark as syncing to prevent syncFromCloud from pulling it back immediately
    // Update the local record with a flag or timestamp to prevent race conditions
    const syncNow = new Date().toISOString()
    intervention.updated_at = syncNow
    
    // Update local record with new updated_at before syncing
    await db.interventions.put({
      ...intervention,
      updated_at: syncNow
    })
    
    // Sync intervention (includes checklist_items and comments as JSONB)
    await syncInterventionToCloud(intervention)
    
    // Upload photos to Supabase Storage (offline-first: photos are already saved locally as base64)
    // Convert base64 back to File, compress, then upload
    for (const photo of photos.value) {
      if (photo.url_local && !photo.url_cloud) {
        try {
          // Update feed entry status to "uploading"
          const feedEntry = feedEntries.value.find(e => e.type === 'photo' && e.photo_id === photo.id)
          if (feedEntry) {
            feedEntry.status = 'uploading'
            // Don't trigger save here - the watch will handle it, and we don't want to save during upload
          }
          
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
          
          // Upload to Supabase Storage
          const cloudUrl = await uploadPhotoToCloud(compressedFile, interventionId, photo.id)
          
          // Update photo with cloud URL (keep local base64)
          photo.url_cloud = cloudUrl
          
          // Update in IndexedDB
          const cleanPhoto = {
            id: photo.id,
            intervention_id: interventionId,
            url_local: photo.url_local || '', // Keep local base64
            url_cloud: cloudUrl,
            description: photo.description || '',
            taken_at: photo.taken_at || new Date().toISOString(),
            file_name: photo.file_name || null,
            file_type: photo.file_type || null,
            file_size: photo.file_size || null
          }
          
          await db.photos.put(cleanPhoto)
          
          // Update the photo in the reactive array
          const photoIndex = photos.value.findIndex(p => p.id === photo.id)
          if (photoIndex !== -1) {
            photos.value[photoIndex].url_cloud = cloudUrl
          }
          
          // Sync photo metadata to Supabase database
          await syncPhotoToCloud(cleanPhoto)
          
          // Update feed entry status to "completed"
          if (feedEntry) {
            feedEntry.status = 'completed'
            // Don't trigger save here - the watch will handle it after upload completes
          }
        } catch (error) {
          // Log error but don't block the save process
          // The photo will remain with url_cloud = null and can be uploaded later during next sync
          console.warn('Error uploading photo (will retry later):', error.message || error)
          
          // Update feed entry status back to "pending"
          const feedEntry = feedEntries.value.find(e => e.type === 'photo' && e.photo_id === photo.id)
          if (feedEntry) {
            feedEntry.status = 'pending'
            // Don't trigger save here - the watch will handle it
          }
        }
      }
    }
    
    
    // Mark as synced and update timestamp to prevent syncFromCloud from pulling it back
    const syncCompleteTime = new Date().toISOString()
    intervention.synced = true
    intervention.updated_at = syncCompleteTime
    await db.interventions.put(intervention)
    console.log('[InterventionForm] Intervention marked as synced')
  } catch (error) {
    console.error('Error syncing to cloud (will sync later):', error)
  } finally {
    isSyncing.value = false
  }
}

// Full save (local + cloud) - used for manual saves
async function saveIntervention() {
  saving.value = true
  
  try {
    const { intervention, interventionId } = await saveInterventionLocal()
    
    // Sync to cloud in background (non-blocking)
    syncInterventionToCloudBackground(intervention, interventionId).catch(err => 
      console.error('Background sync error:', err)
    )
    
    // Show saved indicator
    lastSaved.value = true
    setTimeout(() => {
      lastSaved.value = false
    }, 2000)
  } catch (error) {
    console.error('Error saving intervention:', error)
  } finally {
    saving.value = false
    autoSaving.value = false
  }
}

// Auto-save function (instant local save, minimal debounce)
async function autoSave() {
  // Clear existing timeout
  if (autoSaveTimeout.value) {
    clearTimeout(autoSaveTimeout.value)
  }
  
  // Only auto-save if we have a client name (required field)
  if (!form.value.client_name.trim()) {
    return
  }
  
  // Skip if already saving (prevent concurrent saves)
  if (isSavingLocal.value) {
    return
  }
  
  // Set auto-saving indicator
  autoSaving.value = true
  
  // Debounce: wait 1000ms after last change before saving (batch rapid changes)
  // Increased to prevent multiple saves during photo uploads
  autoSaveTimeout.value = setTimeout(async () => {
    // Double-check we're not already saving
    if (isSavingLocal.value) {
      autoSaving.value = false
      return
    }
    
    isSavingLocal.value = true
    try {
      // Save locally first (instant)
      const { intervention, interventionId } = await saveInterventionLocal()
      
      // Show saved indicator briefly
      lastSaved.value = true
      setTimeout(() => {
        lastSaved.value = false
      }, 1000)
      
      // Sync to cloud in background (non-blocking, doesn't affect UI)
      // syncInterventionToCloudBackground handles its own isSyncing flag
      syncInterventionToCloudBackground(intervention, interventionId).catch(err => 
        console.error('Background sync error:', err)
      )
    } catch (error) {
      console.error('Auto-save error:', error)
    } finally {
      autoSaving.value = false
      isSavingLocal.value = false
    }
  }, 500) // 500ms debounce to batch rapid changes
}

// Watch for changes and trigger auto-save
watch(
  () => [
    form.value.client_name,
    form.value.date,
    form.value.status,
    form.value.sequence_number,
    checklistItems.value,
    feedEntries.value,
    photos.value
  ],
  () => {
    // Don't auto-save during initial load
    if (!initialLoadComplete.value) {
      return
    }
    
    // Don't auto-save if we're editing but haven't loaded the intervention yet
    // This prevents creating duplicates when route.params.id exists but loadIntervention hasn't completed
    if (route.params.id && !loadedInterventionId.value) {
      console.log('[InterventionForm] Skipping auto-save - intervention not loaded yet')
      return
    }
    
    // Only auto-save if we're editing an existing intervention or have a temp ID
    if (loadedInterventionId.value || isEdit.value || tempInterventionId.value) {
      autoSave()
    } else if (form.value.client_name.trim()) {
      // For new interventions, create temp ID and start auto-saving
      if (!tempInterventionId.value) {
        tempInterventionId.value = generateUUID()
      }
      autoSave()
    }
  },
  { deep: true }
)

// Watch photos to update feed entry status when url_cloud changes
// Use a flag to prevent triggering during photo upload status changes
let isUpdatingPhotoStatus = false
watch(
  () => photos.value.map(p => ({ id: p.id, url_cloud: p.url_cloud })),
  () => {
    // Skip if we're in the middle of updating photo status (to avoid loops)
    if (isUpdatingPhotoStatus) return
    
    // Update feed entry status based on photo url_cloud
    // Only update if status is not 'uploading' (to avoid interfering with upload process)
    isUpdatingPhotoStatus = true
    for (const entry of feedEntries.value) {
      if (entry.type === 'photo' && entry.photo_id && entry.status !== 'uploading') {
        const photo = photos.value.find(p => p.id === entry.photo_id)
        if (photo) {
          if (photo.url_cloud && entry.status === 'pending') {
            entry.status = 'completed'
          } else if (!photo.url_cloud && entry.status === 'completed') {
            entry.status = 'pending'
          }
        }
      }
    }
    // Reset flag after a short delay
    setTimeout(() => {
      isUpdatingPhotoStatus = false
    }, 100)
  },
  { deep: true }
)

onMounted(() => {
  loadIntervention()
})

onUnmounted(() => {
  // Clear any pending auto-save
  if (autoSaveTimeout.value) {
    clearTimeout(autoSaveTimeout.value)
  }
  
  // Final save before unmounting (if there are changes)
  if (form.value.client_name.trim() && (isEdit.value || tempInterventionId.value)) {
    // Save locally synchronously before leaving, then sync to cloud in background
    saveInterventionLocal()
      .then(({ intervention, interventionId }) => {
        // Sync to cloud in background (fire and forget)
        syncInterventionToCloudBackground(intervention, interventionId).catch(err => 
          console.error('Final background sync error:', err)
        )
      })
      .catch(err => console.error('Final save error:', err))
  }
  
  window.removeEventListener('audioTranscribed', handleGlobalAudioTranscription)
  window.removeEventListener('audioTranscribing', handleGlobalAudioTranscribing)
})
</script>
