<template>
  <div class="fixed inset-0 overflow-hidden">
    <!-- Header with Icon - Fixed at Top (matching Dashboard design) -->
    <div class="fixed top-0 left-0 right-0 z-50 safe-area-top bg-base-100/95 backdrop-blur-xl border-b-2 border-base-300" ref="headerRef">
      <!-- Content -->
      <div class="container mx-auto px-4 py-3">
        <!-- Header with Back Button on Left, Content on Right -->
        <div class="flex items-start gap-3">
          <!-- Back Button (vertical center aligned) -->
          <router-link to="/" class="btn btn-ghost btn-circle flex-shrink-0 mt-1">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </router-link>

          <!-- Right Side: Two Lines -->
          <div class="flex-1 min-w-0">
            <!-- First Line: Client Name, Sync Indicator -->
            <div class="flex items-center justify-between gap-3 mb-2">
              <!-- Client Name -->
              <button
                type="button"
                @click="openInfoSheet"
                class="text-left flex-1 min-w-0"
                :disabled="onboarding.show"
              >
                <div class="text-lg font-bold truncate">
                  {{ form.client_name || 'Tap to add' }}
                </div>
              </button>

              <!-- Sync Indicator -->
              <div class="flex-shrink-0">
                <SyncIndicator />
              </div>
            </div>

            <!-- Second Line: Date, Sequence Number (left) | Status (right) -->
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <!-- Date -->
                <button
                  type="button"
                  @click="openInfoSheet"
                  class="text-left flex-shrink-0"
                  :disabled="onboarding.show"
                >
                  <div class="text-sm font-medium">
                    {{ formatDateForDisplay(form.date) }}
                  </div>
                </button>

                <!-- Sequence Number (if exists) -->
                <div v-if="form.sequence_number" class="flex-shrink-0">
                  <div class="badge badge-outline">
                    {{ formatSequenceNumber(form.sequence_number) }}
                  </div>
                </div>
              </div>

              <!-- Status -->
              <button
                type="button"
                @click="openInfoSheet"
                class="flex-shrink-0"
                :disabled="onboarding.show"
              >
                <div
                  :class="[
                    'badge',
                    form.status === 'Completed' ? 'badge-success' : 'badge-warning'
                  ]"
                >
                  {{ form.status || 'In Progress' }}
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Feed Content - Takes space between header and bottom bar -->
    <div 
      class="absolute left-0 right-0 overflow-hidden"
      :style="{ top: `${headerHeight}px`, bottom: `${bottomBarHeight}px` }"
      :class="{ 'pointer-events-none opacity-50': onboarding.show }"
    >
      <div class="h-full w-full overflow-y-auto px-4 py-4" style="overscroll-behavior: contain; -webkit-overflow-scrolling: touch;">
        <!-- Feed Entries (WhatsApp-style) -->
        <div ref="feedContainer" class="space-y-4">
          <FeedEntry
            v-for="entry in filteredFeedItems"
            :key="entry.id"
            :entry="entry"
            :category-name="entry.category ? getCategoryName(entry.category) : ''"
            :photo="entry.type === 'photo' ? getPhotoById(entry.photo_id) : null"
            :photo-url="entry.type === 'photo' && getPhotoById(entry.photo_id) ? getPhotoUrlSync(getPhotoById(entry.photo_id)) : ''"
            @edit="openEditFeedItem(entry)"
            @delete="deleteEntry(entry)"
            @show-menu="showEntryMenu($event, entry)"
            @view-photo="openPhotoViewer(entry.photo_id)"
            @image-error="handleImageError($event, getPhotoById(entry.photo_id))"
            @touch-start="handleEntryTouchStart(entry)"
            @touch-end="handleEntryTouchEnd"
          />

          <div v-if="filteredFeedItems.length === 0" class="text-center py-8 text-base-content/70">
            No items yet. Add checks, text, photos, or audio below.
          </div>
        </div>
      </div>
    </div>

    <!-- Info Edit Bottom Sheet -->
    <InfoEditSheet
      v-model="infoSheet.show"
      :form="form"
      :filtered-suggestions="filteredBaseTitleSuggestions"
      :show-suggestions="showBaseTitleSuggestions"
      @update:form="handleFormUpdate"
      @show-suggestions="showBaseTitleSuggestions = $event"
      @hide-suggestions="handleBaseTitleInputBlur"
      @select-title="selectBaseTitle"
      @save="saveInfoSheet"
    />

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
      :is-new-image="imageEditor.isNewImage"
      :available-categories="availableCategories"
      :selected-category-id="imageEditor.selectedCategoryId"
      @update:selected-category-id="imageEditor.selectedCategoryId = $event"
      @save="handleImageSave"
      @add-to-feed="handleImageAddToFeed"
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

    <!-- Bottom Menu Bar -->
    <div 
      class="fixed bottom-0 left-0 right-0 z-40 safe-area-bottom bg-base-100 border-t border-base-300" 
      ref="bottomBarRef"
      :class="{ 'pointer-events-none opacity-50': onboarding.show }"
    >
      <div class="max-w-md mx-auto px-4 py-3">
        <div class="flex items-center justify-around gap-2">
          <!-- Text Button -->
          <button
            type="button"
            @click="openFeedSheet('text')"
            class="btn btn-ghost btn-circle"
            title="Add Text"
            :disabled="onboarding.show"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>

          <!-- Image Button -->
          <button
            type="button"
            @click="openImagePicker"
            class="btn btn-ghost btn-circle"
            title="Add Image"
            :disabled="onboarding.show"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>

          <!-- Audio Button -->
          <button
            type="button"
            @click="openFeedSheet('audio')"
            class="btn btn-ghost btn-circle"
            title="Add Audio"
            :disabled="onboarding.show"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>

          <!-- Finaliser Button -->
          <button
            type="button"
            @click="openFinalizationForm"
            class="btn btn-ghost btn-circle"
            title="Finaliser"
            :disabled="onboarding.show"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </button>

        </div>
      </div>
    </div>

    <!-- Feed Item Bottom Sheet -->
    <FeedItemSheet
      v-if="feedSheet.show && feedSheet.type"
      v-model="feedSheet.show"
      :mode="feedSheet.mode || 'add'"
      :type="feedSheet.type"
      :available-categories="availableCategories"
      :selected-category-id="feedSheetCategoryId"
      :text-input="feedSheetTextInput"
      :compliance="feedSheetCompliance"
      :image-preview="feedSheetImagePreview"
      :audio-transcription="feedSheetAudioTranscription"
      :is-transcribing="isTranscribingAudio"
      :intervention-id="currentInterventionId"
      @update:selected-category-id="selectCategoryForSheet"
      @update:text-input="feedSheetTextInput = $event"
      @update:compliance="feedSheetCompliance = $event"
      @transcription="handleFeedSheetAudioTranscription"
      @recording-stopped="handleFeedSheetRecordingStopped"
      @save="saveFeedSheet"
    />

    <!-- Finalization Form -->
    <FinalizationForm
      v-model="finalizationForm.show"
      :observations="form.observations"
      :conclusion="form.conclusion"
      :generating-pdf="generatingPDF"
      :finalizing="finalizing"
      @update:observations="form.observations = $event"
      @update:conclusion="form.conclusion = $event"
      @generate-pdf="handleGeneratePDF"
      @finalize="handleFinalize"
    />

    <!-- Onboarding Modal - Set Name for New Intervention -->
    <Teleport to="body">
      <div
        v-if="onboarding.show"
        class="fixed inset-0 z-[100] flex items-center justify-center"
        style="z-index: 100000 !important;"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50" @click.stop></div>
        
        <!-- Modal Content -->
        <div class="relative bg-base-100 rounded-2xl w-full max-w-md mx-4 shadow-2xl" @click.stop>
          <div class="p-6">
            <h2 class="text-2xl font-bold mb-2">New Intervention</h2>
            <p class="text-base-content/70 mb-6">
              Please enter the client or site name to get started.
            </p>
            
            <div class="form-control mb-6">
              <label class="label">
                <span class="label-text font-semibold">Client/Site Name</span>
              </label>
              <div class="relative" @click.stop>
                <input
                  type="text"
                  v-model="onboardingNameInput"
                  @input="handleOnboardingNameInput"
                  @focus="onboardingShowSuggestions = true"
                  @blur="handleOnboardingNameBlur"
                  @keydown.enter="handleOnboardingSubmit"
                  placeholder="Enter client or site name"
                  class="input input-bordered w-full"
                  autofocus
                />
                <!-- Suggestions Dropdown -->
                <div
                  v-if="onboardingShowSuggestions && onboardingFilteredSuggestions.length > 0"
                  class="absolute z-10 w-full mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                >
                  <button
                    v-for="title in onboardingFilteredSuggestions"
                    :key="title"
                    type="button"
                    @click="selectOnboardingTitle(title)"
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
            
            <div class="flex gap-3">
              <button
                @click="handleOnboardingSubmit"
                class="btn btn-success flex-1"
                :disabled="!onboardingNameInput.trim()"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Hidden Image Input -->
    <input
      type="file"
      ref="feedPhotoInput"
      @change="handleImagePickerSelect"
      accept="image/*"
      capture="environment"
      class="hidden"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { db } from '../db/indexeddb'
