import jsPDF from 'jspdf'
import { getDisplayTitle } from '../utils/sequenceNumber'
import { getSelectedTrade, getCategoryName, TRADES } from '../utils/categories'

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
  
  // Photos note
  if (photos && photos.length > 0) {
    if (yPos > 270) {
      doc.addPage()
      yPos = 20
    }
    doc.setFont(undefined, 'bold')
    doc.text(`Photos: ${photos.length} photo(s) attached`, 14, yPos)
    doc.setFont(undefined, 'normal')
    doc.text('(Photos are stored separately and can be viewed in the application)', 14, yPos + 8)
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
