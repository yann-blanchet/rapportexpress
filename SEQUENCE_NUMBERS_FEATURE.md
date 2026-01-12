# Sequence Numbers Feature Documentation

## Overview

The Sequence Numbers feature allows users to create similar reports quickly without retyping the base title. Each report has a base title (e.g., "Inspection Usine ABC") and an auto-incremented sequence number (e.g., #001, #002), displayed as "Inspection Usine ABC #001".

## Core Design Principles

1. ✅ **Zero Friction**: One-tap creation of similar reports
2. ✅ **Fully Offline**: Sequence numbers computed locally, no network required
3. ✅ **Mobile-First**: Simple, fast UI optimized for field use
4. ✅ **No Conflicts**: Automatic sequence computation prevents duplicates
5. ✅ **Backward Compatible**: Existing reports work without sequence numbers

## Data Model

### Database Schema

#### Supabase (PostgreSQL)

```sql
-- Add sequence_number column (nullable for backward compatibility)
ALTER TABLE interventions 
ADD COLUMN sequence_number INTEGER;

-- Create index for efficient queries
CREATE INDEX idx_interventions_client_name_sequence 
ON interventions(client_name, sequence_number);
```

#### IndexedDB (Dexie)

```javascript
// Version 5: Added sequence_number
interventions: 'id, client_name, date, status, created_at, updated_at, synced, user_id, sequence_number'
```

### Data Structure

- **`client_name`**: Base title (e.g., "Inspection Usine ABC")
- **`sequence_number`**: Integer (1, 2, 3, ...) - nullable for old reports
- **Display Format**: "Base Title #001" when sequence exists, "Base Title" otherwise

## UX / UI Flow

### 1. Create Similar Report

**From Dashboard:**
- Click 3-dot menu on any report → "Create Similar" button
- Or long-press report → Context menu → "Create Similar"

**From Report Detail:**
- Bottom action bar → "Create Similar" button (primary action)

**Result:**
- New report created instantly
- Same base title as source report
- Next sequence number auto-assigned (#002, #003, etc.)
- Empty report body (fresh start)
- Navigates to edit page immediately

### 2. Standard Report Creation

**New Report Flow:**
- Click "+" button → Create New Report
- Base title input with autocomplete suggestions
- Type to see recent base titles
- Click suggestion or type new title
- Sequence number auto-computed on save

**Autocomplete:**
- Shows 10 most recent unique base titles
- Filters as you type
- One-click selection

## Numbering Logic

### Algorithm

```javascript
async function getNextSequenceNumber(db, baseTitle) {
  // 1. Find all reports with same base title
  const similarReports = await db.interventions
    .where('client_name')
    .equals(baseTitle.trim())
    .toArray()
  
  // 2. Find maximum sequence number
  const maxSequence = similarReports.reduce((max, report) => {
    const seq = report.sequence_number || 1
    return Math.max(max, seq)
  }, 0)
  
  // 3. Return next sequence
  return maxSequence + 1
}
```

### Features

- **Offline-First**: Queries local IndexedDB, no network needed
- **Conflict-Free**: Always increments from maximum, no gaps
- **Backward Compatible**: Old reports without sequence_number default to 1
- **Format**: Displays as #001, #002, #003 (3-digit zero-padded)

### Edge Cases

- **No existing reports**: Returns 1 (first report)
- **Missing sequence_number**: Treated as 1 for max calculation
- **Empty base title**: Returns 1 (fallback)

## Display Format

### Reports with Sequence Numbers

```
Inspection Usine ABC #001
Inspection Usine ABC #002
Inspection Usine ABC #003
```

### Reports without Sequence Numbers (Old Reports)

```
Inspection Usine ABC
```

### UI Locations

- **Dashboard**: Report list shows full title with sequence
- **InterventionForm**: Header shows full title when editing
- **InterventionDetail**: Header shows full title
- **PDF**: Client/Site field shows full title with sequence

## Safety & UX Rules

### Sequence Number

- ✅ **Not Editable**: Sequence number is read-only, auto-generated
- ✅ **Auto-Computed**: Calculated on save for new reports
- ✅ **Preserved on Edit**: Existing sequence numbers never change
- ✅ **Display Only**: Shown as badge, not in form input

### Base Title

- ✅ **Editable**: Can be changed when editing report
- ✅ **Autocomplete**: Smart suggestions from recent reports
- ✅ **Rarely Changed**: Optimized for field use (minimal typing)

### Create Similar

- ✅ **One-Tap**: Single button click creates new report
- ✅ **Instant**: No confirmation dialogs
- ✅ **Empty Body**: Fresh report, no copied content
- ✅ **Auto-Navigate**: Goes directly to edit page

## Code Examples

### Creating a Similar Report

```javascript
// In Dashboard.vue or InterventionDetail.vue
async function createSimilarIntervention(intervention) {
  const baseTitle = intervention.client_name || 'Unnamed Client'
  const nextSequence = await getNextSequenceNumber(db, baseTitle)
  
  const newIntervention = {
    id: generateUUID(),
    client_name: baseTitle, // Same base title
    sequence_number: nextSequence, // Next sequence
    date: new Date().toISOString(),
    status: 'In Progress',
    // ... other fields
    checklist_items: [], // Empty
    comments: [] // Empty
  }
  
  await db.interventions.put(newIntervention)
  router.push(`/interventions/${newIntervention.id}/edit`)
}
```

### Computing Next Sequence

```javascript
// In InterventionForm.vue (saveInterventionLocal)
if (!existingIntervention) {
  // New report - compute sequence
  const sequenceNumber = await getNextSequenceNumber(db, form.value.client_name.trim())
  intervention.sequence_number = sequenceNumber
}
```

### Displaying with Sequence

```javascript
// In Dashboard.vue
import { getDisplayTitle } from '../utils/sequenceNumber'

// In template
<h3>{{ getDisplayTitle(intervention) }}</h3>
// Output: "Inspection Usine ABC #001"
```

### Base Title Autocomplete

```javascript
// In InterventionForm.vue
async function loadBaseTitleSuggestions() {
  baseTitleSuggestions.value = await getBaseTitleSuggestions(db, 10)
}

function selectBaseTitle(title) {
  form.value.client_name = title
  // Sequence will be computed on save
}
```

## Migration Guide

### Step 1: Run Database Migration

Execute `supabase-sequence-numbers.sql` in your Supabase SQL Editor:

```sql
-- This will:
-- 1. Add sequence_number column (nullable)
-- 2. Create index for efficient queries
-- 3. Set default sequence_number = 1 for existing reports
```

### Step 2: Update Application

The application code is already updated. When users open the app:
- IndexedDB will automatically migrate to version 5 (adds sequence_number)
- Existing reports will have `sequence_number = 1` (default)
- New reports will auto-compute sequence numbers

### Step 3: Verify

1. Create a new report with base title "Test Site"
2. Click "Create Similar" on that report
3. Verify new report shows "Test Site #002"
4. Check Dashboard displays sequence numbers

## Best Practices

1. **Use Base Titles Consistently**: Same spelling = same sequence group
2. **Don't Edit Sequence Numbers**: They're auto-managed
3. **Use Create Similar**: Faster than typing base title again
4. **Leverage Autocomplete**: Saves typing for repeat sites

## Troubleshooting

### Sequence Numbers Not Showing
- Check if `sequence_number` field exists in database
- Verify IndexedDB version 5 migration completed
- Check browser console for errors

### Wrong Sequence Numbers
- Sequence is computed from local database
- If reports exist in cloud but not local, sequence may be off
- Sync will correct this over time

### Autocomplete Not Working
- Check if `getBaseTitleSuggestions` is called on mount
- Verify recent reports exist in database
- Check browser console for errors

## Summary

The Sequence Numbers feature provides:
- ✅ One-tap similar report creation
- ✅ Auto-incremented sequence numbers (#001, #002, ...)
- ✅ Base title autocomplete for fast entry
- ✅ Fully offline operation
- ✅ Zero friction for repeat inspections
- ✅ Simple, mobile-first design
- ✅ Backward compatible with existing reports

All requirements are met: reports work without sequences, numbering is automatic, and the UI is optimized for speed and simplicity on mobile devices.