import { generateUUID } from '../utils/uuid'
import { syncInterventionToCloud, uploadPhotoToCloud, syncPhotoToCloud, deletePhotoFromCloud } from '../services/supabase'
import { generatePDF } from '../services/pdf'
import { compressImage } from '../utils/imageCompression'
import { blobToDataURL, toFile } from '../utils/blobUtils'
import ImageEditor from '../components/ImageEditor.vue'
import ImageViewer from '../components/ImageViewer.vue'
import AudioDictation from '../components/AudioDictation.vue'
import SyncIndicator from '../components/SyncIndicator.vue'
import InfoEditSheet from '../components/InfoEditSheet.vue'
import FeedItemSheet from '../components/FeedItemSheet.vue'
import FeedEntry from '../components/FeedEntry.vue'
import FinalizationForm from '../components/FinalizationForm.vue'
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
// Info Sheet State
const infoSheet = ref({
  show: false
})
const audioDictationRef = ref(null)
const headerRef = ref(null)
const bottomBarRef = ref(null)
const headerHeight = ref(64) // Default height in pixels (16 * 4 = 64px for pt-16)
const bottomBarHeight = ref(80) // Default height in pixels (20 * 4 = 80px for pb-20)

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
  sequence_number: null, // Auto-generated when saving
  observations: '',
  conclusion: ''
})

const photos = ref([])
// Cache for Blob to data URL conversions (for display)
const photoUrlCache = ref(new Map())

