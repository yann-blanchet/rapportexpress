/**
 * Sequence Number Utilities
 * Handles auto-incrementing sequence numbers for similar reports
 */

/**
 * Format sequence number as #001, #002, etc.
 * @param {number} num - Sequence number
 * @returns {string} Formatted sequence (e.g., "#001")
 */
export function formatSequenceNumber(num) {
  if (!num || num < 1) return ''
  return `#${String(num).padStart(3, '0')}`
}

/**
 * Get the next sequence number for a given base title (client_name)
 * Works fully offline by querying local IndexedDB
 * @param {Dexie} db - Database instance
 * @param {string} baseTitle - Base title (client_name) to find next sequence for
 * @returns {Promise<number>} Next sequence number (starts at 1 if no existing reports)
 */
export async function getNextSequenceNumber(db, baseTitle) {
  if (!baseTitle || !baseTitle.trim()) {
    return 1 // Default to 1 if no base title
  }
  
  try {
    // Find all interventions with the same base title
    const similarReports = await db.interventions
      .where('client_name')
      .equals(baseTitle.trim())
      .toArray()
    
    if (similarReports.length === 0) {
      return 1 // First report for this base title
    }
    
    // Find the maximum sequence number
    const maxSequence = similarReports.reduce((max, report) => {
      const seq = report.sequence_number || 1 // Default to 1 if null
      return Math.max(max, seq)
    }, 0)
    
    // Return next sequence number
    return maxSequence + 1
  } catch (error) {
    console.error('Error computing next sequence number:', error)
    // Fallback: return 1 on error
    return 1
  }
}

/**
 * Get display title for a report
 * Format: "Base Title #001" or just "Base Title" if no sequence
 * @param {Object} intervention - Intervention object
 * @returns {string} Display title
 */
export function getDisplayTitle(intervention) {
  if (!intervention) return ''
  
  const baseTitle = intervention.client_name || 'Unnamed Client'
  const sequence = intervention.sequence_number
  
  if (sequence && sequence > 0) {
    return `${baseTitle} ${formatSequenceNumber(sequence)}`
  }
  
  return baseTitle
}

/**
 * Get base title suggestions from recent reports
 * Returns unique base titles from recent interventions
 * @param {Dexie} db - Database instance
 * @param {number} limit - Maximum number of suggestions (default: 10)
 * @returns {Promise<string[]>} Array of unique base titles
 */
export async function getBaseTitleSuggestions(db, limit = 10) {
  try {
    // Get recent interventions, ordered by date
    const recent = await db.interventions
      .orderBy('date')
      .reverse()
      .limit(50) // Get more to filter for uniqueness
      .toArray()
    
    // Extract unique base titles (client_name)
    const uniqueTitles = new Set()
    for (const intervention of recent) {
      if (intervention.client_name && intervention.client_name.trim()) {
        uniqueTitles.add(intervention.client_name.trim())
        if (uniqueTitles.size >= limit) break
      }
    }
    
    return Array.from(uniqueTitles)
  } catch (error) {
    console.error('Error getting base title suggestions:', error)
    return []
  }
}

