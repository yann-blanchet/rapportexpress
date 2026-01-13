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
        <h2 class="text-xl font-bold">Edit Information</h2>
      </div>
      
      <!-- Content -->
      <div class="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        <!-- Client Name Edit -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">Client / Site Name *</span>
          </label>
          <div class="relative" @click.stop>
            <input
              type="text"
              :value="form.client_name"
              @input="handleClientNameInput"
              @focus="$emit('showSuggestions', true)"
              @blur="$emit('hideSuggestions')"
              required
              placeholder="Enter client or site name"
              class="input input-bordered w-full"
              ref="clientNameInputRef"
            />
            <!-- Base Title Suggestions Dropdown -->
            <div
              v-if="showSuggestions && filteredSuggestions.length > 0"
              class="absolute z-10 w-full mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg max-h-48 overflow-y-auto"
            >
              <button
                v-for="title in filteredSuggestions"
                :key="title"
                type="button"
                @click="$emit('selectTitle', title)"
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

        <!-- Date Edit -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">Date & Time *</span>
          </label>
          <input
            type="datetime-local"
            :value="form.date"
            @input="handleDateInput"
            required
            class="input input-bordered w-full"
            ref="dateInputRef"
          />
        </div>

        <!-- Status Edit -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">Status</span>
          </label>
          <div class="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              @click="updateStatus('In Progress')"
              :class="[
                'badge badge-lg cursor-pointer transition-all px-4 py-2',
                form.status === 'In Progress' ? 'badge-warning' : 'badge-outline'
              ]"
            >
              In Progress
            </button>
            <button
              type="button"
              @click="updateStatus('Completed')"
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
      
      <!-- Footer -->
      <div class="px-6 py-4 border-t border-base-300 flex gap-3">
        <button
          type="button"
          @click="$emit('update:modelValue', false)"
          class="btn btn-ghost flex-1"
        >
          Cancel
        </button>
        <button
          type="button"
          @click="$emit('save')"
          class="btn btn-primary flex-1"
        >
          Save
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  form: {
    type: Object,
    required: true,
    default: () => ({
      client_name: '',
      date: '',
      status: 'In Progress'
    })
  },
  filteredSuggestions: {
    type: Array,
    default: () => []
  },
  showSuggestions: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'update:form', 'save', 'showSuggestions', 'hideSuggestions', 'selectTitle'])

const clientNameInputRef = ref(null)
const dateInputRef = ref(null)

function handleClientNameInput(event) {
  const updatedForm = {
    ...props.form,
    client_name: event.target.value
  }
  emit('update:form', updatedForm)
}

function handleDateInput(event) {
  emit('update:form', {
    ...props.form,
    date: event.target.value
  })
}

function updateStatus(status) {
  emit('update:form', {
    ...props.form,
    status
  })
}
</script>