// Base title autocomplete state
const baseTitleSuggestions = ref([])
const filteredBaseTitleSuggestions = ref([])
const showBaseTitleSuggestions = ref(false)

// Unified feed state (replaces checklistItems and feedEntries)
const feedItems = ref([]) // Unified feed items (text, photo, audio, check)
const feedContainer = ref(null) // Ref for feed container (for auto-scroll)
const feedFilter = ref('all') // 'all' | 'check' | 'note' | 'photo'

// Feed Sheet State
const feedSheet = ref({
  show: false,
  type: null, // 'text', 'photo', 'audio'
  mode: 'add' // 'add' | 'edit'
})
const feedSheetTextInput = ref('')
const feedSheetCategoryId = ref(null)
const feedSheetCompliance = ref('na') // 'compliant', 'not_compliant', 'na'
const feedSheetImageFile = ref(null)
const feedSheetImagePreview = ref(null)
const feedSheetAudioTranscription = ref('')
const isTranscribingAudio = ref(false)
const feedPhotoInput = ref(null)

// Feed item edit state
const editingFeedItemId = ref(null)

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

// Finalization form state
const finalizationForm = ref({
  show: false
})
const generatingPDF = ref(false)
const finalizing = ref(false)

// Onboarding state (for new interventions)
const onboarding = ref({
  show: false
})
const onboardingNameInput = ref('')
const onboardingShowSuggestions = ref(false)
const onboardingFilteredSuggestions = ref([])

// Computed: Filtered feed items
const filteredFeedItems = computed(() => {
  if (feedFilter.value === 'all') return feedItems.value
  if (feedFilter.value === 'note') return feedItems.value.filter(item => item.type === 'text' || item.type === 'audio')
  if (feedFilter.value === 'photo') return feedItems.value.filter(item => item.type === 'photo')
  return feedItems.value
})

