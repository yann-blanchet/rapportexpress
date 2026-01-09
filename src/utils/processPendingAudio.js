// Global utility to process all pending audio transcriptions
// Called when app starts or when coming online

import { db } from '../db/indexeddb'
import { transcribeAudio } from '../services/supabase'

let isProcessing = false

export async function processAllPendingAudio() {
  if (isProcessing || !navigator.onLine) {
    return
  }

  try {
    isProcessing = true

    // Get all pending audio
    const pendingAudios = await db.pending_audio.toArray()

    if (pendingAudios.length === 0) {
      return
    }

    console.log(`[PendingAudio] Processing ${pendingAudios.length} pending transcription(s)...`)

    // Process each pending audio with rate limiting (one at a time with delay)
    for (let i = 0; i < pendingAudios.length; i++) {
      const pendingAudio = pendingAudios[i]
      
      // Add delay between requests to avoid rate limiting (except for first one)
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000)) // 2 second delay
      }
      
      try {
        // Convert blob to File for upload
        const audioFile = new File(
          [pendingAudio.audio_blob],
          `audio_${pendingAudio.id}.${getFileExtension(pendingAudio.audio_blob.type)}`,
          { type: pendingAudio.audio_blob.type || 'audio/webm' }
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
              console.log(`[PendingAudio] Rate limited, waiting ${waitTime/1000}s before retry...`)
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
          // Dispatch event so components can handle the transcription
          window.dispatchEvent(new CustomEvent('audioTranscribed', {
            detail: {
              interventionId: pendingAudio.intervention_id,
              transcription: transcription.trim()
            }
          }))

          // Delete from IndexedDB
          await db.pending_audio.delete(pendingAudio.id)
          console.log(`[PendingAudio] Transcribed and deleted audio ${pendingAudio.id}`)
        } else {
          throw new Error('Empty transcription')
        }

      } catch (error) {
        console.error(`[PendingAudio] Error transcribing audio ${pendingAudio.id}:`, error)
        // Keep the audio in IndexedDB for retry
        // If rate limited, stop processing remaining audio to avoid more rate limits
        if (error.message?.includes('Rate limit')) {
          console.log('[PendingAudio] Rate limited - stopping batch processing to avoid further limits')
          break
        }
        // Don't throw - continue with next audio for other errors
      }
    }

  } catch (error) {
    console.error('[PendingAudio] Error processing pending audio:', error)
  } finally {
    isProcessing = false
  }
}

function getFileExtension(mimeType) {
  if (mimeType.includes('webm')) return 'webm'
  if (mimeType.includes('mp4')) return 'mp4'
  if (mimeType.includes('ogg')) return 'ogg'
  if (mimeType.includes('wav')) return 'wav'
  return 'webm'
}

// Initialize on module load if online
if (navigator.onLine) {
  // Small delay to ensure app is ready
  setTimeout(() => {
    processAllPendingAudio()
  }, 2000)
}

// Listen for online events
window.addEventListener('online', () => {
  processAllPendingAudio()
})
