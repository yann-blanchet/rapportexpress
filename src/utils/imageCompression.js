import imageCompression from 'browser-image-compression'

/**
 * Compress an image file before uploading
 * @param {File} file - The image file to compress
 * @param {Object} options - Compression options
 * @returns {Promise<File>} - Compressed image file
 */
export async function compressImage(file, options = {}) {
  const defaultOptions = {
    maxSizeMB: 1, // Maximum size in MB
    maxWidthOrHeight: 1920, // Maximum width or height
    useWebWorker: true, // Use web worker for better performance
    fileType: 'image/jpeg', // Convert to JPEG for better compression
    initialQuality: 0.8, // Initial quality (0-1)
    ...options
  }

  try {
    // Only compress if file is larger than 500KB
    if (file.size < 500 * 1024) {
      console.log('Image is already small, skipping compression')
      return file
    }

    console.log(`Compressing image: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`)
    
    const compressedFile = await imageCompression(file, defaultOptions)
    
    const compressionRatio = ((1 - compressedFile.size / file.size) * 100).toFixed(1)
    console.log(`Compressed to: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB (${compressionRatio}% reduction)`)
    
    return compressedFile
  } catch (error) {
    console.error('Error compressing image:', error)
    // Return original file if compression fails
    return file
  }
}
