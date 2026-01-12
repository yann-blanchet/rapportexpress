<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 z-[70] flex flex-col"
    @click="handleClose"
  >
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/50" @click="handleClose"></div>
    
    <!-- Sheet Content - Full Height -->
    <div
      class="relative bg-base-100 w-full h-full flex flex-col shadow-2xl"
      @click.stop
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-base-300">
        <h3 class="text-lg font-bold">Edit Image</h3>
        <div class="flex items-center gap-2">
          <button
            @click="clearDrawing"
            class="btn btn-sm btn-ghost"
            title="Clear drawing"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          <button
            @click="handleClose"
            class="btn btn-sm btn-ghost btn-circle"
          >
            ×
          </button>
        </div>
      </div>

      <!-- Canvas Container -->
      <div class="flex-1 relative overflow-hidden">
        <div ref="canvasContainer" class="w-full h-full flex items-center justify-center bg-base-200">
          <canvas
            ref="canvasRef"
            @mousedown="handleMouseDown"
            @mousemove="handleMouseMove"
            @mouseup="handleMouseUp"
            @touchstart="handleTouchStart"
            @touchmove="handleTouchMove"
            @touchend="handleTouchEnd"
            class="max-w-full max-h-full"
          ></canvas>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-4 border-t border-base-300 space-y-3">
        <!-- Category Selector (for new images) -->
        <div v-if="isNewImage && availableCategories.length > 0">
          <label class="label">
            <span class="label-text font-semibold">Category</span>
          </label>
          <select
            :value="selectedCategoryId"
            @change="$emit('update:selectedCategoryId', $event.target.value)"
            class="select select-bordered w-full"
            :disabled="saving"
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

        <!-- Action Buttons -->
        <div class="flex gap-3">
          <button
            v-if="isNewImage"
            @click="addToFeed"
            class="btn btn-primary flex-1"
            :disabled="saving || !selectedCategoryId"
          >
            <span v-if="saving" class="loading loading-spinner loading-sm"></span>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            {{ saving ? 'Adding...' : 'Add to Feed' }}
          </button>
          <button
            v-else
            @click="saveEditedImage"
            class="btn btn-primary w-full"
            :disabled="saving"
          >
            <span v-if="saving" class="loading loading-spinner loading-sm"></span>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  photo: {
    type: Object,
    default: null
  },
  isNewImage: {
    type: Boolean,
    default: false
  },
  availableCategories: {
    type: Array,
    default: () => []
  },
  selectedCategoryId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'save', 'addToFeed'])

const canvasRef = ref(null)
const canvasContainer = ref(null)
const isDrawing = ref(false)
const saving = ref(false)

// Drawing state
let currentPath = []
let ctx = null
let imageObj = null
let imageX = 0
let imageY = 0
let imageWidth = 0
let imageHeight = 0

// Watch for photo changes to load image
watch(() => [props.modelValue, props.photo], async ([show, photo]) => {
  if (show && photo) {
    await nextTick()
    await loadImage(photo)
  }
}, { immediate: true })

async function loadImage(photo) {
  if (!canvasRef.value || !photo?.url_local) return
  
  ctx = canvasRef.value.getContext('2d')
  if (!ctx) return
  
  // Convert Blob to data URL if needed
  let imageSrc = photo.url_local
  if (photo.url_local instanceof Blob) {
    const reader = new FileReader()
    imageSrc = await new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(photo.url_local)
    })
  }
  
  // Load image
  imageObj = new Image()
  imageObj.crossOrigin = 'anonymous'
  
  await new Promise((resolve, reject) => {
    imageObj.onload = () => {
      // Calculate canvas size to fit container while maintaining aspect ratio
      const container = canvasContainer.value
      if (!container) {
        reject(new Error('Container not found'))
        return
      }
      
      const maxWidth = container.clientWidth
      const maxHeight = container.clientHeight
      const imgAspect = imageObj.width / imageObj.height
      const containerAspect = maxWidth / maxHeight
      
      let width, height
      if (imgAspect > containerAspect) {
        width = maxWidth
        height = maxWidth / imgAspect
      } else {
        height = maxHeight
        width = maxHeight * imgAspect
      }
      
      canvasRef.value.width = width
      canvasRef.value.height = height
      
      imageWidth = width
      imageHeight = height
      imageX = 0
      imageY = 0
      
      // Draw image
      ctx.clearRect(0, 0, width, height)
      ctx.drawImage(imageObj, 0, 0, width, height)
      
      resolve()
    }
    imageObj.onerror = reject
    imageObj.src = imageSrc
  })
  
  // Clear previous drawings
  currentPath = []
  
  // Update canvas size on window resize
  window.addEventListener('resize', updateCanvasSize)
}

