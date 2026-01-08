<template>
  <div
    v-if="modelValue && photos.length > 0"
    class="fixed inset-0 z-[80] bg-black/95 flex items-center justify-center"
    @click="handleBackdropClick"
  >
    <!-- Close Button -->
    <button
      @click="close"
      class="absolute top-4 right-4 z-10 btn btn-circle btn-ghost text-white hover:bg-white/20"
      title="Close (ESC)"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>

    <!-- Image Container -->
    <div class="relative w-full h-full flex items-center justify-center p-4" @click.stop>
      <!-- Previous Arrow -->
      <button
        v-if="photos.length > 1"
        @click="previousImage"
        class="absolute left-4 z-10 btn btn-circle btn-ghost text-white hover:bg-white/20"
        :disabled="currentIndex === 0"
        title="Previous (←)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <!-- Image -->
      <div class="flex flex-col items-center max-w-full max-h-full">
        <img
          :src="currentPhoto.url_local || currentPhoto.url_cloud"
          :alt="currentPhoto.description || 'Intervention photo'"
          class="max-w-full max-h-[85vh] object-contain"
          @click.stop
        />
        <!-- Photo Info -->
        <div v-if="currentPhoto.description" class="mt-4 text-white text-center max-w-2xl px-4">
          <p class="text-lg">{{ currentPhoto.description }}</p>
        </div>
        <!-- Photo Counter -->
        <div v-if="photos.length > 1" class="mt-2 text-white/70 text-sm">
          {{ currentIndex + 1 }} / {{ photos.length }}
        </div>
      </div>

      <!-- Next Arrow -->
      <button
        v-if="photos.length > 1"
        @click="nextImage"
        class="absolute right-4 z-10 btn btn-circle btn-ghost text-white hover:bg-white/20"
        :disabled="currentIndex === photos.length - 1"
        title="Next (→)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  photos: {
    type: Array,
    default: () => []
  },
  initialIndex: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['update:modelValue', 'close'])

const currentIndex = ref(0)

const currentPhoto = computed(() => {
  if (props.photos.length === 0) return null
  return props.photos[currentIndex.value] || props.photos[0]
})

// Watch for initial index changes
watch(() => props.initialIndex, (newIndex) => {
  if (newIndex >= 0 && newIndex < props.photos.length) {
    currentIndex.value = newIndex
  }
}, { immediate: true })

// Watch for modelValue to reset index
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    // Reset to initial index when opening
    const index = props.initialIndex >= 0 && props.initialIndex < props.photos.length 
      ? props.initialIndex 
      : 0
    currentIndex.value = index
  }
})

function nextImage() {
  if (currentIndex.value < props.photos.length - 1) {
    currentIndex.value++
  }
}

function previousImage() {
  if (currentIndex.value > 0) {
    currentIndex.value--
  }
}

function close() {
  emit('update:modelValue', false)
  emit('close')
}

function handleBackdropClick(e) {
  // Close when clicking on backdrop (but not on image or buttons)
  if (e.target === e.currentTarget) {
    close()
  }
}

// Keyboard navigation
function handleKeydown(e) {
  if (!props.modelValue) return
  
  switch (e.key) {
    case 'Escape':
      close()
      break
    case 'ArrowLeft':
      e.preventDefault()
      previousImage()
      break
    case 'ArrowRight':
      e.preventDefault()
      nextImage()
      break
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>
