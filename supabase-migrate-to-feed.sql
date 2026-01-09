-- Migration: Convert existing photos and comments to unified feed structure
-- Note: Audio stays local-only (no audio table in Supabase)
-- Audio transcriptions are stored in comments JSONB as audio entries

-- Step 1: Convert existing photos to photo entries in comments
UPDATE interventions i
SET comments = COALESCE(comments, '[]'::jsonb) || (
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', gen_random_uuid(),
      'type', 'photo',
      'photo_id', p.id,
      'tags', '[]'::jsonb,
      'created_at', p.taken_at,
      'status', CASE 
        WHEN p.url_cloud IS NOT NULL THEN 'completed'
        WHEN p.url_local IS NOT NULL THEN 'uploading'
        ELSE 'pending'
      END
    )
    ORDER BY p.taken_at
  )
  FROM photos p
  WHERE p.intervention_id = i.id
);

-- Step 2: Convert existing text comments to text entries (if they're not already in the new format)
UPDATE interventions i
SET comments = (
  SELECT jsonb_agg(
    CASE 
      -- If already in new format (has 'type' field), keep as is
      WHEN entry->>'type' IS NOT NULL THEN entry
      -- Otherwise convert old format to new format
      ELSE jsonb_build_object(
        'id', COALESCE(entry->>'id', gen_random_uuid()::text),
        'type', 'text',
        'text', COALESCE(entry->>'text', ''),
        'tags', COALESCE(entry->'tags', '[]'::jsonb),
        'created_at', COALESCE(entry->>'created_at', NOW()::text)
      )
    END
    ORDER BY COALESCE((entry->>'created_at')::timestamptz, NOW())
  )
  FROM jsonb_array_elements(COALESCE(i.comments, '[]'::jsonb)) entry
);

-- Step 3: Ensure all entries have required fields
UPDATE interventions i
SET comments = (
  SELECT jsonb_agg(
    entry || jsonb_build_object(
      'id', COALESCE(entry->>'id', gen_random_uuid()::text),
      'type', COALESCE(entry->>'type', 'text'),
      'tags', COALESCE(entry->'tags', '[]'::jsonb),
      'created_at', COALESCE(entry->>'created_at', NOW()::text)
    )
  )
  FROM jsonb_array_elements(COALESCE(i.comments, '[]'::jsonb)) entry
)
WHERE comments IS NOT NULL;

-- Step 4: Verify migration
-- You can run this to check the structure:
-- SELECT id, jsonb_pretty(comments) FROM interventions LIMIT 1;
