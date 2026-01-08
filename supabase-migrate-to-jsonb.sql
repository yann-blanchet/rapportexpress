-- Migration: Move checklist_items and comments to JSONB columns in interventions table
-- Run this SQL in your Supabase SQL Editor

-- Step 1: Add JSONB columns to interventions table
ALTER TABLE interventions 
ADD COLUMN IF NOT EXISTS checklist_items JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS comments JSONB DEFAULT '[]'::jsonb;

-- Step 2: Migrate existing checklist_items data
UPDATE interventions i
SET checklist_items = COALESCE(
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', ci.id,
        'label', ci.label,
        'checked', ci.checked,
        'photo_ids', COALESCE(to_jsonb(ci.photo_ids), '[]'::jsonb)
      )
    )
    FROM checklist_items ci
    WHERE ci.intervention_id = i.id
  ),
  '[]'::jsonb
);

-- Step 3: Migrate existing comments data
UPDATE interventions i
SET comments = COALESCE(
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', c.id,
        'text', c.text,
        'created_at', c.created_at
      )
      ORDER BY c.created_at
    )
    FROM comments c
    WHERE c.intervention_id = i.id
  ),
  '[]'::jsonb
);

-- Step 4: Create indexes for JSONB columns (for querying)
CREATE INDEX IF NOT EXISTS idx_interventions_checklist_items 
ON interventions USING GIN (checklist_items);

CREATE INDEX IF NOT EXISTS idx_interventions_comments 
ON interventions USING GIN (comments);

-- Step 5: Add constraints to ensure JSONB columns are always arrays
ALTER TABLE interventions 
ADD CONSTRAINT checklist_items_is_array 
CHECK (jsonb_typeof(checklist_items) = 'array');

ALTER TABLE interventions 
ADD CONSTRAINT comments_is_array 
CHECK (jsonb_typeof(comments) = 'array');

-- Step 6: Update RLS policies (remove policies for checklist_items and comments tables)
-- Note: We keep the tables for now in case of rollback, but they won't be used
-- You can drop them later after verifying the migration worked

-- Step 7: Optional - Drop old tables after verification (COMMENTED OUT FOR SAFETY)
-- Uncomment these lines ONLY after you've verified the migration worked correctly
-- DROP TABLE IF EXISTS checklist_items CASCADE;
-- DROP TABLE IF EXISTS comments CASCADE;

-- Verification query: Check that all data was migrated
-- SELECT 
--   i.id,
--   i.client_name,
--   jsonb_array_length(COALESCE(i.checklist_items, '[]'::jsonb)) as checklist_count,
--   jsonb_array_length(COALESCE(i.comments, '[]'::jsonb)) as comments_count,
--   (SELECT COUNT(*) FROM checklist_items ci WHERE ci.intervention_id = i.id) as old_checklist_count,
--   (SELECT COUNT(*) FROM comments c WHERE c.intervention_id = i.id) as old_comments_count
-- FROM interventions i;
