/**
 * Authentication Service - Email OTP Authentication
 * 
 * Simple email-based OTP authentication using Supabase
 * - No passwords
 * - No magic-link redirects
 * - 8-digit OTP codes
 * - Persistent sessions
 */

import { supabase } from './supabase'

/**
 * Send OTP code to email
 * @param {string} email - User's email address
 * @returns {Promise<{error: Error|null, data: any}>}
 */
export async function sendOTP(email) {
  try {
    // Validate email format
    if (!email || !email.includes('@')) {
      return {
        error: new Error('Please enter a valid email address'),
        data: null
      }
    }

    // Send OTP using Supabase's signInWithOtp
    // This automatically handles sign-up if user doesn't exist
    const normalizedEmail = email.trim().toLowerCase()
    
    console.log('[Auth] Sending OTP to:', normalizedEmail)
    
    // Send OTP using Supabase's signInWithOtp
    // To get a 6-digit OTP code (not magic link), we must NOT set emailRedirectTo
    // This forces Supabase to send an OTP code instead of a magic link
    const { data, error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        // CRITICAL: Don't set emailRedirectTo - this forces OTP mode (6-digit code)
        // If emailRedirectTo is set, Supabase sends a magic link instead
        emailRedirectTo: undefined,
        shouldCreateUser: true // Auto-create user if doesn't exist
      }
    })
    
    if (data) {
      console.log('[Auth] OTP sent successfully')
    }

    if (error) {
      console.error('[Auth] Error sending OTP:', error)
      return {
        error: error,
        data: null
      }
    }

    return {
      error: null,
      data: data
    }
  } catch (error) {
    console.error('[Auth] Exception sending OTP:', error)
    return {
      error: error instanceof Error ? error : new Error('Failed to send OTP'),
      data: null
    }
  }
}

/**
 * Verify OTP code and sign in
 * @param {string} email - User's email address
 * @param {string} token - 8-digit OTP code
 * @returns {Promise<{error: Error|null, data: any}>}
 */
export async function verifyOTP(email, token) {
  try {
    if (!email || !token) {
      return {
        error: new Error('Email and OTP code are required'),
        data: null
      }
    }

    // Normalize email (must match exactly what was used to send OTP)
    const normalizedEmail = email.trim().toLowerCase()
    const normalizedToken = token.trim().replace(/\s/g, '').replace(/-/g, '') // Remove spaces and dashes

    console.log('[Auth] Verifying OTP...')
    console.log('[Auth] Email:', normalizedEmail)
    console.log('[Auth] Token length:', normalizedToken.length)
    console.log('[Auth] Token:', normalizedToken)

    // Verify OTP using Supabase
    // The token is the 8-digit code from email
    // Important: email must match exactly what was used in signInWithOtp
    const { data, error } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token: normalizedToken,
      type: 'email'
    })

    if (error) {
      console.error('[Auth] Error verifying OTP:', error)
      console.error('[Auth] Error status:', error.status)
      console.error('[Auth] Error message:', error.message)
      console.error('[Auth] Email used:', normalizedEmail)
      console.error('[Auth] Token used:', normalizedToken)
      
      // Provide more helpful error messages based on error type
      let userMessage = 'Invalid code. Please try again.'
      
      if (error.status === 403 || error.message?.includes('expired') || error.message?.includes('invalid')) {
        userMessage = 'This code has expired or is invalid. Please request a new code by clicking "Resend code".'
      } else if (error.message?.includes('already been used')) {
        userMessage = 'This code has already been used. Please request a new code.'
      } else if (error.message?.includes('rate limit')) {
        userMessage = 'Too many attempts. Please wait a moment and try again.'
      } else {
        userMessage = error.message || 'Invalid code. Please try again.'
      }
      
      return {
        error: new Error(userMessage),
        data: null
      }
    }
    
    console.log('[Auth] OTP verified successfully')

    // Session is automatically stored by Supabase client
    // It persists in localStorage and is restored on app reload
    return {
      error: null,
      data: data
    }
  } catch (error) {
    console.error('[Auth] Exception verifying OTP:', error)
    return {
      error: error instanceof Error ? error : new Error('Failed to verify OTP'),
      data: null
    }
  }
}

/**
 * Get current user session
 * @returns {Promise<{user: any|null, session: any|null}>}
 */
export async function getCurrentSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('[Auth] Error getting session:', error)
      return { user: null, session: null }
    }

    return {
      user: session?.user || null,
      session: session
    }
  } catch (error) {
    console.error('[Auth] Exception getting session:', error)
    return { user: null, session: null }
  }
}

/**
 * Get current user (async check)
 * @returns {Promise<any|null>}
 */
export async function getCurrentUser() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  } catch (error) {
    return null
  }
}

/**
 * Sign out current user
 * @returns {Promise<{error: Error|null}>}
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('[Auth] Error signing out:', error)
      return { error }
    }

    // Clear any local data if needed
    // Note: Supabase automatically clears session from localStorage
    
    return { error: null }
  } catch (error) {
    console.error('[Auth] Exception signing out:', error)
    return {
      error: error instanceof Error ? error : new Error('Failed to sign out')
    }
  }
}

/**
 * Listen to auth state changes
 * @param {Function} callback - Callback function (user) => void
 * @returns {Function} Unsubscribe function
 */
export function onAuthStateChange(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null, event)
  })

  return () => {
    subscription.unsubscribe()
  }
}

/**
 * Check if user is authenticated
 * @returns {Promise<boolean>}
 */
export async function isAuthenticated() {
  const { user } = await getCurrentSession()
  return !!user
}
