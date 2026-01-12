# Unified Feed Implementation Guide

## Quick Start

This guide provides step-by-step instructions to merge checklists and feeds into a single unified feed.

## Implementation Steps

### Step 1: Run Database Migration

```sql
-- Run in Supabase SQL Editor
-- File: supabase-unified-feed.sql
```

This will:
- Add `feed_items` column
- Migrate `checklist_items` → `feed_items` (type: 'check')
- Migrate `comments` → `feed_items` (type: 'text', 'photo', 'audio')
- Sort by `created_at`

### Step 2: Update Data Structures

**Current:**
- `checklistItems` array
- `feedEntries` array
- `comments` array

**New:**
- `feedItems` array (unified)

### Step 3: Update UI

**Remove:**
- "Checklist" tab
- Separate checklist UI

**Update:**
- "Feed" tab shows all items
- Add type indicators (✓ for checks, 📝 for text, 📷 for photos, 🎤 for audio)
- Add "Add Check" button in feed

### Step 4: Update Save/Load Logic

**Save:**
- Merge all items into `feed_items` array
- Remove `checklist_items` and `comments` columns

**Load:**
- Load from `feed_items` only
- Sort by `created_at`

### Step 5: Update PDF Generation

- Render all items from `feed_items`
- Group by category or type (optional)
- Show type indicators

## Code Changes Summary

### 1. Data Model

**Before:**
```javascript
checklistItems: [
  { id: '1', label: 'Check smoke detector', checked: true, category: 'fire_safety' }
]
feedEntries: [
  { id: '2', type: 'text', text: 'Found leak', category: 'plumbing' }
]
```

**After:**
```javascript
feedItems: [
  { id: '1', type: 'check', text: 'Check smoke detector', checked: true, category: 'fire_safety', created_at: '...' },
  { id: '2', type: 'text', text: 'Found leak', category: 'plumbing', created_at: '...' }
]
```

### 2. UI Component Structure

```vue
<template>
  <!-- Unified Feed Tab -->
  <div v-show="activeTab === 'feed'">
    <!-- Filter buttons (optional) -->
    <div class="flex gap-2 mb-4">
      <button @click="filter = 'all'">All</button>
      <button @click="filter = 'check'">Checks</button>
      <button @click="filter = 'note'">Notes</button>
      <button @click="filter = 'photo'">Photos</button>
    </div>

    <!-- Feed Items -->
    <div v-for="item in filteredFeedItems" :key="item.id">
      <!-- Check Item -->
      <div v-if="item.type === 'check'" class="feed-item check">
        <input type="checkbox" v-model="item.checked" />
        <span>{{ item.text }}</span>
        <span class="category-badge">{{ getCategoryName(item.category) }}</span>
      </div>

      <!-- Text Item -->
      <div v-else-if="item.type === 'text'" class="feed-item text">
        <span>📝</span>
        <span>{{ item.text }}</span>
        <span class="category-badge">{{ getCategoryName(item.category) }}</span>
      </div>

      <!-- Photo Item -->
      <div v-else-if="item.type === 'photo'" class="feed-item photo">
        <span>📷</span>
        <img :src="getPhotoUrl(item.photo_id)" />
        <span>{{ item.text }}</span>
        <span class="category-badge">{{ getCategoryName(item.category) }}</span>
      </div>

      <!-- Audio Item -->
      <div v-else-if="item.type === 'audio'" class="feed-item audio">
        <span>🎤</span>
        <span>{{ item.text }}</span>
        <span class="category-badge">{{ getCategoryName(item.category) }}</span>
      </div>
    </div>

    <!-- Add Item Controls -->
    <div class="feed-input">
      <button @click="addCheckItem">Add Check</button>
      <button @click="addPhotoItem">📷</button>
      <button @click="addAudioItem">🎤</button>
      <input v-model="textInput" @keydown.enter="addTextItem" placeholder="Type a note..." />
    </div>
  </div>
</template>
```

### 3. Save Function

