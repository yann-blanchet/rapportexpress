<template>
  <div class="audio-dictation">
    <!-- Hold-to-record button -->
    <button
      type="button"
      @mousedown="startRecording"
      @mouseup="stopRecording"
      @mouseleave="stopRecording"
      @touchstart.prevent="startRecording"
      @touchend.prevent="stopRecording"
      @touchcancel.prevent="stopRecording"
      :disabled="!isSupported || isProcessing"
      :class="[
        'btn btn-circle transition-all',
        isRecording ? 'btn-error animate-pulse' : 'btn-primary',
        (!isSupported || isProcessing) && 'btn-disabled'
      ]"
      :title="buttonTitle"
    >
      <svg
        v-if="!isRecording && !isProcessing"
        xmlns="http://www.w3.org/2000/svg"
        class="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
        />
      </svg>
      <svg
        v-else-if="isRecording"
        xmlns="http://www.w3.org/2000/svg"
        class="h-5 w-5"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
      </svg>
      <span v-else class="loading loading-spinner loading-sm"></span>
    </button>

    <!-- Status indicator -->
    <div v-if="statusMessage" class="mt-2 text-xs text-center">
      <div
        :class="[
          'badge badge-sm',
          statusType === 'error' ? 'badge-error' :
          statusType === 'success' ? 'badge-success' :
          statusType === 'pending' ? 'badge-warning' :
          'badge-info'
        ]"
      >
        {{ statusMessage }}
      </div>
    </div>

    <!-- Pending recordings indicator -->
    <div v-if="pendingCount > 0 && !isRecording" class="mt-2">
      <div class="alert alert-warning py-1 px-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="stroke-current shrink-0 h-3 w-3"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <span class="text-xs">{{ pendingCount }} pending</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { db } from '../db/indexeddb'
import { transcribeAudio } from '../services/supabase'
import { generateUUID } from '../utils/uuid'

const props = defineProps({
  interventionId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['transcription'])

// State
const isSupported = ref(false)
const isRecording = ref(false)
const isProcessing = ref(false)
const statusMessage = ref('')
const statusType = ref('info') // 'info', 'success', 'error', 'pending'
const pendingCount = ref(0)

let mediaRecorder = null
let audioChunks = []
let mediaStream = null
let supportedMimeType = 'audio/webm'

// Check browser support
onMounted(async () => {
  // Check MediaRecorder support
  if (typeof MediaRecorder === 'undefined') {
    statusMessage.value = 'Recording not supported'
    statusType.value = 'error'
    return
  }

  // Check getUserMedia support
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    statusMessage.value = 'Microphone not available'
    statusType.value = 'error'
    return
  }

  // Detect supported MIME type
  const mimeTypes = ['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav']
  for (const mimeType of mimeTypes) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      supportedMimeType = mimeType
      break
    }
  }

  isSupported.value = true
  await updatePendingCount()

  // Listen for online/offline events
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  // Process pending audio if online
  if (navigator.onLine) {
    processPendingAudio()
  }
})

onUnmounted(() => {
  stopRecording()
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
})

const buttonTitle = computed(() => {
  if (!isSupported) return 'Recording not supported'
  if (isProcessing) return 'Processing...'
  if (isRecording) return 'Release to stop'
  return 'Hold to record'
})

async function updatePendingCount() {
  try {
    const count = await db.pending_audio
      .where('intervention_id')
      .equals(props.interventionId)
      .count()
    pendingCount.value = count
  } catch (error) {
    console.error('Error counting pending audio:', error)
  }
}

async function startRecording() {
  if (!isSupported.value || isRecording.value) return

  try {
    // Request microphone access
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    })

    // Create MediaRecorder
    const options = { mimeType: supportedMimeType }
    mediaRecorder = new MediaRecorder(mediaStream, options)

    audioChunks = []

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data)
      }
    }

    mediaRecorder.onstop = async () => {
      if (audioChunks.length === 0) {
        cleanup()
        return
      }

      // Create blob from chunks
      const audioBlob = new Blob(audioChunks, { type: supportedMimeType })
      
      // Save to IndexedDB
      await savePendingAudio(audioBlob)
      
      cleanup()

      // Try to transcribe if online
      if (navigator.onLine) {
        await processPendingAudio()
      } else {
        statusMessage.value = 'Saved offline'
        statusType.value = 'pending'
        setTimeout(() => {
          statusMessage.value = ''
        }, 3000)
      }
    }

    // Start recording
    mediaRecorder.start(100) // 100ms timeslice for mobile
    isRecording.value = true
    statusMessage.value = 'Recording...'
    statusType.value = 'info'
  } catch (error) {
    console.error('Error starting recording:', error)
    statusMessage.value = error.message || 'Failed to start'
    statusType.value = 'error'
    setTimeout(() => {
      statusMessage.value = ''
    }, 3000)
    cleanup()
  }
}

