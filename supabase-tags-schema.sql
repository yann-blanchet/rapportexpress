-- Migration: Create shared tags system
-- Run this SQL in your Supabase SQL Editor

-- Step 1: Create tags table (shared tags across all interventions)
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#3b82f6', -- Default blue color for badges
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NULL
);

-- Step 2: Create intervention_tags junction table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS intervention_tags (
  intervention_id UUID NOT NULL REFERENCES interventions(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (intervention_id, tag_id)
);

-- Step 3: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_intervention_tags_intervention_id ON intervention_tags(intervention_id);
CREATE INDEX IF NOT EXISTS idx_intervention_tags_tag_id ON intervention_tags(tag_id);

-- Step 4: Enable Row Level Security (RLS)
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE intervention_tags ENABLE ROW LEVEL SECURITY;

-- Step 5: RLS Policies for tags table
CREATE POLICY "Users can view all tags or tags without user_id"
  ON tags FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own tags or tags without user_id"
  ON tags FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own tags or tags without user_id"
  ON tags FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own tags or tags without user_id"
  ON tags FOR DELETE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Step 6: RLS Policies for intervention_tags table
CREATE POLICY "Users can view intervention_tags for their interventions or unassigned"
  ON intervention_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM interventions
      WHERE interventions.id = intervention_tags.intervention_id
      AND (interventions.user_id = auth.uid() OR interventions.user_id IS NULL)
    )
  );

CREATE POLICY "Users can insert intervention_tags for their interventions or unassigned"
  ON intervention_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM interventions
      WHERE interventions.id = intervention_tags.intervention_id
      AND (interventions.user_id = auth.uid() OR interventions.user_id IS NULL)
    )
  );

CREATE POLICY "Users can delete intervention_tags for their interventions or unassigned"
  ON intervention_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM interventions
      WHERE interventions.id = intervention_tags.intervention_id
      AND (interventions.user_id = auth.uid() OR interventions.user_id IS NULL)
    )
  );

-- Step 7: Migrate existing tags from interventions.tags JSONB column (if any)
-- This will create tags from existing intervention tags and link them
DO $$
DECLARE
  intervention_record RECORD;
  tag_name TEXT;
  tag_id_val UUID;
BEGIN
  FOR intervention_record IN 
    SELECT id, tags FROM interventions WHERE tags IS NOT NULL AND jsonb_array_length(tags) > 0
  LOOP
    FOR tag_name IN 
      SELECT jsonb_array_elements_text(intervention_record.tags)
    LOOP
      -- Check if tag already exists
      SELECT id INTO tag_id_val FROM tags WHERE name = tag_name LIMIT 1;
      
      -- Create tag if it doesn't exist
      IF tag_id_val IS NULL THEN
        INSERT INTO tags (name, user_id)
        VALUES (tag_name, (SELECT user_id FROM interventions WHERE id = intervention_record.id))
        ON CONFLICT (name) DO UPDATE SET name = tags.name
        RETURNING id INTO tag_id_val;
      END IF;
      
      -- Link tag to intervention
      INSERT INTO intervention_tags (intervention_id, tag_id)
      VALUES (intervention_record.id, tag_id_val)
      ON CONFLICT (intervention_id, tag_id) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- Step 8: Optional - Remove tags JSONB column from interventions table after migration
-- Uncomment the following lines ONLY after verifying the migration worked correctly
-- ALTER TABLE interventions DROP COLUMN IF EXISTS tags;
-- DROP INDEX IF EXISTS idx_interventions_tags;
