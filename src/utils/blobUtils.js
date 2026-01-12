/**
 * Convert a Blob to a data URL for display purposes
 * @param {Blob} blob - The blob to convert
 * @returns {Promise<string>} - Data URL string
 */
export async function blobToDataURL(blob) {
  if (!blob) return null
  
  // If it's already a data URL string, return it (for backward compatibility)
  if (typeof blob === 'string' && blob.startsWith('data:')) {
    return blob
  }
  
  // If it's a Blob, convert to data URL
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Convert a data URL or Blob to a File object
 * @param {string|Blob} source - Data URL string or Blob
 * @param {string} filename - Filename for the File object
 * @param {string} mimeType - MIME type for the File object
 * @returns {Promise<File>} - File object
 */
export async function toFile(source, filename = 'image.jpg', mimeType = 'image/jpeg') {
  if (source instanceof File) {
    return source
  }
  
  if (source instanceof Blob) {
    return new File([source], filename, { type: mimeType })
  }
  
  if (typeof source === 'string' && source.startsWith('data:')) {
    // Convert data URL to Blob, then to File
    const response = await fetch(source)
    const blob = await response.blob()
    return new File([blob], filename, { type: mimeType })
  }
  
  throw new Error('Invalid source type for conversion to File')
}