function stopRecording() {
  if (!isRecording.value || !mediaRecorder) return

  if (mediaRecorder.state === 'recording') {
    mediaRecorder.stop()
  }

  isRecording.value = false
}

function cleanup() {
  // Stop all tracks
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop())
    mediaStream = null
  }

  mediaRecorder = null
  audioChunks = []
}

async function savePendingAudio(audioBlob) {
  try {
    const audioId = generateUUID()
    await db.pending_audio.add({
      id: audioId,
      intervention_id: props.interventionId,
      audio_blob: audioBlob,
      created_at: new Date().toISOString()
    })
    await updatePendingCount()
  } catch (error) {
    console.error('Error saving pending audio:', error)
    throw error
  }
}

async function handleOnline() {
  statusMessage.value = 'Processing...'
  statusType.value = 'info'
  await processPendingAudio()
  setTimeout(() => {
    statusMessage.value = ''
  }, 2000)
}

function handleOffline() {
  statusMessage.value = 'Offline - will transcribe when online'
  statusType.value = 'pending'
  setTimeout(() => {
    statusMessage.value = ''
  }, 3000)
}

async function processPendingAudio() {
  if (!navigator.onLine || isProcessing.value) return

  try {
    isProcessing.value = true

    // Get all pending audio for this intervention
    const pendingAudios = await db.pending_audio
      .where('intervention_id')
      .equals(props.interventionId)
      .toArray()

    if (pendingAudios.length === 0) {
      isProcessing.value = false
      return
    }

    // Process each pending audio with rate limiting (one at a time with delay)
    for (let i = 0; i < pendingAudios.length; i++) {
      const pendingAudio = pendingAudios[i]
      
      // Add delay between requests to avoid rate limiting (except for first one)
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000)) // 2 second delay
      }
      
      try {
        statusMessage.value = `Transcribing ${i + 1}/${pendingAudios.length}...`
        statusType.value = 'info'

        // Convert blob to File for upload
        const audioFile = new File(
          [pendingAudio.audio_blob],
          `audio_${pendingAudio.id}.${getFileExtension(pendingAudio.audio_blob.type)}`,
          { type: pendingAudio.audio_blob.type || supportedMimeType }
        )

        // Transcribe with retry logic for rate limits
        let transcription = null
        let retries = 0
        const maxRetries = 3
        
        while (retries < maxRetries && !transcription) {
          try {
            transcription = await transcribeAudio(audioFile)
          } catch (error) {
            // If rate limited, wait and retry
            if (error.message?.includes('Rate limit') && retries < maxRetries - 1) {
              const waitTime = Math.pow(2, retries) * 2000 // Exponential backoff: 2s, 4s, 8s
              statusMessage.value = `Rate limited, waiting ${waitTime/1000}s...`
              await new Promise(resolve => setTimeout(resolve, waitTime))
              retries++
              continue
            }
            throw error
          }
        }
        
        if (!transcription) {
          throw new Error('Failed after retries')
        }

        if (transcription && transcription.trim()) {
          // Emit transcription event
          emit('transcription', transcription.trim())

          statusMessage.value = 'Transcribed!'
          statusType.value = 'success'
        } else {
          throw new Error('Empty transcription')
        }

        // Delete from IndexedDB
        await db.pending_audio.delete(pendingAudio.id)
        await updatePendingCount()

      } catch (error) {
        console.error('Error transcribing audio:', error)
        // Keep the audio in IndexedDB for retry
        const errorMsg = error.message || 'Transcription failed'
        if (errorMsg.includes('quota') || errorMsg.includes('billing')) {
          statusMessage.value = 'OpenAI quota exceeded - check billing'
        } else if (errorMsg.includes('Rate limit')) {
          statusMessage.value = 'Rate limited - will retry later'
        } else {
          statusMessage.value = 'Failed - will retry'
        }
        statusType.value = 'error'
        
        // If rate limited, stop processing remaining audio to avoid more rate limits
        if (errorMsg.includes('Rate limit')) {
          console.log('Rate limited - stopping batch processing to avoid further limits')
          break
        }
      }
    }

    setTimeout(() => {
      statusMessage.value = ''
    }, 2000)

  } catch (error) {
    console.error('Error processing pending audio:', error)
    statusMessage.value = 'Error processing'
    statusType.value = 'error'
    setTimeout(() => {
      statusMessage.value = ''
    }, 3000)
  } finally {
    isProcessing.value = false
  }
}

function getFileExtension(mimeType) {
  if (mimeType.includes('webm')) return 'webm'
  if (mimeType.includes('mp4')) return 'mp4'
  if (mimeType.includes('ogg')) return 'ogg'
  if (mimeType.includes('wav')) return 'wav'
  return 'webm'
}

// Expose method to manually trigger processing
defineExpose({
  processPending: processPendingAudio
})
</script>

<style scoped>
.audio-dictation {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
