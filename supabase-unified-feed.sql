-- Migration: Unified Feed - Merge checklist_items and comments into feed_items
-- Run this SQL in your Supabase SQL Editor
--
-- This migration:
-- 1. Adds feed_items column (unified feed)
-- 2. Migrates checklist_items to feed_items (type: 'check')
-- 3. Migrates comments to feed_items (type: 'text', 'photo', 'audio')
-- 4. Drops old columns after migration

-- Step 1: Add feed_items column
ALTER TABLE interventions 
  ADD COLUMN IF NOT EXISTS feed_items JSONB DEFAULT '[]'::jsonb;

-- Step 2: Migrate checklist_items to feed_items
-- Convert each checklist item to a feed item with type 'check'
UPDATE interventions i
SET feed_items = COALESCE(
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', COALESCE(ci->>'id', gen_random_uuid()::text),
        'type', 'check',
        'text', ci->>'label',
        'checked', COALESCE((ci->>'checked')::boolean, false),
        'photo_ids', COALESCE(ci->'photo_ids', '[]'::jsonb),
        'category', ci->>'category',
        'created_at', COALESCE(ci->>'created_at', NOW()::text)
      )
    )
    FROM jsonb_array_elements(i.checklist_items) AS ci
    WHERE i.checklist_items IS NOT NULL 
      AND jsonb_typeof(i.checklist_items) = 'array'
  ),
  '[]'::jsonb
)
WHERE i.checklist_items IS NOT NULL 
  AND jsonb_typeof(i.checklist_items) = 'array'
  AND jsonb_array_length(i.checklist_items) > 0;

-- Step 3: Migrate comments to feed_items
-- Convert each comment to a feed item (type determined by content)
UPDATE interventions i
SET feed_items = feed_items || COALESCE(
  (
    SELECT jsonb_agg(
      CASE
        -- Audio entry (has transcription or pending_audio_id)
        WHEN (c->>'transcription' IS NOT NULL OR c->>'pending_audio_id' IS NOT NULL) THEN
          jsonb_build_object(
            'id', COALESCE(c->>'id', gen_random_uuid()::text),
            'type', 'audio',
            'text', c->>'text',
            'transcription', c->>'transcription',
            'pending_audio_id', c->>'pending_audio_id',
            'status', COALESCE(c->>'status', 'completed'),
            'category', c->>'category',
            'created_at', COALESCE(c->>'created_at', NOW()::text)
          )
        -- Photo entry (has photo_id)
        WHEN c->>'photo_id' IS NOT NULL THEN
          jsonb_build_object(
            'id', COALESCE(c->>'id', gen_random_uuid()::text),
            'type', 'photo',
            'photo_id', c->>'photo_id',
            'text', c->>'text',
            'category', c->>'category',
            'created_at', COALESCE(c->>'created_at', NOW()::text)
          )
        -- Text entry (default)
        ELSE
          jsonb_build_object(
            'id', COALESCE(c->>'id', gen_random_uuid()::text),
            'type', 'text',
            'text', c->>'text',
            'category', c->>'category',
            'created_at', COALESCE(c->>'created_at', NOW()::text)
          )
      END
    )
    FROM jsonb_array_elements(i.comments) AS c
    WHERE i.comments IS NOT NULL 
      AND jsonb_typeof(i.comments) = 'array'
  ),
  '[]'::jsonb
)
WHERE i.comments IS NOT NULL 
  AND jsonb_typeof(i.comments) = 'array'
  AND jsonb_array_length(i.comments) > 0;

-- Step 4: Sort feed_items by created_at (chronological order)
UPDATE interventions i
SET feed_items = (
  SELECT jsonb_agg(item ORDER BY (item->>'created_at'))
  FROM jsonb_array_elements(i.feed_items) AS item
)
WHERE i.feed_items IS NOT NULL 
  AND jsonb_typeof(i.feed_items) = 'array'
  AND jsonb_array_length(i.feed_items) > 0;

-- Step 5: Create index for feed_items
CREATE INDEX IF NOT EXISTS idx_interventions_feed_items 
  ON interventions USING GIN (feed_items);

-- Step 6: Add constraint to ensure feed_items is always an array
ALTER TABLE interventions 
  ADD CONSTRAINT feed_items_is_array 
  CHECK (jsonb_typeof(feed_items) = 'array');

-- Step 7: Verify migration
-- Check that feed_items contains data from both checklist_items and comments
DO $$
DECLARE
  checklist_count INTEGER;
  comments_count INTEGER;
  feed_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO checklist_count
  FROM interventions
  WHERE checklist_items IS NOT NULL 
    AND jsonb_typeof(checklist_items) = 'array'
    AND jsonb_array_length(checklist_items) > 0;
  
  SELECT COUNT(*) INTO comments_count
  FROM interventions
  WHERE comments IS NOT NULL 
    AND jsonb_typeof(comments) = 'array'
    AND jsonb_array_length(comments) > 0;
  
  SELECT COUNT(*) INTO feed_count
  FROM interventions
  WHERE feed_items IS NOT NULL 
    AND jsonb_typeof(feed_items) = 'array'
    AND jsonb_array_length(feed_items) > 0;
  
  RAISE NOTICE 'Migration summary:';
  RAISE NOTICE '  Interventions with checklist_items: %', checklist_count;
  RAISE NOTICE '  Interventions with comments: %', comments_count;
  RAISE NOTICE '  Interventions with feed_items: %', feed_count;
END $$;

-- Step 8: Drop old columns (COMMENTED OUT FOR SAFETY - uncomment after verification)
-- Uncomment these lines ONLY after you've verified the migration worked correctly
-- ALTER TABLE interventions DROP COLUMN IF EXISTS checklist_items;
-- ALTER TABLE interventions DROP COLUMN IF EXISTS comments;
-- DROP INDEX IF EXISTS idx_interventions_checklist_items;
-- DROP INDEX IF EXISTS idx_interventions_comments;