// Image Editor State
const imageEditor = ref({
  show: false,
  photo: null,
  isNewImage: false, // true if this is a new image from feed sheet
  selectedCategoryId: null
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
          status: intervention.status || 'In Progress',
          sequence_number: intervention.sequence_number || null,
          observations: intervention.observations || '',
          conclusion: intervention.conclusion || ''
        }

        // Load photos (still separate table)
        const loadedPhotos = await db.photos
          .where('intervention_id').equals(route.params.id)
          .toArray()
        
        // Convert old base64 strings to Blobs for backward compatibility
        photos.value = await Promise.all(loadedPhotos.map(async (photo) => {
          // If url_local is a base64 string, convert to Blob
          if (photo.url_local && typeof photo.url_local === 'string' && photo.url_local.startsWith('data:')) {
            const response = await fetch(photo.url_local)
            const blob = await response.blob()
            // Compress the converted image
            const file = new File([blob], photo.file_name || 'photo.jpg', { type: photo.file_type || 'image/jpeg' })
            const compressedFile = await compressImage(file, {
              maxSizeMB: 1,
              maxWidthOrHeight: 1920,
              initialQuality: 0.8
            })
            const compressedBlob = new Blob([compressedFile], { type: compressedFile.type || 'image/jpeg' })
            
            // Update photo with Blob
            photo.url_local = compressedBlob
            photo.file_size = compressedFile.size
            photo.file_type = compressedFile.type || 'image/jpeg'
            
            // Save updated photo back to IndexedDB
            await db.photos.put(photo)
          }
          
          // Pre-populate cache for display
          if (photo.url_local instanceof Blob) {
            const dataURL = await blobToDataURL(photo.url_local)
            photoUrlCache.value.set(photo.id, dataURL)
          } else if (typeof photo.url_local === 'string') {
            photoUrlCache.value.set(photo.id, photo.url_local)
          }
          
          return photo
        }))

        // Load unified feed items from feed_items column (with backward compatibility)
        let allFeedItems = []
        
        // Try feed_items first (new unified structure)
        if (Array.isArray(intervention.feed_items) && intervention.feed_items.length > 0) {
          allFeedItems = intervention.feed_items.map(item => ({
            id: item.id || generateUUID(),
            type: item.type || 'text',
            text: item.text || item.label || '', // Support both 'text' and 'label' (for migrated checks)
            photo_id: item.photo_id || null,
            compliance: item.compliance || 'na',
            transcription: item.transcription || null,
            pending_audio_id: item.pending_audio_id || null,
            category: item.category || null,
            created_at: item.created_at || new Date().toISOString(),
            status: item.status || 'completed'
          }))
        } else {
          // Backward compatibility: migrate from checklist_items and comments
          // Migrate checklist_items to feed_items (type: 'text' with compliance)
          if (Array.isArray(intervention.checklist_items) && intervention.checklist_items.length > 0) {
            const checkItems = intervention.checklist_items.map(item => ({
              id: item.id || generateUUID(),
              type: 'text',
              text: item.label || '',
              compliance: item.checked === true ? 'compliant' : (item.checked === false ? 'not_compliant' : (item.compliance || 'na')),
              category: item.category || null,
              created_at: item.created_at || new Date().toISOString(),
              status: 'completed'
            }))
            allFeedItems.push(...checkItems)
          }
          
          // Migrate comments to feed_items (type: 'text', 'photo', 'audio')
          if (Array.isArray(intervention.comments) && intervention.comments.length > 0) {
            const commentItems = intervention.comments
              .filter(entry => entry.type || !entry.type) // Include all (old and new format)
              .map(entry => {
                // Determine type
                let type = entry.type || 'text'
                if (entry.photo_id) type = 'photo'
                if (entry.transcription || entry.pending_audio_id) type = 'audio'
                
                // For photo entries, check if photo has url_cloud to determine status
                let status = entry.status || 'completed'
                if (type === 'photo' && entry.photo_id) {
                  const photo = photos.value.find(p => p.id === entry.photo_id)
                  if (photo && !photo.url_cloud) {
                    status = 'pending'
                  }
                }
                
                return {
                  id: entry.id || generateUUID(),
                  type: type,
                  text: entry.text || '',
                  photo_id: entry.photo_id || null,
                  transcription: entry.transcription || null,
                  pending_audio_id: entry.pending_audio_id || null,
                  category: entry.category || null,
                  created_at: entry.created_at || new Date().toISOString(),
                  status: status
                }
              })
            allFeedItems.push(...commentItems)
          }
        }
        
        // Sort by created_at
        feedItems.value = allFeedItems.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        
        // Check for pending audio (for status display)
        const pendingAudios = await db.pending_audio
          .where('intervention_id')
          .equals(route.params.id)
          .toArray()
        
        // Update feed items with pending audio status
        for (const item of feedItems.value) {
          if (item.type === 'audio' && item.pending_audio_id) {
            const pendingAudio = pendingAudios.find(pa => pa.id === item.pending_audio_id)
            if (pendingAudio && !item.transcription) {
              item.status = 'pending'
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
  
  // Load base title suggestions (needed for both edit and new interventions)
  await loadBaseTitleSuggestions()
  
  // Show onboarding for new interventions if name is not set
  if (!route.params.id && (!form.value.client_name || !form.value.client_name.trim())) {
    onboarding.value.show = true
    onboardingNameInput.value = ''
    // Initialize filtered suggestions with all suggestions
    onboardingFilteredSuggestions.value = baseTitleSuggestions.value
  }
  
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
    const entry = feedItems.value.find(e => 
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
    // Find the feed item matching the pending audio ID
    let entry = feedItems.value.find(e => 
      e.type === 'audio' && 
      e.pending_audio_id === pendingAudioId
    )
    
    // If not found by pending_audio_id, find most recent pending entry
    if (!entry) {
      entry = feedItems.value
        .filter(e => e.type === 'audio' && e.status === 'pending' && !e.transcription)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
    }
    
    if (entry) {
      // Update existing item with transcription
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
      // Create new item if none found (shouldn't happen, but fallback)
      const newEntry = {
        id: generateUUID(),
        type: 'audio',
        transcription: transcription,
        pending_audio_id: null,
        created_at: new Date().toISOString(),
        status: 'completed'
      }
      feedItems.value.push(newEntry)
      
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

function handleFormUpdate(updatedForm) {
  form.value = updatedForm
  filterBaseTitleSuggestions()
}


// Old checklist functions removed - now using unified feedItems (addCheckItem function)

async function handlePhotoUpload(event) {
  const file = event.target.files[0]
  if (!file) return

  const photoId = generateUUID()
  
  try {
    // Compress image before storing
    const compressedFile = await compressImage(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      initialQuality: 0.8
    })
    
    // Convert compressed file to Blob for storage
    const blob = new Blob([compressedFile], { type: compressedFile.type || 'image/jpeg' })
    
    const photo = {
      id: photoId,
      intervention_id: route.params.id || null,
      url_local: blob, // Blob stored in IndexedDB (more efficient than base64)
      url_cloud: null,
      description: '',
      taken_at: new Date().toISOString(),
      file_name: compressedFile.name || file.name,
      file_type: compressedFile.type || 'image/jpeg',
      file_size: compressedFile.size
    }
    
    // Save to IndexedDB immediately
    await db.photos.put(photo)
    photos.value.push(photo)
  } catch (error) {
    console.error('Error processing photo:', error)
  }
  
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
  imageEditor.value.isNewImage = false // Editing existing photo
  imageEditor.value.selectedCategoryId = null
  imageEditor.value.show = true
}

// Image Viewer Functions
function openImageViewer(index) {
  imageViewer.value.index = index
  imageViewer.value.show = true
}

async function getPhotoUrl(photo) {
  if (!photo) return ''
  
  // Try cloud URL first (if available)
  if (photo.url_cloud) {
    return photo.url_cloud
  }
  
  // Try local Blob/data URL
  if (photo.url_local) {
    // Check cache first
    if (photoUrlCache.value.has(photo.id)) {
      return photoUrlCache.value.get(photo.id)
    }
    
    // If it's a Blob, convert to data URL and cache it
    if (photo.url_local instanceof Blob) {
      const dataURL = await blobToDataURL(photo.url_local)
      photoUrlCache.value.set(photo.id, dataURL)
      return dataURL
    }
    
    // If it's already a data URL string (backward compatibility), cache and return it
    if (typeof photo.url_local === 'string') {
      photoUrlCache.value.set(photo.id, photo.url_local)
      return photo.url_local
    }
  }
  
  return ''
}

// Synchronous version for template use (uses cache)
function getPhotoUrlSync(photo) {
  if (!photo) return ''
  
  // Try cloud URL first
  if (photo.url_cloud) {
    return photo.url_cloud
  }
  
  // Try cache
  if (photoUrlCache.value.has(photo.id)) {
    return photoUrlCache.value.get(photo.id)
  }
  
  // If it's already a string (backward compatibility), return it
  if (typeof photo.url_local === 'string') {
    return photo.url_local
  }
  
  // If it's a Blob, trigger async conversion (will update cache)
  if (photo.url_local instanceof Blob) {
    blobToDataURL(photo.url_local).then(dataURL => {
      photoUrlCache.value.set(photo.id, dataURL)
    })
    return '' // Return empty initially, will update when conversion completes
  }
  
  return ''
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

async function handleImageSave(dataURL) {
  if (!imageEditor.value.photo) return
  
  try {
    // Convert data URL to File, compress, then store as Blob
    const response = await fetch(dataURL)
    const blob = await response.blob()
    const file = new File([blob], 'edited-image.png', { type: 'image/png' })
    
    // Compress image before storing
    const compressedFile = await compressImage(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      initialQuality: 0.8
    })
    
    // Convert compressed file to Blob for storage
    const compressedBlob = new Blob([compressedFile], { type: compressedFile.type || 'image/jpeg' })
    
    // This is editing an existing photo (not a new image)
    const photoIndex = photos.value.findIndex(p => p.id === imageEditor.value.photo.id)
    if (photoIndex > -1) {
      photos.value[photoIndex].url_local = compressedBlob
      photos.value[photoIndex].file_size = compressedFile.size
      photos.value[photoIndex].file_type = compressedFile.type || 'image/jpeg'
      // Reset cloud URL since image has been edited
      photos.value[photoIndex].url_cloud = null
      // Clear cache for this photo
      photoUrlCache.value.delete(photos.value[photoIndex].id)
      
      // Update in IndexedDB
      await db.photos.put(photos.value[photoIndex])
    }
    
    // Reset editor state
    imageEditor.value.isNewImage = false
    imageEditor.value.selectedCategoryId = null
  } catch (error) {
    console.error('Error saving edited image:', error)
  }
}

async function handleImageAddToFeed({ dataURL, categoryId }) {
  if (!dataURL || !categoryId) return
  
  try {
    // Convert dataURL to File
    const response = await fetch(dataURL)
    const blob = await response.blob()
    const file = new File([blob], 'edited-image.png', { type: 'image/png' })
    
    // Upload photo and add to feed (will compress and store as Blob)
    // Use default compliance 'na' when adding directly from editor
    await handleFeedPhotoUploadFromSheet(file, categoryId, 'na')
    
    // Reset editor state
    imageEditor.value.isNewImage = false
    imageEditor.value.selectedCategoryId = null
    feedSheetImageFile.value = null
    feedSheetImagePreview.value = null
  } catch (error) {
    console.error('Error adding image to feed:', error)
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

function addFeedItem(type) {
  if (type === 'text' && !feedTextInput.value.trim()) return
  
  // Get category (use selected or default)
  const trade = getSelectedTrade() || TRADES.GENERAL
  const categoryId = selectedCategoryId.value || getLastUsedCategory(trade) || getDefaultCategory(trade)
  
  const item = {
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
  
  feedItems.value.push(item)
  feedTextInput.value = ''
  
  // Scroll to bottom after adding item
  scrollFeedToBottom()
  
  // Trigger auto-save
  if (initialLoadComplete.value) {
    autoSave()
  }
}

function removeFeedItem(itemId) {
  const index = feedItems.value.findIndex(item => item.id === itemId)
  if (index > -1) {
    feedItems.value.splice(index, 1)
    if (initialLoadComplete.value) {
      autoSave()
    }
  }
}

async function handleFeedPhotoUpload(event) {
  const file = event.target.files[0]
  if (!file) return

  const photoId = generateUUID()
  
  try {
    // Compress image before storing
    const compressedFile = await compressImage(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      initialQuality: 0.8
    })
    
    // Convert compressed file to Blob for storage
    const blob = new Blob([compressedFile], { type: compressedFile.type || 'image/jpeg' })
    
    // Create photo object with Blob local storage (offline-first)
    const photo = {
      id: photoId,
      intervention_id: currentInterventionId.value,
      url_local: blob, // Blob stored in IndexedDB (more efficient than base64)
      url_cloud: null, // Will be set during sync
      description: '',
      taken_at: new Date().toISOString(),
      file_name: compressedFile.name || file.name,
      file_type: compressedFile.type || 'image/jpeg',
      file_size: compressedFile.size
    }
    
    // Save to IndexedDB immediately (offline-first)
    await db.photos.put(photo)
    photos.value.push(photo)
    
    // Get category for photo entry
    const trade = getSelectedTrade() || TRADES.GENERAL
    const categoryId = selectedCategoryId.value || getLastUsedCategory(trade) || getDefaultCategory(trade)
    
    // Create feed item for photo
    const item = {
      id: generateUUID(),
      type: 'photo',
      photo_id: photoId,
      category: categoryId,
      created_at: new Date().toISOString(),
      status: navigator.onLine ? 'pending' : 'pending' // Will be uploaded during sync
    }
    
    feedItems.value.push(item)
    
    // Scroll to bottom after adding photo entry
    scrollFeedToBottom()
    
    // Trigger auto-save after adding photo entry
    if (initialLoadComplete.value) {
      autoSave()
    }
    
    // Note: Photo upload to Supabase Storage happens during sync, not immediately
    // This ensures offline-first behavior - photos are always saved locally first
  } catch (error) {
    console.error('Error processing photo:', error)
  }
  
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
  
  feedItems.value.push(entry)
  
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
  const pendingAudioEntries = feedItems.value
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
    
    feedItems.value.push(entry)
    
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
  
  feedItems.value.push(duplicated)
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
  
  const index = feedItems.value.findIndex(e => e.id === entry.id)
  if (index > -1) {
    feedItems.value.splice(index, 1)
    
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

// Old addComment function removed - now using unified feedItems (addFeedItem function)


function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

function formatDateForDisplay(dateString) {
  if (!dateString) return 'Tap to set'
  const date = new Date(dateString)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = String(date.getFullYear()).slice(-2)
  return `${day}/${month}/${year}`
}

// Info Sheet Functions
function openInfoSheet() {
  infoSheet.value.show = true
}

function closeInfoSheet() {
  infoSheet.value.show = false
}

function saveInfoSheet() {
  // Trigger auto-save
  if (initialLoadComplete.value) {
    autoSave()
  }
  closeInfoSheet()
}

// Feed Sheet Functions
function openFeedSheet(type) {
  const trade = getSelectedTrade() || TRADES.GENERAL
  feedSheetCategoryId.value = selectedCategoryId.value || getLastUsedCategory(trade) || getDefaultCategory(trade)
  
  feedSheet.value = {
    show: true,
    type: type,
    mode: 'add'
  }
  editingFeedItemId.value = null
  
  feedSheetTextInput.value = ''
  feedSheetCompliance.value = 'na'
  feedSheetImageFile.value = null
  feedSheetImagePreview.value = null
  feedSheetAudioTranscription.value = ''
}

function closeFeedSheet() {
  feedSheet.value = {
    show: false,
    type: null,
    mode: 'add'
  }
  editingFeedItemId.value = null
  feedSheetTextInput.value = ''
  feedSheetCompliance.value = 'na'
  feedSheetImageFile.value = null
  feedSheetImagePreview.value = null
  feedSheetAudioTranscription.value = ''
}

function selectCategoryForSheet(categoryId) {
  feedSheetCategoryId.value = categoryId
  const trade = getSelectedTrade() || TRADES.GENERAL
  saveLastUsedCategory(trade, categoryId)
  selectedCategoryId.value = categoryId
}

function openFinalizationForm() {
  finalizationForm.value.show = true
}

function handleOnboardingNameInput() {
  // Filter suggestions based on input
  const query = onboardingNameInput.value.trim().toLowerCase()
  if (!query) {
    onboardingFilteredSuggestions.value = baseTitleSuggestions.value
  } else {
    onboardingFilteredSuggestions.value = baseTitleSuggestions.value.filter(title =>
      title.toLowerCase().includes(query)
    )
  }
}

function handleOnboardingNameBlur() {
  // Delay hiding suggestions to allow clicking on them
  setTimeout(() => {
    onboardingShowSuggestions.value = false
  }, 200)
}

function selectOnboardingTitle(title) {
  onboardingNameInput.value = title
  onboardingShowSuggestions.value = false
  // Auto-submit when selecting from suggestions
  handleOnboardingSubmit()
}

function handleOnboardingSubmit() {
  if (!onboardingNameInput.value.trim()) {
    return
  }
  
  // Set the client name
  form.value.client_name = onboardingNameInput.value.trim()
  
  // Close onboarding
  onboarding.value.show = false
  onboardingShowSuggestions.value = false
  
  // Trigger auto-save to create the intervention
  if (!tempInterventionId.value) {
    tempInterventionId.value = generateUUID()
  }
  autoSave()
}

async function handleFinalize() {
  finalizing.value = true
  try {
    // Update status to Completed
    form.value.status = 'Completed'
    
    // Save intervention with updated status and observations/conclusion
    await saveInterventionLocal()
    
    // Close the form
    finalizationForm.value.show = false
    
    // Show success message or navigate
    // Optionally trigger sync
    if (initialLoadComplete.value) {
      autoSave()
    }
  } catch (error) {
    console.error('Error finalizing intervention:', error)
    alert('Erreur lors de la finalisation. Veuillez réessayer.')
  } finally {
    finalizing.value = false
  }
}

async function handleGeneratePDF() {
  generatingPDF.value = true
  try {
    // Ensure we have the latest data
    await saveInterventionLocal()
    
    // Get current intervention data
    const interventionId = loadedInterventionId.value || route.params.id || tempInterventionId.value
    if (!interventionId) {
      alert('Impossible de générer le PDF: intervention non trouvée.')
      return
    }
    
    const intervention = await db.interventions.get(interventionId)
    if (!intervention) {
      alert('Impossible de générer le PDF: intervention non trouvée.')
      return
    }
    
    // Load photos
    const photosForPdf = await db.photos
      .where('intervention_id').equals(interventionId)
      .toArray()
    
    // Generate PDF
    const doc = await generatePDF(intervention, feedItems.value, photosForPdf)
    
    // Download PDF
    const filename = `intervention_${intervention.client_name || 'unnamed'}_${new Date(intervention.date).toISOString().split('T')[0]}.pdf`
    doc.save(filename)
  } catch (error) {
    console.error('Error generating PDF:', error)
    alert('Erreur lors de la génération du PDF. Veuillez réessayer.')
  } finally {
    generatingPDF.value = false
  }
}


async function saveFeedSheet() {
  if (feedSheet.value.type === 'text' && !feedSheetTextInput.value.trim()) return
  if (feedSheet.value.type === 'audio' && !feedSheetAudioTranscription.value) return
  // In edit mode, photo may not have a new file selected
  if (feedSheet.value.type === 'photo' && feedSheet.value.mode !== 'edit' && !feedSheetImageFile.value) return
  
  const categoryId = feedSheetCategoryId.value
  const compliance = feedSheetCompliance.value

  // Edit existing item
  if (feedSheet.value.mode === 'edit' && editingFeedItemId.value) {
    const idx = feedItems.value.findIndex(i => i.id === editingFeedItemId.value)
    if (idx !== -1) {
      const existing = feedItems.value[idx]
      const updated = {
        ...existing,
        category: categoryId,
        compliance: compliance
      }
      if (existing.type === 'text') {
        updated.text = feedSheetTextInput.value.trim()
      } else if (existing.type === 'audio') {
        updated.transcription = feedSheetAudioTranscription.value
      }
      // photo: keep photo_id, just update category/compliance
      feedItems.value.splice(idx, 1, updated)
    }
    closeFeedSheet()
    if (initialLoadComplete.value) {
      autoSave()
    }
    return
  }
  
  if (feedSheet.value.type === 'text') {
    const item = {
      id: generateUUID(),
      type: 'text',
      text: feedSheetTextInput.value.trim(),
      compliance: compliance,
      category: categoryId,
      created_at: new Date().toISOString(),
      status: 'completed'
    }
    feedItems.value.push(item)
  } else if (feedSheet.value.type === 'photo' && feedSheetImageFile.value) {
    // Handle photo upload with compliance
    await handleFeedPhotoUploadFromSheet(feedSheetImageFile.value, categoryId, compliance)
  } else if (feedSheet.value.type === 'audio' && feedSheetAudioTranscription.value) {
    const item = {
      id: generateUUID(),
      type: 'audio',
      transcription: feedSheetAudioTranscription.value,
      compliance: compliance,
      pending_audio_id: null,
      category: categoryId,
      created_at: new Date().toISOString(),
      status: 'completed'
    }
    feedItems.value.push(item)
  }
  
  closeFeedSheet()
  scrollFeedToBottom()
  
  if (initialLoadComplete.value) {
    autoSave()
  }
}

function openImagePicker() {
  if (feedPhotoInput.value) {
    feedPhotoInput.value.click()
  }
}

async function openEditFeedItem(entry) {
  if (!entry) return
  // Don't open editor while onboarding is active
  if (onboarding.value?.show) return

  editingFeedItemId.value = entry.id
  feedSheet.value.mode = 'edit'
  feedSheet.value.type = entry.type
  feedSheet.value.show = true

  feedSheetCategoryId.value = entry.category || null
  feedSheetCompliance.value = entry.compliance || 'na'

  // Prefill type-specific fields
  if (entry.type === 'text') {
    feedSheetTextInput.value = entry.text || ''
  } else if (entry.type === 'audio') {
    feedSheetAudioTranscription.value = entry.transcription || ''
    isTranscribingAudio.value = false
  } else if (entry.type === 'photo') {
    // No new file in edit mode; show preview of existing photo
    feedSheetImageFile.value = null
    const photo = getPhotoById(entry.photo_id)
    feedSheetImagePreview.value = photo ? await getPhotoUrl(photo) : null
  }
}

async function handleImagePickerSelect(event) {
  const file = event.target.files[0]
  if (!file) return
  
  // Read file and open image editor
  const reader = new FileReader()
  reader.onload = (e) => {
    feedSheetImagePreview.value = e.target.result
    feedSheetImageFile.value = file
    
    // Get default category
    const trade = getSelectedTrade() || TRADES.GENERAL
    const defaultCategoryId = selectedCategoryId.value || getLastUsedCategory(trade) || getDefaultCategory(trade)
    
    // Open image editor with category selector
    imageEditor.value.photo = {
      id: generateUUID(),
      url_local: e.target.result,
      url_cloud: null
    }
    imageEditor.value.isNewImage = true
    imageEditor.value.selectedCategoryId = defaultCategoryId
    imageEditor.value.show = true
  }
  reader.readAsDataURL(file)
  
  // Reset input
  if (event.target) {
    event.target.value = ''
  }
}

async function handleFeedPhotoUploadFromSheet(photoFile, categoryId, compliance = 'na') {
  if (!photoFile) return

  const photoId = generateUUID()
  
  try {
    let fileToProcess = photoFile
    
    // If it's a data URL (from editor), convert to File first
    if (feedSheetImagePreview.value && typeof feedSheetImagePreview.value === 'string' && feedSheetImagePreview.value.startsWith('data:')) {
      const response = await fetch(feedSheetImagePreview.value)
      const blob = await response.blob()
      fileToProcess = new File([blob], 'edited-image.png', { type: 'image/png' })
    }
    
    // Compress image before storing
    const compressedFile = await compressImage(fileToProcess, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      initialQuality: 0.8
    })
    
    // Convert compressed file to Blob for storage
    const blob = new Blob([compressedFile], { type: compressedFile.type || 'image/jpeg' })
    
    // Create photo object with Blob local storage (offline-first)
    const photo = {
      id: photoId,
      intervention_id: currentInterventionId.value,
      url_local: blob, // Blob stored in IndexedDB (more efficient than base64)
      url_cloud: null, // Will be set during sync
      description: '',
      taken_at: new Date().toISOString(),
      file_name: compressedFile.name || photoFile.name || 'edited-image.png',
      file_type: compressedFile.type || 'image/jpeg',
      file_size: compressedFile.size
    }
    
    // Save to IndexedDB immediately (offline-first)
    await db.photos.put(photo)
    photos.value.push(photo)
    
    // Create feed item for photo
    const item = {
      id: generateUUID(),
      type: 'photo',
      photo_id: photoId,
      compliance: compliance,
      category: categoryId,
      created_at: new Date().toISOString(),
      status: navigator.onLine ? 'pending' : 'pending' // Will be uploaded during sync
    }
    
    feedItems.value.push(item)
    
    // Scroll to bottom after adding photo entry
    scrollFeedToBottom()
    
    // Trigger auto-save after adding photo entry
    if (initialLoadComplete.value) {
      autoSave()
    }
  } catch (error) {
    console.error('Error processing photo:', error)
  }
}

function handleFeedSheetAudioTranscription(transcription) {
  feedSheetAudioTranscription.value = transcription
  isTranscribingAudio.value = false
}

async function handleFeedSheetRecordingStopped(audioBlob) {
  // Reset transcription state
  feedSheetAudioTranscription.value = ''
  isTranscribingAudio.value = false
  
  // If online, transcription will happen automatically via AudioDictation component
  // (transcribeImmediately prop is true)
  if (navigator.onLine) {
    isTranscribingAudio.value = true
  }
  // If offline, transcription will happen later when online
  // The send button will remain disabled until transcription is available
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
    
    // Prepare unified feed items as JSONB array
    // Deep clone to avoid Vue reactivity issues with IndexedDB
    const feedItemsData = JSON.parse(JSON.stringify(
      feedItems.value.map(item => ({
        id: item.id || generateUUID(),
        type: item.type || 'text',
        text: item.text || '',
        photo_id: item.photo_id || undefined,
        compliance: item.compliance || 'na',
        transcription: item.transcription || undefined,
        pending_audio_id: item.pending_audio_id || undefined,
        category: item.category || null,
        created_at: item.created_at || new Date().toISOString(),
        status: item.status || 'completed'
      }))
    ))
    
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
      observations: form.value.observations || '',
      conclusion: form.value.conclusion || '',
      // Preserve created_at if editing, otherwise use now
      created_at: existingIntervention?.created_at || now,
      updated_at: now,
      // Preserve synced status if editing and already synced, otherwise mark as unsynced
      synced: existingIntervention?.synced || false,
      feed_items: feedItemsData
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
    
    // Upload photos to Supabase Storage (offline-first: photos are already saved locally as Blob)
    // Convert Blob to File, then upload (already compressed)
    for (const photo of photos.value) {
      if (photo.url_local && !photo.url_cloud) {
        try {
          // Update feed entry status to "uploading"
          const feedItem = feedItems.value.find(e => e.type === 'photo' && e.photo_id === photo.id)
          if (feedItem) {
            feedItem.status = 'uploading'
            // Don't trigger save here - the watch will handle it, and we don't want to save during upload
          }
          
          // Convert Blob to File object for upload
          let fileToUpload
          if (photo.url_local instanceof Blob) {
            fileToUpload = new File([photo.url_local], photo.file_name || `photo_${photo.id}.jpg`, { 
              type: photo.file_type || 'image/jpeg' 
            })
          } else if (typeof photo.url_local === 'string' && photo.url_local.startsWith('data:')) {
            // Backward compatibility: convert data URL to File
            const response = await fetch(photo.url_local)
            const blob = await response.blob()
            fileToUpload = new File([blob], photo.file_name || `photo_${photo.id}.jpg`, { 
              type: photo.file_type || 'image/jpeg' 
            })
            // Compress if not already compressed
            fileToUpload = await compressImage(fileToUpload, {
              maxSizeMB: 1,
              maxWidthOrHeight: 1920,
              initialQuality: 0.8
            })
          } else {
            throw new Error('Invalid photo.url_local type')
          }
          
          // Upload to Supabase Storage (already compressed)
          const cloudUrl = await uploadPhotoToCloud(fileToUpload, interventionId, photo.id)
          
          // Update photo with cloud URL (keep local Blob)
          photo.url_cloud = cloudUrl
          
          // Update in IndexedDB
          const cleanPhoto = {
            id: photo.id,
            intervention_id: interventionId,
            url_local: photo.url_local, // Keep local Blob
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
          if (feedItem) {
            feedItem.status = 'completed'
            // Don't trigger save here - the watch will handle it after upload completes
          }
        } catch (error) {
          // Log error but don't block the save process
          // The photo will remain with url_cloud = null and can be uploaded later during next sync
          console.warn('Error uploading photo (will retry later):', error.message || error)
          
          // Update feed entry status back to "pending"
          const feedItemError = feedItems.value.find(e => e.type === 'photo' && e.photo_id === photo.id)
          if (feedItemError) {
            feedItemError.status = 'pending'
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
    feedItems.value,
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
    for (const entry of feedItems.value) {
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
  // Prevent body scroll
  document.body.style.overflow = 'hidden'
  document.documentElement.style.overflow = 'hidden'
  
  loadIntervention()
  
  // Measure header and bottom bar heights
  nextTick(() => {
    if (headerRef.value) {
      headerHeight.value = headerRef.value.offsetHeight
    }
    if (bottomBarRef.value) {
      bottomBarHeight.value = bottomBarRef.value.offsetHeight
    }
  })
})

onUnmounted(() => {
  // Restore body scroll
  document.body.style.overflow = ''
  document.documentElement.style.overflow = ''
  
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
