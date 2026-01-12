# Unified Feed Implementation

## Overview

Merges "checklists" and "feeds" (notes/messages) into a single unified feed. All items (text notes, photos, checklist items) appear in one chronological timeline.

## 1. Data Model

### Unified Feed Items Structure

**Single JSONB column: `feed_items`** (replaces both `checklist_items` and `comments`)

```typescript
interface FeedItem {
  id: string                    // UUID
  type: 'text' | 'photo' | 'check' | 'audio'  // Item type
  created_at: string           // ISO timestamp
  category: string | null       // Category ID (from categories.js)
  
  // Type-specific fields
  text?: string                // For 'text' and 'audio' types
  checked?: boolean            // For 'check' type only
  photo_id?: string            // For 'photo' type (references photos.id)
  photo_ids?: string[]         // For 'check' type (multiple photos)
  transcription?: string        // For 'audio' type
  pending_audio_id?: string    // For 'audio' type (local only, references pending_audio.id)
  status?: 'pending' | 'uploading' | 'transcribing' | 'completed'  // For async operations
}
```

### Examples

**Text Note:**
```json
{
  "id": "uuid-1",
  "type": "text",
  "text": "Found water leak in kitchen",
  "created_at": "2024-01-15T10:30:00Z",
  "category": "plumbing"
}
```

**Checklist Item:**
```json
{
  "id": "uuid-2",
  "type": "check",
  "text": "Check smoke detector",
  "checked": true,
  "created_at": "2024-01-15T10:35:00Z",
  "category": "fire_safety",
  "photo_ids": ["photo-uuid-1", "photo-uuid-2"]
}
```

**Photo Entry:**
```json
{
  "id": "uuid-3",
  "type": "photo",
  "photo_id": "photo-uuid-3",
  "text": "Photo of damaged wall",
  "created_at": "2024-01-15T10:40:00Z",
  "category": "building"
}
```

**Audio Entry:**
```json
{
  "id": "uuid-4",
  "type": "audio",
  "text": "Transcribed audio note",
  "transcription": "Transcribed audio note",
  "created_at": "2024-01-15T10:45:00Z",
  "category": "general",
  "status": "completed"
}
```

### Database Schema

**Supabase:**
```sql
-- Replace checklist_items and comments with single feed_items column
ALTER TABLE interventions 
  DROP COLUMN IF EXISTS checklist_items,
  DROP COLUMN IF EXISTS comments,
  ADD COLUMN IF NOT EXISTS feed_items JSONB DEFAULT '[]'::jsonb;

-- Index for querying
CREATE INDEX IF NOT EXISTS idx_interventions_feed_items 
  ON interventions USING GIN (feed_items);

-- Constraint to ensure it's always an array
ALTER TABLE interventions 
  ADD CONSTRAINT feed_items_is_array 
  CHECK (jsonb_typeof(feed_items) = 'array');
```

**IndexedDB:**
- No schema changes needed (already uses JSONB in interventions)
- Just update the data structure

## 2. UI / UX

### Single Feed Display

**Visual Indicators:**
- ✅ **Check** - Checkbox icon + checked/unchecked state
- 📝 **Text** - Text bubble icon
- 📷 **Photo** - Photo icon + thumbnail
- 🎤 **Audio** - Microphone icon + transcription

**Layout:**
```
┌─────────────────────────────────┐
│  Feed                           │
├─────────────────────────────────┤
│  [✓] Check smoke detector       │
│      Category: Fire Safety      │
│      📷 📷 (2 photos)           │
│                                 │
│  📝 Found water leak in kitchen │
│      Category: Plumbing        │
│                                 │
│  📷 Photo of damaged wall        │
│      [thumbnail]                │
│      Category: Building          │
│                                 │
│  🎤 Audio note transcribed      │
│      Category: General          │
└─────────────────────────────────┘
```

### Filtering (Optional)

**Filter buttons:**
- **All** - Show everything (default)
- **Checks** - Only checklist items
- **Notes** - Only text/audio entries
- **Photos** - Only photo entries

**Implementation:**
```javascript
const filter = ref('all') // 'all' | 'check' | 'note' | 'photo'

const filteredFeed = computed(() => {
  if (filter.value === 'all') return feedItems.value
  if (filter.value === 'check') return feedItems.value.filter(item => item.type === 'check')
  if (filter.value === 'note') return feedItems.value.filter(item => item.type === 'text' || item.type === 'audio')
  if (filter.value === 'photo') return feedItems.value.filter(item => item.type === 'photo')
  return feedItems.value
})
```

### Creating New Items

**Quick Actions:**
1. **Text Note** - Type in input, press Enter
2. **Check Item** - Click "Add Check" button, type label
3. **Photo** - Click camera icon, select photo
4. **Audio** - Click microphone icon, record

