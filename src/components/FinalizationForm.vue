<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 z-50 flex flex-col bg-base-100"
  >
    <!-- Header with Back Button -->
    <div class="flex items-center gap-3 px-4 py-4 border-b border-base-300 safe-area-top">
      <button
        type="button"
        @click="$emit('update:modelValue', false)"
        class="btn btn-ghost btn-circle btn-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <h2 class="text-xl font-bold flex-1">Finaliser l'intervention</h2>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto px-4 py-6 space-y-6">
      <!-- Observations -->
      <div>
        <label class="label">
          <span class="label-text font-semibold">Observations</span>
        </label>
        <textarea
          :value="observations"
          @input="$emit('update:observations', $event.target.value)"
          placeholder="Ajoutez vos observations..."
          class="textarea textarea-bordered w-full"
          rows="8"
          ref="observationsRef"
        ></textarea>
      </div>

      <!-- Conclusion -->
      <div>
        <label class="label">
          <span class="label-text font-semibold">Conclusion</span>
        </label>
        <textarea
          :value="conclusion"
          @input="$emit('update:conclusion', $event.target.value)"
          placeholder="Ajoutez votre conclusion..."
          class="textarea textarea-bordered w-full"
          rows="8"
          ref="conclusionRef"
        ></textarea>
      </div>
    </div>

    <!-- Footer with Action Buttons -->
    <div class="px-4 py-4 border-t border-base-300 safe-area-bottom space-y-3">
      <!-- Generate PDF Button -->
      <button
        type="button"
        @click="$emit('generate-pdf')"
        class="btn btn-outline w-full"
        :disabled="generatingPDF"
      >
        <span v-if="generatingPDF" class="loading loading-spinner loading-sm mr-2"></span>
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        {{ generatingPDF ? 'Génération...' : 'Générer PDF' }}
      </button>

      <!-- Finalize Button -->
      <button
        type="button"
        @click="$emit('finalize')"
        class="btn btn-primary w-full"
        :disabled="finalizing"
      >
        <span v-if="finalizing" class="loading loading-spinner loading-sm mr-2"></span>
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        {{ finalizing ? 'Finalisation...' : 'Finaliser' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  observations: {
    type: String,
    default: ''
  },
  conclusion: {
    type: String,
    default: ''
  },
  generatingPDF: {
    type: Boolean,
    default: false
  },
  finalizing: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'update:modelValue',
  'update:observations',
  'update:conclusion',
  'generate-pdf',
  'finalize'
])

const observationsRef = ref(null)
const conclusionRef = ref(null)

// Focus observations field when form opens
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    nextTick(() => {
      if (observationsRef.value) {
        observationsRef.value.focus()
      }
    })
  }
})
</script>
