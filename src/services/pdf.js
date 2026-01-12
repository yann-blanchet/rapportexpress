import jsPDF from 'jspdf'
import { getDisplayTitle } from '../utils/sequenceNumber'

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
  
  // Checklist
  if (checklistItems && checklistItems.length > 0) {
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
    yPos += 5
  }
  
  // Comments
  if (comments && comments.length > 0) {
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
      const lines = doc.splitTextToSize(comment.text || '', 180)
      doc.text(lines, 20, yPos)
      yPos += lines.length * 7 + 3
    })
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
