/**
 * Profile Service - User Profile Management
 * 
 * Handles loading and syncing user profile (settings like trade selection)
 * - Offline-first: Uses localStorage cache
 * - Auto-syncs with Supabase when online
 * - Handles missing profile gracefully
 */

import { supabase } from './supabase'

// Cache key for localStorage
const PROFILE_CACHE_KEY = 'user_profile_cache'

/**
 * Get profile from cache (localStorage)
 * @returns {Object|null} Cached profile or null
 */
function getCachedProfile() {
  try {
    const cached = localStorage.getItem(PROFILE_CACHE_KEY)
    if (cached) {
      return JSON.parse(cached)
    }
  } catch (error) {
    console.warn('[Profile] Error reading cache:', error)
  }
  return null
}

/**
 * Cache profile to localStorage
 * @param {Object} profile - Profile object to cache
 */
function cacheProfile(profile) {
  try {
    localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile))
  } catch (error) {
    console.warn('[Profile] Error caching profile:', error)
  }
}

/**
 * Clear profile cache
 */
function clearProfileCache() {
  try {
    localStorage.removeItem(PROFILE_CACHE_KEY)
  } catch (error) {
    console.warn('[Profile] Error clearing cache:', error)
  }
}

/**
 * Load user profile from Supabase
 * Profile is auto-created by trigger on first login, so it should always exist
 * @returns {Promise<Object|null>} Profile object or null if not found/not authenticated
 */
export async function loadProfile() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      // Not authenticated - return cached profile or null
      return getCachedProfile()
    }

    // Check if profiles table exists
    try {
      const { error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
      
      if (checkError && checkError.code === 'PGRST205') {
        // Table doesn't exist - return cached profile
        console.warn('[Profile] Profiles table does not exist yet')
        return getCachedProfile()
      }
    } catch (checkError) {
      // Table doesn't exist - return cached profile
      return getCachedProfile()
    }

    // Fetch profile from Supabase
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Profile doesn't exist - trigger should have created it
        // This might happen on first login before trigger fires
        // Return cached profile or create one
        console.warn('[Profile] Profile not found, will be created by trigger')
        return getCachedProfile()
      }
      throw error
    }

    // Cache the profile for offline use
    if (data) {
      cacheProfile(data)
    }

    return data
  } catch (error) {
    console.error('[Profile] Error loading profile:', error)
    // Return cached profile as fallback
    return getCachedProfile()
  }
}

/**
 * Update profile in Supabase
 * @param {Object} updates - Profile fields to update (e.g., { trade: 'building' })
 * @returns {Promise<Object|null>} Updated profile or null
 */
export async function updateProfile(updates) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User must be authenticated to update profile')
    }

    // Check if profiles table exists
    try {
      const { error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
      
      if (checkError && checkError.code === 'PGRST205') {
        console.warn('[Profile] Profiles table does not exist yet')
        // Cache locally anyway for offline use
        const cached = getCachedProfile() || {}
        const updated = { ...cached, ...updates, user_id: user.id }
        cacheProfile(updated)
        return updated
      }
    } catch (checkError) {
      // Table doesn't exist - cache locally
      const cached = getCachedProfile() || {}
      const updated = { ...cached, ...updates, user_id: user.id }
      cacheProfile(updated)
      return updated
    }

    // Update profile in Supabase
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      // If profile doesn't exist, try to create it
      if (error.code === 'PGRST116' || error.message?.includes('No rows')) {
        // Profile doesn't exist - create it
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            ...updates
          })
          .select()
          .single()

        if (createError) {
          throw createError
        }

        // Cache the new profile
        if (newProfile) {
          cacheProfile(newProfile)
        }

        return newProfile
      }
      throw error
    }

    // Cache the updated profile
    if (data) {
      cacheProfile(data)
    }

    return data
  } catch (error) {
    console.error('[Profile] Error updating profile:', error)
    
    // Even if sync fails, cache locally for offline use
    const cached = getCachedProfile() || {}
    const updated = { ...cached, ...updates }
    cacheProfile(updated)
    
    // Return cached version (offline-first)
    return updated
  }
}

/**
 * Get profile field value (with fallback to cache)
 * @param {string} field - Field name (e.g., 'trade')
 * @returns {Promise<any>} Field value or null
 */
export async function getProfileField(field) {
  const profile = await loadProfile()
  return profile?.[field] || null
}

/**
 * Get cached profile (synchronous, for immediate access)
 * @returns {Object|null} Cached profile or null
 */
export function getCachedProfileSync() {
  return getCachedProfile()
}

/**
 * Clear profile cache (e.g., on logout)
 */
export function clearCache() {
  clearProfileCache()
}
