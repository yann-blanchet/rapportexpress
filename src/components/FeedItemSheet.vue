<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 z-50 flex items-end"
    @click.self="$emit('update:modelValue', false)"
  >
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/50" @click="$emit('update:modelValue', false)"></div>
    
    <!-- Sheet Content -->
    <div class="relative w-full bg-base-100 rounded-t-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
      <!-- Handle -->
      <div class="flex justify-center pt-3 pb-2">
        <div class="w-12 h-1 bg-base-300 rounded-full"></div>
      </div>
      
      <!-- Header -->
      <div class="px-6 py-4 border-b border-base-300">
        <h2 class="text-xl font-bold">{{ title }}</h2>
      </div>
      
      <!-- Content -->
      <div class="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        <!-- Category Selection -->
        <div v-if="availableCategories.length > 0">
          <label class="label">
            <span class="label-text font-semibold">Category</span>
          </label>
          <select
            :value="selectedCategoryId"
            @change="$emit('update:selectedCategoryId', $event.target.value)"
            class="select select-bordered w-full"
          >
            <option :value="null">Select a category</option>
            <option
              v-for="category in availableCategories"
              :key="category.id"
              :value="category.id"
            >
              {{ category.name }}
            </option>
          </select>
        </div>

        <!-- Text Input -->
        <div v-if="type === 'text'">
          <label class="label">
            <span class="label-text font-semibold">Text</span>
          </label>
          <textarea
            :value="textInput"
            @input="$emit('update:textInput', $event.target.value)"
            placeholder="Type your message..."
            class="textarea textarea-bordered w-full"
            rows="6"
            ref="textAreaRef"
          ></textarea>
          
          <!-- Compliance Options -->
          <div class="mt-4">
            <label class="label">
              <span class="label-text font-semibold">Compliance</span>
            </label>
            <div class="form-control">
              <label class="label cursor-pointer justify-start gap-3">
                <input
                  type="radio"
                  :value="'compliant'"
                  :checked="compliance === 'compliant'"
                  @change="$emit('update:compliance', 'compliant')"
                  class="radio radio-primary"
                />
                <span class="label-text">Compliant</span>
              </label>
              <label class="label cursor-pointer justify-start gap-3">
                <input
                  type="radio"
                  :value="'not_compliant'"
                  :checked="compliance === 'not_compliant'"
                  @change="$emit('update:compliance', 'not_compliant')"
                  class="radio radio-primary"
                />
                <span class="label-text">Not Compliant</span>
              </label>
              <label class="label cursor-pointer justify-start gap-3">
                <input
                  type="radio"
                  :value="'na'"
                  :checked="compliance === 'na'"
                  @change="$emit('update:compliance', 'na')"
                  class="radio radio-primary"
                />
                <span class="label-text">N/A</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Audio Recording -->
        <div v-if="type === 'audio'">
          <label class="label">
            <span class="label-text font-semibold">Audio Recording</span>
          </label>
          <AudioDictation
            :intervention-id="interventionId"
            :transcribe-immediately="true"
            @transcription="$emit('transcription', $event)"
            @recording-stopped="$emit('recording-stopped', $event)"
            ref="audioDictationRef"
          />
          <!-- Transcription Status -->
          <div v-if="audioTranscription" class="mt-4 p-3 bg-base-200 rounded-lg">
            <p class="text-sm text-base-content/70 mb-1">Transcription:</p>
            <p class="whitespace-pre-wrap text-sm">{{ audioTranscription }}</p>
          </div>
          <div v-else-if="isTranscribing" class="mt-4 p-3 bg-base-200 rounded-lg">
            <div class="flex items-center gap-2">
              <span class="loading loading-spinner loading-sm"></span>
              <p class="text-sm text-base-content/70">Transcribing audio...</p>
            </div>
          </div>
          
          <!-- Compliance Options -->
          <div class="mt-4">
            <label class="label">
              <span class="label-text font-semibold">Compliance</span>
            </label>
            <div class="form-control">
              <label class="label cursor-pointer justify-start gap-3">
                <input
                  type="radio"
                  :value="'compliant'"
                  :checked="compliance === 'compliant'"
                  @change="$emit('update:compliance', 'compliant')"
                  class="radio radio-primary"
                />
                <span class="label-text">Compliant</span>
              </label>
              <label class="label cursor-pointer justify-start gap-3">
                <input
                  type="radio"
                  :value="'not_compliant'"
                  :checked="compliance === 'not_compliant'"
                  @change="$emit('update:compliance', 'not_compliant')"
                  class="radio radio-primary"
                />
                <span class="label-text">Not Compliant</span>
              </label>
              <label class="label cursor-pointer justify-start gap-3">
                <input
                  type="radio"
                  :value="'na'"
                  :checked="compliance === 'na'"
                  @change="$emit('update:compliance', 'na')"
                  class="radio radio-primary"
                />
                <span class="label-text">N/A</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Image Preview (if image was selected) -->
        <div v-if="type === 'photo' && imagePreview">
          <label class="label">
            <span class="label-text font-semibold">Image Preview</span>
          </label>
          <img :src="imagePreview" alt="Preview" class="w-full max-w-md rounded-lg" />
          <p class="text-sm text-base-content/70 mt-2">Image ready to add</p>
          
          <!-- Compliance Options -->
          <div class="mt-4">
            <label class="label">
              <span class="label-text font-semibold">Compliance</span>
            </label>
            <div class="form-control">
              <label class="label cursor-pointer justify-start gap-3">
                <input
                  type="radio"
                  :value="'compliant'"
                  :checked="compliance === 'compliant'"
                  @change="$emit('update:compliance', 'compliant')"
                  class="radio radio-primary"
                />
                <span class="label-text">Compliant</span>
              </label>
              <label class="label cursor-pointer justify-start gap-3">
                <input
                  type="radio"
                  :value="'not_compliant'"
                  :checked="compliance === 'not_compliant'"
                  @change="$emit('update:compliance', 'not_compliant')"
                  class="radio radio-primary"
                />
                <span class="label-text">Not Compliant</span>
              </label>
              <label class="label cursor-pointer justify-start gap-3">
                <input
                  type="radio"
                  :value="'na'"
                  :checked="compliance === 'na'"
                  @change="$emit('update:compliance', 'na')"
                  class="radio radio-primary"
                />
                <span class="label-text">N/A</span>
              </label>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Footer with Cancel and Send -->
      <div class="px-6 py-4 border-t border-base-300 flex gap-3">
        <button
          type="button"
          @click="$emit('update:modelValue', false)"
          class="btn btn-ghost btn-circle"
          title="Cancel"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <button
          type="button"
          @click="$emit('save')"
          class="btn btn-primary flex-1"
          :disabled="isSaveDisabled"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          Add
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import AudioDictation from './AudioDictation.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  type: {
    type: String,
    required: false,
    default: null,
    validator: (value) => value === null || ['text', 'photo', 'audio'].includes(value)
  },
  availableCategories: {
    type: Array,
    default: () => []
  },
  selectedCategoryId: {
    type: String,
    default: null
  },
  textInput: {
    type: String,
    default: ''
  },
  compliance: {
    type: String,
    default: 'na',
    validator: (value) => ['compliant', 'not_compliant', 'na'].includes(value)
  },
  imagePreview: {
    type: String,
    default: null
  },
  audioTranscription: {
    type: String,
    default: ''
  },
  isTranscribing: {
    type: Boolean,
    default: false
  },
  interventionId: {
    type: String,
    required: true
  }
})

const emit = defineEmits([
  'update:modelValue',
  'update:selectedCategoryId',
  'update:textInput',
  'update:compliance',
  'save',
  'transcription',
  'recording-stopped'
])

const textAreaRef = ref(null)
const audioDictationRef = ref(null)

const title = computed(() => {
  if (!props.type) return 'Add Item'
  switch (props.type) {
    case 'text':
      return 'Add Text'
    case 'photo':
      return 'Add Image'
    case 'audio':
      return 'Add Audio'
    default:
      return 'Add Item'
  }
})

const isSaveDisabled = computed(() => {
  if (!props.type) return true
  if (props.type === 'text') {
    return !props.textInput.trim()
  }
  if (props.type === 'audio') {
    return !props.audioTranscription
  }
  if (props.type === 'photo') {
    return !props.imagePreview
  }
  return false
})

// Focus input when sheet opens
watch(() => props.modelValue, (newVal) => {
  if (newVal && props.type) {
    nextTick(() => {
      if (props.type === 'text' && textAreaRef.value) {
        textAreaRef.value.focus()
      }
    })
  }
})
</script>
