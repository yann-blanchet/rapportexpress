# Audio Dictation Feature - Setup Guide

## Overview

The audio dictation feature allows users to record voice notes in intervention comments that are automatically transcribed to text using OpenAI's Whisper API. The feature works offline and automatically processes pending transcriptions when the device comes online.

## ✅ Implementation Complete

### Components Created

1. **AudioDictation.vue** - Hold-to-record button component
   - Located in: `src/components/AudioDictation.vue`
   - Records audio using MediaRecorder API
   - Stores audio blobs in IndexedDB when offline
   - Automatically processes pending audio when online
   - Shows status indicators (recording, pending, transcribing, success, error)

2. **InterventionForm.vue** - Integrated dictation into Comments tab
   - Button appears above the comment textarea
   - Appends transcribed text to comment textarea
   - Allows manual editing of transcribed text

3. **processPendingAudio.js** - Global processor
   - Located in: `src/utils/processPendingAudio.js`
   - Processes all pending audio transcriptions on app startup
   - Processes when device comes online
   - Dispatches events for components to handle transcriptions

### Database Schema

**IndexedDB (Dexie) - Version 4:**
```javascript
pending_audio: {
  id: string (primary key)
  intervention_id: string (indexed)
  audio_blob: Blob
  created_at: string (ISO date)
}
```

### Backend

**Supabase Edge Function: `transcribe-audio`**
- Location: `supabase/functions/transcribe-audio/index.ts`
- Receives base64-encoded audio
- Calls OpenAI Whisper API
- Returns transcribed text
- Requires authentication (auth.uid())

## Setup Instructions

### 1. Deploy Supabase Edge Function

1. **Set Environment Variable:**
   - Go to Supabase Dashboard > Project Settings > Edge Functions > Secrets
   - Add `OPENAI_API_KEY` with your OpenAI API key

2. **Deploy the Function:**
   ```bash
   cd /Users/umablanchet/Desktop/yann/rapportexpress
   supabase functions deploy transcribe-audio
   ```

### 2. Test the Feature

1. Open an intervention (new or existing)
2. Go to the "Comments" tab
3. Hold the microphone button to record
4. Release to stop recording
5. If online, transcription will happen automatically
6. If offline, audio is saved and will be transcribed when online

## Features

### ✅ Implemented

- ✅ Hold-to-record button (mobile-first, touch support)
- ✅ Offline recording (stores in IndexedDB)
- ✅ Automatic transcription when online
- ✅ Only transcription text is saved (audio deleted after transcription)
- ✅ Text appended to comment textarea
- ✅ Editable transcribed text
- ✅ Retry on failure (audio remains in IndexedDB)
- ✅ Pending transcription indicator
- ✅ Network status detection
- ✅ Clear feedback states (recording, pending, transcribing, success, error)
- ✅ Non-blocking (doesn't prevent report editing)

### UX States

- **Recording**: Red pulsing button with stop icon
- **Pending**: Warning badge "X pending transcription(s)"
- **Transcribing**: Loading spinner with "Transcribing..." message
- **Success**: Green badge "Transcribed!"
- **Error**: Red badge with error message
- **Offline**: Warning "Offline - will transcribe when online"

## Technical Details

### Audio Format

- Detects supported MIME types: webm, mp4, ogg, wav
- Uses 100ms timeslice for mobile compatibility
- Audio constraints: echoCancellation, noiseSuppression, autoGainControl

### Transcription

- Uses OpenAI Whisper API (model: whisper-1)
- Language: French (configurable in Edge Function)
- Response format: text
- Audio is deleted immediately after successful transcription

### Error Handling

- Microphone permission errors: Shows error message
- Network errors: Audio saved offline, retries when online
- Transcription failures: Audio remains in IndexedDB for retry
- API errors: Logged, user can retry

## File Structure

```
src/
  components/
    AudioDictation.vue          # Main dictation component
  views/
    InterventionForm.vue         # Integrated dictation
  services/
    supabase.js                  # transcribeAudio() function
  utils/
    processPendingAudio.js       # Global processor
  db/
    indexeddb.js                 # Updated schema (v4)

supabase/
  functions/
    transcribe-audio/
      index.ts                   # Edge Function
```

## Troubleshooting

### Audio not recording
- Check browser permissions for microphone
- Verify MediaRecorder API support
- Check console for errors

### Transcription not working
- Verify Edge Function is deployed
- Check OPENAI_API_KEY is set in Supabase
- Verify user is authenticated
- Check network connection
- Review Edge Function logs in Supabase Dashboard

### Pending audio not processing
- Check if device is online
- Verify IndexedDB has pending audio: `db.pending_audio.toArray()`
- Check console for errors
- Try manually triggering: `window.processAllPendingAudio()` (if exposed)

## Next Steps

1. **Deploy the Edge Function** (see Setup Instructions above)
2. **Set OpenAI API Key** in Supabase Dashboard
3. **Test the feature** in your app

The feature is ready to use once you deploy the Edge Function and set the OpenAI API key!
