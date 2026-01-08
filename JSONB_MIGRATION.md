# JSONB Migration Guide

## Overview
This migration moves `checklist_items` and `comments` from separate tables to JSONB columns in the `interventions` table. This simplifies the data model and improves performance for offline-first applications.

## What Changed

### Database Schema
- ✅ `interventions` table now has `checklist_items` and `comments` as JSONB columns
- ✅ Old `checklist_items` and `comments` tables are deprecated (can be dropped after migration)
- ✅ RLS policies simplified (no longer needed for separate tables)
- ✅ GIN indexes added for JSONB querying

### Application Code
- ✅ IndexedDB schema updated with migration script
- ✅ All Vue components updated to use JSONB structure
- ✅ Sync functions updated to include JSONB in intervention sync
- ✅ Auto-sync simplified (single operation instead of three)

## Migration Steps

### 1. Run Database Migration
Execute the migration SQL script in your Supabase SQL Editor:

```bash
# Run this file in Supabase SQL Editor:
supabase-migrate-to-jsonb.sql
```

This will:
- Add JSONB columns to `interventions` table
- Migrate existing data from old tables to JSONB
- Create indexes for performance
- Add constraints to ensure data integrity

### 2. Verify Migration
After running the migration, verify the data:

```sql
-- Check that data was migrated correctly
SELECT 
  i.id,
  i.client_name,
  jsonb_array_length(COALESCE(i.checklist_items, '[]'::jsonb)) as checklist_count,
  jsonb_array_length(COALESCE(i.comments, '[]'::jsonb)) as comments_count
FROM interventions i;
```

### 3. Update Application
The application code has already been updated. When users open the app:
- IndexedDB will automatically migrate existing data (version 2 upgrade)
- New data will be stored in JSONB format
- Old separate table data will be migrated on first load

### 4. Optional: Drop Old Tables
After verifying everything works correctly, you can drop the old tables:

```sql
-- WARNING: Only run this after verifying the migration worked!
DROP TABLE IF EXISTS checklist_items CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
```

## Benefits

1. **Simpler Queries**: Single query instead of 3 separate queries
2. **Atomic Updates**: All data updated together
3. **Better Offline Experience**: Single read/write operation
4. **Simpler RLS**: Only need policies for interventions table
5. **Simpler Sync**: One sync operation instead of three

## Data Structure

### Before (Separate Tables)
```javascript
// 3 separate queries
const intervention = await db.interventions.get(id)
const checklistItems = await db.checklist_items.where('intervention_id').equals(id).toArray()
const comments = await db.comments.where('intervention_id').equals(id).toArray()
```

### After (JSONB)
```javascript
// Single query
const intervention = await db.interventions.get(id)
const checklistItems = intervention.checklist_items || []
const comments = intervention.comments || []
```

## Notes

- **Photos remain separate**: Photos are still in a separate table because they're large and stored in Supabase Storage
- **Backward compatibility**: Old sync functions are deprecated but kept for compatibility
- **IndexedDB migration**: Automatic migration happens on first app load after update

## Rollback

If you need to rollback:
1. Restore from backup
2. Revert code changes
3. The old tables still exist (if not dropped)

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify migration SQL ran successfully
3. Check that IndexedDB version upgraded correctly
4. Verify Supabase schema has JSONB columns
