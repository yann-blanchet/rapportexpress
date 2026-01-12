import jsPDF from 'jspdf'
import { getDisplayTitle } from '../utils/sequenceNumber'
import { getSelectedTrade, getCategoryName, TRADES } from '../utils/categories'

export async function generatePDF(intervention, checklistItems, photos, comments) {
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
  
  // Checklist (grouped by category if categories exist)
  if (checklistItems && checklistItems.length > 0) {
    const trade = getSelectedTrade() || TRADES.GENERAL
    const hasCategories = checklistItems.some(item => item.category)
    
    if (hasCategories) {
      // Group by category
      const groupedByCategory = {}
      checklistItems.forEach(item => {
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
      doc.text('Checklist:', 14, yPos)
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
          const checkmark = item.checked ? '✓' : '☐'
          doc.text(`${checkmark} ${item.label}`, 30, yPos)
          yPos += 7
        })
        yPos += 3 // Space between categories
      })
    } else {
      // No categories - display as before
      doc.setFont(undefined, 'bold')
      doc.text('Checklist:', 14, yPos)
      yPos += 8
      
      doc.setFont(undefined, 'normal')
      checklistItems.forEach(item => {
        if (yPos > 280) {
          doc.addPage()
          yPos = 20
        }
        const checkmark = item.checked ? '✓' : '☐'
        doc.text(`${checkmark} ${item.label}`, 20, yPos)
        yPos += 7
      })
    }
    yPos += 5
  }
  
  // Feed Entries / Comments (grouped by category if categories exist)
  if (comments && comments.length > 0) {
    // Filter to only feed entries (with type field)
    const feedEntries = comments.filter(c => c.type)
    const hasCategories = feedEntries.some(entry => entry.category)
    
    if (hasCategories && feedEntries.length > 0) {
      const trade = getSelectedTrade() || TRADES.GENERAL
      
      // Group by category
      const groupedByCategory = {}
      feedEntries.forEach(entry => {
        const categoryId = entry.category || 'other'
        const categoryName = getCategoryName(categoryId, trade)
        if (!groupedByCategory[categoryName]) {
          groupedByCategory[categoryName] = []
        }
        groupedByCategory[categoryName].push(entry)
      })
      
      // Sort categories (put "Other" last)
      const sortedCategories = Object.keys(groupedByCategory).sort((a, b) => {
        if (a === 'Other') return 1
        if (b === 'Other') return -1
        return a.localeCompare(b)
      })
      
      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }
      
      doc.setFont(undefined, 'bold')
      doc.text('Feed Entries:', 14, yPos)
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
        
        // Entries in this category
        doc.setFont(undefined, 'normal')
        groupedByCategory[categoryName].forEach(entry => {
          if (yPos > 280) {
            doc.addPage()
            yPos = 20
          }
          
          let entryText = ''
          if (entry.type === 'text' && entry.text) {
            entryText = entry.text
          } else if (entry.type === 'photo') {
            entryText = '[Photo]'
          } else if (entry.type === 'audio' && entry.transcription) {
            entryText = entry.transcription
          }
          
          if (entryText) {
            const lines = doc.splitTextToSize(entryText, 170)
            doc.text(lines, 30, yPos)
            yPos += lines.length * 7 + 3
          }
        })
        yPos += 3 // Space between categories
      })
    } else {
      // No categories or old format - display as before
      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }
      
      doc.setFont(undefined, 'bold')
      doc.text('Comments:', 14, yPos)
      yPos += 8
      
      doc.setFont(undefined, 'normal')
      comments.forEach(comment => {
        if (yPos > 280) {
          doc.addPage()
          yPos = 20
        }
        const text = comment.text || comment.transcription || ''
        if (text) {
          const lines = doc.splitTextToSize(text, 180)
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
