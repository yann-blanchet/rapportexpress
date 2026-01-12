# Categories by Trade - Implementation Guide

## Overview

This document describes the implementation of the trade-based category system for inspection items (messages, checks, photos) in RapportExpress.

## Core Principles

✅ **Categories depend on the inspector's trade (job type)**
✅ **Users never create, edit, or delete categories**
✅ **Categories are chosen from a fixed list**
✅ **There is always a default category ("Other")**
✅ **Maximum 4–6 categories per trade**
✅ **Mobile-first, one-tap selection**

## Implementation Details

### 1. Category Definitions (`src/utils/categories.js`)

**Trades Available:**
- Building / Construction
- Electricity
- Fire Safety
- Hygiene / Sanitary
- General (fallback)

**Category Examples by Trade:**

**Building / Construction:**
- Structure
- Walls & Partitions
- Roofing
- Doors & Windows
- Floors & Surfaces
- Other

**Electricity:**
- Wiring & Cables
- Electrical Panels
- Outlets & Switches
- Lighting
- Safety & Compliance
- Other

**Fire Safety:**
- Fire Extinguishers
- Fire Alarms & Detectors
- Emergency Exits
- Safety Signage
- Fire Suppression Systems
- Other

**Hygiene / Sanitary:**
- Sanitation
- Water Systems
- Waste Management
- Ventilation
- Surfaces & Cleaning
- Other

**General:**
- Safety
- Maintenance
- Compliance
- Documentation
- Other

### 2. Trade Selection

**Location:** Settings → Profile Tab

- One-time selection when user first launches the app
- Stored in `localStorage` (offline-first) and synced to Supabase
- Persists across devices when user is authenticated
- Can be changed anytime in Settings
- Defaults to "General" if no trade is selected

**Storage:**
- **Local:** `localStorage.getItem('selectedTrade')` - immediate access, works offline
- **Cloud:** `profiles` table in Supabase - synced when authenticated
- **Fallback:** If not authenticated, uses localStorage only

### 3. Data Model

**Categories are stored in JSONB columns:**
- `interventions.checklist_items[].category` - Category ID for each checklist item
- `interventions.comments[].category` - Category ID for each feed entry (text, photo, audio)

**No database schema changes required** - categories are stored as part of existing JSONB structures.

**Category Field:**
- Type: `string | null`
- Format: Category ID (e.g., "structure", "wiring", "other")
- Default: "other" if not specified

### 4. UX / UI Behavior

#### Trade Selection (First Launch)
1. User opens Settings
2. Selects trade from dropdown in Profile tab
3. Trade is saved to localStorage
4. Categories are immediately available

#### Category Selection (Feed Tab)
1. Category buttons appear above text input area
2. One-tap selection - click a category button to select it
3. Selected category is highlighted (primary color)
4. Last-used category is remembered per trade
5. Default category is "Other" if none selected

#### Category Display
- **Feed Entries:** Category badge appears at top of each entry bubble
- **Checklist Items:** Category badge appears below each checklist item
- **Detail View:** Category badge appears on comments/feed entries

#### Default Behavior
- New entries use last-used category for the trade
- If no last-used category, defaults to "Other"
- Category persists when duplicating entries
- Category is saved automatically with entry

### 5. PDF Output

**Grouped by Category:**
- Checklist items are grouped by category in PDF
- Feed entries are grouped by category in PDF
- Category headers appear as bold section titles
- "Other" category appears last in sorted order

**Format:**
```
Checklist:
Structure:
  ✓ Wall inspection completed
  ☐ Foundation check pending
Wiring & Cables:
  ✓ Electrical panel verified
  ...
```

### 6. Design Rules

✅ **No category management screens** - Categories are fixed
✅ **No free-text tags** - Only predefined categories
✅ **No configuration per report** - Trade is user-level setting
✅ **Always fast and intuitive** - One-tap selection, mobile-optimized
✅ **Offline-safe** - Categories defined in code, no API calls needed
✅ **Scalable** - Easy to add new trades or categories in code

## Files Modified

1. **`src/utils/categories.js`** (NEW)
   - Category definitions by trade
   - Helper functions for category management
   - Trade selection utilities with Supabase sync support

2. **`supabase-user-preferences.sql`** (NEW)
   - Uses `profiles` table in Supabase (created by supabase-profiles.sql)
   - Stores trade selection per user
   - Row-level security policies

2. **`src/views/Settings.vue`**
   - Added trade selection dropdown in Profile tab
   - Trade selection saved to localStorage

3. **`src/views/InterventionForm.vue`**
   - Added category selection buttons above feed input
   - Category badges on feed entries and checklist items
   - Category field added to all entry types (text, photo, audio)
   - Category field added to checklist items

4. **`src/services/pdf.js`**
   - Updated to group checklist items by category
   - Updated to group feed entries by category
   - Category headers in PDF output

5. **`src/views/InterventionDetail.vue`**
   - Category badges displayed on comments/feed entries

## Database Setup

**Required Migration:**
Run `supabase-profiles.sql` in your Supabase SQL Editor to create the `profiles` table (which includes trade storage).

This table stores:
- `user_id` - References auth.users
- `trade` - Selected trade (building, electricity, fire_safety, hygiene, general)
- `created_at` / `updated_at` - Timestamps

## Usage

### For Users

1. **First Time Setup:**
   - Go to Settings → Profile
   - Select your trade from dropdown
   - Save (trade selection is saved to localStorage and synced to Supabase)
   - Trade will persist across devices when authenticated

2. **Adding Inspection Items:**
   - Open Feed tab in intervention form
   - Tap a category button to select it (optional - defaults to last used)
   - Add text, photo, or audio entry
   - Category is automatically assigned

3. **Viewing Categories:**
   - Categories appear as badges on entries
   - PDF exports group items by category

### For Developers

**Adding a New Trade:**
1. Edit `src/utils/categories.js`
2. Add trade constant to `TRADES` object
3. Add display name to `TRADE_NAMES` object
4. Add category list to `CATEGORIES_BY_TRADE` object

**Adding Categories to Existing Trade:**
1. Edit `src/utils/categories.js`
2. Add category object to appropriate trade in `CATEGORIES_BY_TRADE`
3. Ensure "Other" is always last

## Technical Notes

- Categories are stored as simple string IDs (e.g., "structure", "wiring")
- Category names are resolved at display time using `getCategoryName()`
- Last-used category is stored per trade in localStorage
- No database migrations needed - categories are in JSONB
- Backward compatible - existing entries without categories show no badge

## Future Enhancements

Potential improvements (not implemented):
- Category icons/colors
- Category-based filtering in dashboard
- Category statistics
- Export by category
