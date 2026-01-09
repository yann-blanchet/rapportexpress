// Supabase Edge Function for Audio Transcription using OpenAI Whisper API
// Deploy: supabase functions deploy transcribe-audio

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// CORS headers helper
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role key for user verification
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Verify authentication (optional for MVP - allow anonymous users)
    const authHeader = req.headers.get('Authorization')
    let user = null
    
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '')
        const authResult = await supabase.auth.getUser(token)
        user = authResult.data?.user || null
        if (user) {
          console.log('Transcription request from authenticated user:', user.id)
        }
      } catch (err) {
        // Token might be invalid - allow to continue for anonymous users
        console.warn('Auth check failed, allowing anonymous access:', err)
      }
    }
    
    // For MVP: Allow anonymous users but log it
    // In production, you may want to require authentication or implement rate limiting
    if (!user) {
      console.warn('Transcription request from unauthenticated/anonymous user')
      // Continue anyway for MVP - remove this in production if you want to require auth
    }

    // Check for OpenAI API key
    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { 
          status: 500, 
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          } 
        }
      )
    }

    // Parse request body
    const { audioData, fileName, mimeType } = await req.json()

    if (!audioData) {
      return new Response(
        JSON.stringify({ error: 'Missing audio data' }),
        { 
          status: 400, 
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          } 
        }
      )
    }

    // Convert base64 to binary
    const binaryString = atob(audioData)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    // Create a File-like object for OpenAI
    const audioFile = new File([bytes], fileName || 'audio.webm', { type: mimeType || 'audio/webm' })

    // Call OpenAI Whisper API
    const formData = new FormData()
    formData.append('file', audioFile)
    formData.append('model', 'whisper-1')
    formData.append('language', 'fr') // French - adjust as needed
    formData.append('response_format', 'text')

    const openaiResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    })

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error('OpenAI API error:', errorText)
      
      // Parse OpenAI error for better user message
      let errorMessage = 'Transcription failed'
      try {
        const errorData = JSON.parse(errorText)
        if (errorData.error) {
          if (errorData.error.code === 'insufficient_quota') {
            errorMessage = 'OpenAI API quota exceeded. Please check your OpenAI billing and add credits.'
          } else if (errorData.error.message) {
            errorMessage = `OpenAI API error: ${errorData.error.message}`
          }
        }
      } catch {
        // If parsing fails, use the raw error text
        errorMessage = errorText
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage, details: errorText }),
        { 
          status: openaiResponse.status, 
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          } 
        }
      )
    }

    const transcription = await openaiResponse.text()

    return new Response(
      JSON.stringify({ transcription: transcription.trim() }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    console.error('Error in transcribe-audio function:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500, 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        } 
      }
    )
  }
})
