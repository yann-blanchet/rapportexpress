/**
 * Trade-based Category System
 * 
 * Categories are fixed and depend on the inspector's trade (job type).
 * Users never create, edit, or delete categories.
 * Each trade has 4-6 categories plus a default "Other" category.
 */

// Trade definitions
export const TRADES = {
  BUILDING: 'building',
  ELECTRICITY: 'electricity',
  FIRE_SAFETY: 'fire_safety',
  HYGIENE: 'hygiene',
  GENERAL: 'general'
}

// Trade display names
export const TRADE_NAMES = {
  [TRADES.BUILDING]: 'Building / Construction',
  [TRADES.ELECTRICITY]: 'Electricity',
  [TRADES.FIRE_SAFETY]: 'Fire Safety',
  [TRADES.HYGIENE]: 'Hygiene / Sanitary',
  [TRADES.GENERAL]: 'General'
}

// Category definitions by trade
export const CATEGORIES_BY_TRADE = {
  [TRADES.BUILDING]: [
    { id: 'structure', name: 'Structure' },
    { id: 'walls', name: 'Walls & Partitions' },
    { id: 'roofing', name: 'Roofing' },
    { id: 'doors_windows', name: 'Doors & Windows' },
    { id: 'floors', name: 'Floors & Surfaces' },
    { id: 'other', name: 'Other' }
  ],
  [TRADES.ELECTRICITY]: [
    { id: 'wiring', name: 'Wiring & Cables' },
    { id: 'panels', name: 'Electrical Panels' },
    { id: 'outlets', name: 'Outlets & Switches' },
    { id: 'lighting', name: 'Lighting' },
    { id: 'safety', name: 'Safety & Compliance' },
    { id: 'other', name: 'Other' }
  ],
  [TRADES.FIRE_SAFETY]: [
    { id: 'extinguishers', name: 'Fire Extinguishers' },
    { id: 'alarms', name: 'Fire Alarms & Detectors' },
    { id: 'exits', name: 'Emergency Exits' },
    { id: 'signage', name: 'Safety Signage' },
    { id: 'systems', name: 'Fire Suppression Systems' },
    { id: 'other', name: 'Other' }
  ],
  [TRADES.HYGIENE]: [
    { id: 'sanitation', name: 'Sanitation' },
    { id: 'water', name: 'Water Systems' },
    { id: 'waste', name: 'Waste Management' },
    { id: 'ventilation', name: 'Ventilation' },
    { id: 'surfaces', name: 'Surfaces & Cleaning' },
    { id: 'other', name: 'Other' }
  ],
  [TRADES.GENERAL]: [
    { id: 'safety', name: 'Safety' },
    { id: 'maintenance', name: 'Maintenance' },
    { id: 'compliance', name: 'Compliance' },
    { id: 'documentation', name: 'Documentation' },
    { id: 'other', name: 'Other' }
  ]
}

// Default category ID (always "other")
export const DEFAULT_CATEGORY_ID = 'other'

/**
 * Get categories for a specific trade
 * @param {string} trade - Trade ID
 * @returns {Array} Array of category objects
 */
export function getCategoriesForTrade(trade) {
  if (!trade || !CATEGORIES_BY_TRADE[trade]) {
    // Fallback to General if trade is invalid
    return CATEGORIES_BY_TRADE[TRADES.GENERAL]
  }
  return CATEGORIES_BY_TRADE[trade]
}

/**
 * Get category name by ID and trade
 * @param {string} categoryId - Category ID
 * @param {string} trade - Trade ID
 * @returns {string} Category name or "Other" if not found
 */
export function getCategoryName(categoryId, trade) {
  const categories = getCategoriesForTrade(trade)
  const category = categories.find(c => c.id === categoryId)
  return category ? category.name : 'Other'
}

/**
 * Validate category ID for a trade
 * @param {string} categoryId - Category ID to validate
 * @param {string} trade - Trade ID
 * @returns {boolean} True if valid, false otherwise
 */
export function isValidCategory(categoryId, trade) {
  const categories = getCategoriesForTrade(trade)
  return categories.some(c => c.id === categoryId)
}

/**
 * Get default category for a trade (always "other")
 * @param {string} trade - Trade ID
 * @returns {string} Default category ID
 */
export function getDefaultCategory(trade) {
  return DEFAULT_CATEGORY_ID
}

/**
 * Get last used category from localStorage
 * @param {string} trade - Trade ID
 * @returns {string} Last used category ID or default
 */
export function getLastUsedCategory(trade) {
  const key = `lastCategory_${trade}`
  const lastUsed = localStorage.getItem(key)
  if (lastUsed && isValidCategory(lastUsed, trade)) {
    return lastUsed
  }
  return getDefaultCategory(trade)
}

/**
 * Save last used category to localStorage
 * @param {string} trade - Trade ID
 * @param {string} categoryId - Category ID to save
 */
export function saveLastUsedCategory(trade, categoryId) {
  if (isValidCategory(categoryId, trade)) {
    const key = `lastCategory_${trade}`
    localStorage.setItem(key, categoryId)
  }
}

/**
 * Get selected trade from profile (with localStorage fallback)
 * @returns {string|null} Selected trade ID or null
 */
export function getSelectedTrade() {
  // Try to get from cached profile first (synchronous check)
  try {
    const cached = localStorage.getItem('user_profile_cache')
    if (cached) {
      const profile = JSON.parse(cached)
      if (profile?.trade) {
        return profile.trade
      }
    }
  } catch (error) {
    // Profile cache not available or invalid - fallback to localStorage
  }
  
  // Fallback to localStorage (for backward compatibility)
  return localStorage.getItem('selectedTrade')
}

/**
 * Save selected trade to profile and localStorage
 * @param {string} trade - Trade ID to save
 * @param {boolean} syncToCloud - Whether to sync to Supabase (default: true)
 */
export async function setSelectedTrade(trade, syncToCloud = true) {
  if (trade && Object.values(TRADES).includes(trade)) {
    // Save to localStorage immediately (offline-first)
    localStorage.setItem('selectedTrade', trade)
    
    // Sync to Supabase profile if requested and available
    if (syncToCloud) {
      try {
        // Dynamically import to avoid circular dependencies
        const { updateProfile } = await import('../services/profile')
        await updateProfile({ trade })
      } catch (error) {
        // If sync fails, trade is still saved in localStorage
        console.warn('Failed to sync trade to profile:', error)
      }
    }
  }
}

/**
 * Load trade from profile and update localStorage
 * Call this on app startup or after login
 */
export async function loadTradeFromCloud() {
  try {
    // Dynamically import to avoid circular dependencies
    const { getProfileField } = await import('../services/profile')
    const cloudTrade = await getProfileField('trade')
    
    if (cloudTrade) {
      // Update localStorage with cloud value
      localStorage.setItem('selectedTrade', cloudTrade)
      return cloudTrade
    }
    
    // No cloud value - keep localStorage value
    return getSelectedTrade()
  } catch (error) {
    console.warn('Failed to load trade from profile:', error)
    // Fallback to localStorage
    return getSelectedTrade()
  }
}