**UI:**
```
┌─────────────────────────────────┐
│  [Add Check] [📷] [🎤]          │
│  ┌───────────────────────────┐ │
│  │ Type a note...            │ │
│  └───────────────────────────┘ │
│  [Category: Plumbing ▼]        │
└─────────────────────────────────┘
```

## 3. Offline-First Considerations

### Auto-Save Behavior

**Immediate save:**
- All items saved to IndexedDB immediately
- No "Save" button needed
- Works completely offline

**Sync logic:**
- Items marked with `synced: false` when created/updated
- Auto-sync pushes to Supabase when online
- Conflict resolution: Last write wins (simple for single-user)

### Local Caching

**IndexedDB structure:**
```javascript
// feed_items stored in interventions table as JSONB
{
  id: 'intervention-id',
  feed_items: [
    { id: 'item-1', type: 'text', text: '...', ... },
    { id: 'item-2', type: 'check', text: '...', checked: true, ... }
  ]
}
```

**Cache strategy:**
- Load all feed items on intervention load
- Store in reactive array for UI
- Auto-save on every change
- Sync in background when online

### Sync Logic

**On create:**
1. Add item to local array
2. Save to IndexedDB immediately
3. Mark intervention as `synced: false`
4. Sync to Supabase in background

**On update:**
1. Update item in local array
2. Save to IndexedDB immediately
3. Mark intervention as `synced: false`
4. Sync to Supabase in background

**On sync:**
```javascript
async function syncFeedItems(interventionId) {
  const intervention = await db.interventions.get(interventionId)
  if (!intervention) return
  
  // Upsert intervention with feed_items
  await supabase
    .from('interventions')
    .upsert({
      id: intervention.id,
      feed_items: intervention.feed_items,
      // ... other fields
    })
  
  // Mark as synced
  await db.interventions.update(interventionId, { synced: true })
}
```

## 4. PDF / Report Export

### Rendering Mixed Feed

**Grouping options:**
1. **Chronological** (default) - All items in time order
2. **By Category** - Group by category, then chronological
3. **By Type** - Group by type (checks, notes, photos), then chronological

### PDF Structure

**Chronological (default):**
```
INTERVENTION REPORT
───────────────────

FEED ITEMS
──────────

[✓] Check smoke detector
    Category: Fire Safety
    Status: Completed
    Photos: 2 attached

Found water leak in kitchen
    Category: Plumbing
    Time: 10:30 AM

[Photo] Damaged wall
    Category: Building
    Time: 10:40 AM

[Audio] Audio note transcribed
    Category: General
    Time: 10:45 AM
```

**By Category:**
```
INTERVENTION REPORT
───────────────────

FIRE SAFETY
───────────
[✓] Check smoke detector
    Status: Completed

PLUMBING
────────
Found water leak in kitchen

BUILDING
────────
[Photo] Damaged wall
```

**Icons/Labels:**
- `[✓]` or `[ ]` for checks
- `📝` for text notes
- `📷` for photos
- `🎤` for audio

## 5. Best Practices

### Minimal Complexity

✅ **DO:**
- Single array for all items
- Simple type field to differentiate
- Consistent structure across types
- Clear visual indicators

❌ **DON'T:**
- Separate arrays for different types
- Complex nested structures
- Multiple tables
- Over-engineered type system

### User Experience

**Single source of truth:**
- One feed, one place to look
- Chronological order (most recent first or last)
- Clear visual distinction between types
- Easy filtering if needed

**Mobile-friendly:**
- Large touch targets
- Swipe actions (optional)
- Fast scrolling
- Offline-first (no loading states)

### Scalability

**Future extensions:**
- Add new types easily (e.g., 'video', 'location')
- Extend type-specific fields
- Add metadata without breaking existing items
- Maintain backward compatibility

**Example extension:**
```json
{
  "id": "uuid-5",
  "type": "location",
  "text": "GPS coordinates",
  "latitude": 48.8566,
  "longitude": 2.3522,
  "created_at": "2024-01-15T11:00:00Z",
  "category": "general"
}
```

## Migration Strategy

### Step 1: Database Migration

1. Add `feed_items` column
2. Migrate `checklist_items` → `feed_items` (type: 'check')
3. Migrate `comments` → `feed_items` (type: 'text' or 'photo' or 'audio')
4. Drop old columns after verification

### Step 2: Code Migration

1. Update data structures
2. Update UI components
3. Update sync logic
4. Update PDF generation

### Step 3: Testing

1. Test offline creation
2. Test sync
3. Test PDF export
4. Test filtering
5. Test all item types

## Implementation Checklist

- [ ] Create database migration script
- [ ] Update IndexedDB schema (if needed)
- [ ] Create unified feed component
- [ ] Update InterventionForm to use unified feed
- [ ] Add type indicators (icons)
- [ ] Implement filtering (optional)
- [ ] Update PDF generation
- [ ] Update sync logic
- [ ] Test offline functionality
- [ ] Test sync functionality
- [ ] Test PDF export
- [ ] Migrate existing data