function updateCanvasSize() {
  if (!props.modelValue || !imageObj || !canvasRef.value || !canvasContainer.value) return
  
  const container = canvasContainer.value
  const maxWidth = container.clientWidth
  const maxHeight = container.clientHeight
  const imgAspect = imageObj.width / imageObj.height
  const containerAspect = maxWidth / maxHeight
  
  let width, height
  if (imgAspect > containerAspect) {
    width = maxWidth
    height = maxWidth / imgAspect
  } else {
    height = maxHeight
    width = maxHeight * imgAspect
  }
  
  canvasRef.value.width = width
  canvasRef.value.height = height
  
  imageWidth = width
  imageHeight = height
  imageX = 0
  imageY = 0
  
  // Redraw image and paths
  ctx.clearRect(0, 0, width, height)
  ctx.drawImage(imageObj, 0, 0, width, height)
  redrawPaths()
}

function handleClose() {
  emit('update:modelValue', false)
  cleanup()
}

function cleanup() {
  currentPath = []
  imageObj = null
  ctx = null
  window.removeEventListener('resize', updateCanvasSize)
}

function getPointerPos(e) {
  if (!canvasRef.value) return null
  
  const rect = canvasRef.value.getBoundingClientRect()
  const clientX = e.touches ? e.touches[0].clientX : e.clientX
  const clientY = e.touches ? e.touches[0].clientY : e.clientY
  
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  }
}

function isPointInImage(x, y) {
  return x >= imageX && x <= imageX + imageWidth && 
         y >= imageY && y <= imageY + imageHeight
}

function handleMouseDown(e) {
  if (!props.photo || !ctx) return
  
  e.preventDefault()
  const pos = getPointerPos(e)
  if (!pos || !isPointInImage(pos.x, pos.y)) return
  
  isDrawing.value = true
  currentPath = [{ x: pos.x, y: pos.y }]
  
  ctx.beginPath()
  ctx.moveTo(pos.x, pos.y)
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
}

function handleMouseMove(e) {
  if (!isDrawing.value || !ctx || currentPath.length === 0) return
  
  e.preventDefault()
  const pos = getPointerPos(e)
  if (!pos) return
  
  currentPath.push({ x: pos.x, y: pos.y })
  
  ctx.lineTo(pos.x, pos.y)
  ctx.stroke()
}

function handleMouseUp(e) {
  if (!isDrawing.value) return
  
  e.preventDefault()
  isDrawing.value = false
  
  if (currentPath.length > 0) {
    // Store path for redrawing
    currentPath = []
  }
}

function handleTouchStart(e) {
  handleMouseDown(e)
}

function handleTouchMove(e) {
  handleMouseMove(e)
}

function handleTouchEnd(e) {
  handleMouseUp(e)
}

function redrawPaths() {
  // This would redraw all paths if we stored them
  // For now, we just redraw the image
  if (imageObj && ctx) {
    ctx.drawImage(imageObj, 0, 0, imageWidth, imageHeight)
  }
}

function clearDrawing() {
  if (!ctx || !imageObj) return
  
  ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
  ctx.drawImage(imageObj, 0, 0, imageWidth, imageHeight)
  currentPath = []
}

async function saveEditedImage() {
  if (!props.photo || !canvasRef.value) return
  
  saving.value = true
  
  try {
    const dataURL = canvasRef.value.toDataURL('image/png')
    emit('save', dataURL)
    handleClose()
  } catch (error) {
    console.error('Error saving edited image:', error)
    alert('Error saving edited image. Please try again.')
  } finally {
    saving.value = false
  }
}

async function addToFeed() {
  if (!props.photo || !canvasRef.value || !props.selectedCategoryId) return
  
  saving.value = true
  
  try {
    const dataURL = canvasRef.value.toDataURL('image/png')
    emit('addToFeed', { dataURL, categoryId: props.selectedCategoryId })
    handleClose()
  } catch (error) {
    console.error('Error adding image to feed:', error)
    alert('Error adding image to feed. Please try again.')
  } finally {
    saving.value = false
  }
}

onUnmounted(() => {
  cleanup()
})
</script>