```javascript
async function saveIntervention() {
  // Prepare unified feed items
  const feedItemsData = feedItems.value.map(item => ({
    id: item.id || generateUUID(),
    type: item.type,
    text: item.text || '',
    checked: item.type === 'check' ? item.checked : undefined,
    photo_id: item.photo_id || undefined,
    photo_ids: item.type === 'check' ? (item.photo_ids || []) : undefined,
    transcription: item.transcription || undefined,
    pending_audio_id: item.pending_audio_id || undefined,
    category: item.category || null,
    created_at: item.created_at || new Date().toISOString(),
    status: item.status || 'completed'
  }))

  // Save to IndexedDB
  await db.interventions.update(interventionId, {
    feed_items: feedItemsData
    // Remove: checklist_items, comments
  })
}
```

### 4. Load Function

```javascript
async function loadIntervention() {
  const intervention = await db.interventions.get(interventionId)
  
  // Load unified feed items
  feedItems.value = Array.isArray(intervention.feed_items)
    ? intervention.feed_items.map(item => ({
        id: item.id,
        type: item.type,
        text: item.text || '',
        checked: item.checked,
        photo_id: item.photo_id,
        photo_ids: item.photo_ids || [],
        transcription: item.transcription,
        pending_audio_id: item.pending_audio_id,
        category: item.category,
        created_at: item.created_at,
        status: item.status || 'completed'
      }))
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    : []
}
```

### 5. Add Item Functions

```javascript
function addCheckItem() {
  feedItems.value.push({
    id: generateUUID(),
    type: 'check',
    text: '',
    checked: false,
    photo_ids: [],
    category: selectedCategoryId.value,
    created_at: new Date().toISOString()
  })
  autoSave()
}

function addTextItem() {
  if (!textInput.value.trim()) return
  feedItems.value.push({
    id: generateUUID(),
    type: 'text',
    text: textInput.value.trim(),
    category: selectedCategoryId.value,
    created_at: new Date().toISOString()
  })
  textInput.value = ''
  autoSave()
}
```

### 6. PDF Generation

```javascript
function generatePDF(intervention, feedItems, photos) {
  // Group by category (optional)
  const grouped = {}
  feedItems.forEach(item => {
    const category = item.category || 'other'
    if (!grouped[category]) grouped[category] = []
    grouped[category].push(item)
  })

  // Render by category
  Object.entries(grouped).forEach(([category, items]) => {
    doc.text(category, 14, yPos)
    yPos += 8
    
    items.forEach(item => {
      if (item.type === 'check') {
        doc.text(`[${item.checked ? '✓' : ' '}] ${item.text}`, 14, yPos)
      } else if (item.type === 'text') {
        doc.text(`📝 ${item.text}`, 14, yPos)
      } else if (item.type === 'photo') {
        doc.text(`📷 ${item.text}`, 14, yPos)
      } else if (item.type === 'audio') {
        doc.text(`🎤 ${item.text}`, 14, yPos)
      }
      yPos += 8
    })
  })
}
```

## Migration Checklist

- [ ] Run `supabase-unified-feed.sql` migration
- [ ] Update `InterventionForm.vue` data structures
- [ ] Update `InterventionForm.vue` UI (remove checklist tab, update feed tab)
- [ ] Update save/load functions
- [ ] Update `InterventionDetail.vue` to show unified feed
- [ ] Update `pdf.js` to render unified feed
- [ ] Update sync functions in `supabase.js`
- [ ] Test offline functionality
- [ ] Test sync functionality
- [ ] Test PDF export
- [ ] Verify migration worked (check data in Supabase)

## Testing

1. **Create new intervention:**
   - Add check items
   - Add text notes
   - Add photos
   - Verify all appear in feed

2. **Edit existing intervention:**
   - Load intervention
   - Verify all items load correctly
   - Add new items
   - Save and verify

3. **PDF export:**
   - Generate PDF
   - Verify all items appear
   - Verify grouping works (if enabled)

4. **Sync:**
   - Create items offline
   - Go online
   - Verify sync works
   - Check Supabase data

## Rollback Plan

If issues occur:
1. Don't drop old columns yet
2. Keep both `feed_items` and old columns
3. Fix issues
4. Re-run migration if needed
