import jsPDF from 'jspdf'
import { getDisplayTitle } from '../utils/sequenceNumber'
import { getSelectedTrade, getCategoryName, TRADES } from '../utils/categories'
import { blobToDataURL } from '../utils/blobUtils'

export async function generatePDF(intervention, feedItems, photos) {
  const doc = new jsPDF()
  
  // Header
  doc.setFontSize(20)
  doc.text('Intervention Report', 14, 20)
  
  // Intervention details
  doc.setFontSize(12)
  let yPos = 35
  
  doc.setFont(undefined, 'bold')
  doc.text('Client/Site:', 14, yPos)
  doc.setFont(undefined, 'normal')
  // Use display title which includes sequence number if present
  doc.text(getDisplayTitle(intervention) || 'N/A', 50, yPos)
  yPos += 8
  
  doc.setFont(undefined, 'bold')
  doc.text('Date & Time:', 14, yPos)
  doc.setFont(undefined, 'normal')
  doc.text(new Date(intervention.date).toLocaleString(), 50, yPos)
  yPos += 8
  
  doc.setFont(undefined, 'bold')
  doc.text('Status:', 14, yPos)
  doc.setFont(undefined, 'normal')
  doc.text(intervention.status || 'N/A', 50, yPos)
  yPos += 15
  
  // Unified Feed Items (grouped by category if categories exist)
  if (feedItems && feedItems.length > 0) {
    const trade = getSelectedTrade() || TRADES.GENERAL
    const hasCategories = feedItems.some(item => item.category)
    
    if (hasCategories) {
      // Group by category
      const groupedByCategory = {}
      feedItems.forEach(item => {
        const categoryId = item.category || 'other'
        const categoryName = getCategoryName(categoryId, trade)
        if (!groupedByCategory[categoryName]) {
          groupedByCategory[categoryName] = []
        }
        groupedByCategory[categoryName].push(item)
      })
      
      // Sort categories (put "Other" last)
      const sortedCategories = Object.keys(groupedByCategory).sort((a, b) => {
        if (a === 'Other') return 1
        if (b === 'Other') return -1
        return a.localeCompare(b)
      })
      
      doc.setFont(undefined, 'bold')
      doc.text('Feed Items:', 14, yPos)
      yPos += 8
      
      doc.setFont(undefined, 'normal')
      sortedCategories.forEach(categoryName => {
        if (yPos > 270) {
          doc.addPage()
          yPos = 20
        }
        
        // Category header
        doc.setFont(undefined, 'bold')
        doc.text(`${categoryName}:`, 20, yPos)
        yPos += 7
        
        // Items in this category
        doc.setFont(undefined, 'normal')
        groupedByCategory[categoryName].forEach(item => {
          if (yPos > 280) {
            doc.addPage()
            yPos = 20
          }
          
          let itemText = ''
          if (item.type === 'text' && item.text) {
            itemText = `📝 ${item.text}`
            if (item.compliance && item.compliance !== 'na') {
              const complianceLabel = item.compliance === 'compliant' ? '✓ Compliant' : '✗ Not Compliant'
              itemText += ` [${complianceLabel}]`
            }
          } else if (item.type === 'photo') {
            itemText = '📷 [Photo]'
            if (item.compliance && item.compliance !== 'na') {
              const complianceLabel = item.compliance === 'compliant' ? '✓ Compliant' : '✗ Not Compliant'
              itemText += ` [${complianceLabel}]`
            }
          } else if (item.type === 'audio' && item.transcription) {
            itemText = `🎤 ${item.transcription}`
            if (item.compliance && item.compliance !== 'na') {
              const complianceLabel = item.compliance === 'compliant' ? '✓ Compliant' : '✗ Not Compliant'
              itemText += ` [${complianceLabel}]`
            }
          }
          
          if (itemText) {
            const lines = doc.splitTextToSize(itemText, 170)
            doc.text(lines, 30, yPos)
            yPos += lines.length * 7 + 3
          }
        })
        yPos += 3 // Space between categories
      })
    } else {
      // No categories - display chronologically
      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }
      
      doc.setFont(undefined, 'bold')
      doc.text('Feed Items:', 14, yPos)
      yPos += 8
      
      doc.setFont(undefined, 'normal')
      feedItems.forEach(item => {
        if (yPos > 280) {
          doc.addPage()
          yPos = 20
        }
        
        let itemText = ''
        if (item.type === 'text' && item.text) {
          itemText = `📝 ${item.text}`
          if (item.compliance && item.compliance !== 'na') {
            const complianceLabel = item.compliance === 'compliant' ? '✓ Compliant' : '✗ Not Compliant'
            itemText += ` [${complianceLabel}]`
          }
        } else if (item.type === 'photo') {
          itemText = '📷 [Photo]'
          if (item.text) {
            itemText += ` - ${item.text}`
          }
        } else if (item.type === 'audio' && item.transcription) {
          itemText = `🎤 ${item.transcription}`
        }
        
        if (itemText) {
          const lines = doc.splitTextToSize(itemText, 180)
          doc.text(lines, 20, yPos)
          yPos += lines.length * 7 + 3
        }
      })
    }
    yPos += 5
  }
  
  // Observations
  if (intervention.observations) {
    if (yPos > 270) {
      doc.addPage()
      yPos = 20
    }
    doc.setFont(undefined, 'bold')
    doc.text('Observations:', 14, yPos)
    yPos += 8
    doc.setFont(undefined, 'normal')
    const observationsLines = doc.splitTextToSize(intervention.observations, 170)
    doc.text(observationsLines, 14, yPos)
    yPos += observationsLines.length * 7 + 10
  }
  
  // Conclusion
  if (intervention.conclusion) {
    if (yPos > 270) {
      doc.addPage()
      yPos = 20
    }
    doc.setFont(undefined, 'bold')
    doc.text('Conclusion:', 14, yPos)
    yPos += 8
    doc.setFont(undefined, 'normal')
    const conclusionLines = doc.splitTextToSize(intervention.conclusion, 170)
    doc.text(conclusionLines, 14, yPos)
    yPos += conclusionLines.length * 7 + 10
  }
  
  // Photos section - embed actual images
  if (photos && photos.length > 0) {
    if (yPos > 250) {
      doc.addPage()
      yPos = 20
    }
    
    doc.setFont(undefined, 'bold')
    doc.text(`Photos (${photos.length}):`, 14, yPos)
    yPos += 10
    
    doc.setFont(undefined, 'normal')
    
    // Process each photo
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i]
      
      // Check if we need a new page
      if (yPos > 200) {
        doc.addPage()
        yPos = 20
      }
      
      try {
        // Get photo data URL
        let imageData = null
        
        // Try cloud URL first
        if (photo.url_cloud) {
          // For cloud URLs, we'd need to fetch and convert, but for now use local
          // In a production app, you might want to fetch cloud images
          imageData = null
        }
        
        // Try local Blob or data URL
        if (!imageData && photo.url_local) {
          if (photo.url_local instanceof Blob) {
            // Convert Blob to data URL
            imageData = await blobToDataURL(photo.url_local)
          } else if (typeof photo.url_local === 'string' && photo.url_local.startsWith('data:')) {
            // Already a data URL
            imageData = photo.url_local
          }
        }
        
        if (imageData) {
          // Calculate image dimensions to fit page width (max 180mm width, leave margins)
          const maxWidthMM = 180 // mm (page width is 210mm, leave 14mm margins on each side)
          const maxHeightMM = 120 // mm (to leave room for text and next images)
          
          // Create an image element to get dimensions
          const img = new Image()
          await new Promise((resolve, reject) => {
            img.onload = resolve
            img.onerror = reject
            img.src = imageData
          })
          
          // Get image dimensions in pixels
          const imgWidthPx = img.width
          const imgHeightPx = img.height
          const aspectRatio = imgWidthPx / imgHeightPx
          
          // Calculate dimensions in mm (jsPDF uses mm as default unit)
          // Convert pixels to mm: 1 inch = 25.4mm, assuming 96 DPI: 1px = 25.4/96 mm ≈ 0.264mm
          let widthMM = imgWidthPx * 0.264
          let heightMM = imgHeightPx * 0.264
          
          // Scale down if too large, maintaining aspect ratio
          if (widthMM > maxWidthMM) {
            widthMM = maxWidthMM
            heightMM = widthMM / aspectRatio
          }
          
          if (heightMM > maxHeightMM) {
            heightMM = maxHeightMM
            widthMM = heightMM * aspectRatio
          }
          
          // Add image to PDF
          // Determine image format from data URL or file type
          const format = imageData.includes('data:image/png') ? 'PNG' : 'JPEG'
          doc.addImage(imageData, format, 14, yPos, widthMM, heightMM)
          
          // Add photo description if available
          if (photo.description) {
            yPos += heightMM + 3
            const descLines = doc.splitTextToSize(photo.description, 180)
            doc.setFontSize(9)
            doc.text(descLines, 14, yPos)
            yPos += descLines.length * 4 + 5
          } else {
            yPos += heightMM + 5
          }
        } else {
          // Fallback: show text if image can't be loaded
          doc.text(`Photo ${i + 1}: [Image unavailable]`, 14, yPos)
          yPos += 7
        }
      } catch (error) {
        console.error(`[PDF] Error adding photo ${i + 1}:`, error)
        // Fallback: show text
        doc.text(`Photo ${i + 1}: [Error loading image]`, 14, yPos)
        yPos += 7
      }
    }
  }
  
  // Footer
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(10)
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    )
  }
  
  return doc
}
