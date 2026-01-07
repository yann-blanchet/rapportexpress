-- Update existing schema to allow operations without authentication (for MVP)
-- Run this if you already created the tables with the original schema

-- Make user_id nullable (if not already)
ALTER TABLE interventions ALTER COLUMN user_id DROP NOT NULL;

-- Drop ALL existing policies (both old and new versions) - MUST BE FIRST
-- Interventions policies
DROP POLICY IF EXISTS "Users can view their own interventions" ON interventions;
DROP POLICY IF EXISTS "Users can insert their own interventions" ON interventions;
DROP POLICY IF EXISTS "Users can update their own interventions" ON interventions;
DROP POLICY IF EXISTS "Users can delete their own interventions" ON interventions;
DROP POLICY IF EXISTS "Users can view their own interventions or unassigned" ON interventions;
DROP POLICY IF EXISTS "Users can insert their own interventions or unassigned" ON interventions;
DROP POLICY IF EXISTS "Users can update their own interventions or unassigned" ON interventions;
DROP POLICY IF EXISTS "Users can delete their own interventions or unassigned" ON interventions;

-- Checklist items policies
DROP POLICY IF EXISTS "Users can manage checklist items for their interventions" ON checklist_items;
DROP POLICY IF EXISTS "Users can manage checklist items for their interventions or unassigned" ON checklist_items;
DROP POLICY IF EXISTS "Users can view checklist items for their interventions or unassigned" ON checklist_items;
DROP POLICY IF EXISTS "Users can insert checklist items for their interventions or unassigned" ON checklist_items;
DROP POLICY IF EXISTS "Users can update checklist items for their interventions or unassigned" ON checklist_items;
DROP POLICY IF EXISTS "Users can delete checklist items for their interventions or unassigned" ON checklist_items;

-- Photos policies
DROP POLICY IF EXISTS "Users can manage photos for their interventions" ON photos;
DROP POLICY IF EXISTS "Users can manage photos for their interventions or unassigned" ON photos;
DROP POLICY IF EXISTS "Users can view photos for their interventions or unassigned" ON photos;
DROP POLICY IF EXISTS "Users can insert photos for their interventions or unassigned" ON photos;
DROP POLICY IF EXISTS "Users can update photos for their interventions or unassigned" ON photos;
DROP POLICY IF EXISTS "Users can delete photos for their interventions or unassigned" ON photos;

-- Comments policies
DROP POLICY IF EXISTS "Users can manage comments for their interventions" ON comments;
DROP POLICY IF EXISTS "Users can manage comments for their interventions or unassigned" ON comments;
DROP POLICY IF EXISTS "Users can view comments for their interventions or unassigned" ON comments;
DROP POLICY IF EXISTS "Users can insert comments for their interventions or unassigned" ON comments;
DROP POLICY IF EXISTS "Users can update comments for their interventions or unassigned" ON comments;
DROP POLICY IF EXISTS "Users can delete comments for their interventions or unassigned" ON comments;

-- Create new policies that allow unassigned data (user_id IS NULL)
CREATE POLICY "Users can view their own interventions or unassigned"
  ON interventions FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own interventions or unassigned"
  ON interventions FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own interventions or unassigned"
  ON interventions FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own interventions or unassigned"
  ON interventions FOR DELETE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Checklist items policies (separate for each operation)
CREATE POLICY "Users can view checklist items for their interventions or unassigned"
  ON checklist_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM interventions
      WHERE interventions.id = checklist_items.intervention_id
      AND (interventions.user_id = auth.uid() OR interventions.user_id IS NULL)
    )
  );

CREATE POLICY "Users can insert checklist items for their interventions or unassigned"
  ON checklist_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM interventions
      WHERE interventions.id = checklist_items.intervention_id
      AND (interventions.user_id = auth.uid() OR interventions.user_id IS NULL)
    )
  );

CREATE POLICY "Users can update checklist items for their interventions or unassigned"
  ON checklist_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM interventions
      WHERE interventions.id = checklist_items.intervention_id
      AND (interventions.user_id = auth.uid() OR interventions.user_id IS NULL)
    )
  );

CREATE POLICY "Users can delete checklist items for their interventions or unassigned"
  ON checklist_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM interventions
      WHERE interventions.id = checklist_items.intervention_id
      AND (interventions.user_id = auth.uid() OR interventions.user_id IS NULL)
    )
  );

-- Photos policies
CREATE POLICY "Users can view photos for their interventions or unassigned"
  ON photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM interventions
      WHERE interventions.id = photos.intervention_id
      AND (interventions.user_id = auth.uid() OR interventions.user_id IS NULL)
    )
  );

CREATE POLICY "Users can insert photos for their interventions or unassigned"
  ON photos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM interventions
      WHERE interventions.id = photos.intervention_id
      AND (interventions.user_id = auth.uid() OR interventions.user_id IS NULL)
    )
  );

CREATE POLICY "Users can update photos for their interventions or unassigned"
  ON photos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM interventions
      WHERE interventions.id = photos.intervention_id
      AND (interventions.user_id = auth.uid() OR interventions.user_id IS NULL)
    )
  );

CREATE POLICY "Users can delete photos for their interventions or unassigned"
  ON photos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM interventions
      WHERE interventions.id = photos.intervention_id
      AND (interventions.user_id = auth.uid() OR interventions.user_id IS NULL)
    )
  );

-- Comments policies
CREATE POLICY "Users can view comments for their interventions or unassigned"
  ON comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM interventions
      WHERE interventions.id = comments.intervention_id
      AND (interventions.user_id = auth.uid() OR interventions.user_id IS NULL)
    )
  );

CREATE POLICY "Users can insert comments for their interventions or unassigned"
  ON comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM interventions
      WHERE interventions.id = comments.intervention_id
      AND (interventions.user_id = auth.uid() OR interventions.user_id IS NULL)
    )
  );

CREATE POLICY "Users can update comments for their interventions or unassigned"
  ON comments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM interventions
      WHERE interventions.id = comments.intervention_id
      AND (interventions.user_id = auth.uid() OR interventions.user_id IS NULL)
    )
  );

CREATE POLICY "Users can delete comments for their interventions or unassigned"
  ON comments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM interventions
      WHERE interventions.id = comments.intervention_id
      AND (interventions.user_id = auth.uid() OR interventions.user_id IS NULL)
    )
  );

-- Update storage policies to allow anonymous access
DROP POLICY IF EXISTS "Users can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their photos" ON storage.objects;

CREATE POLICY "Users can upload photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'intervention-photos' AND
    (auth.uid()::text = (storage.foldername(name))[1] OR (storage.foldername(name))[1] = 'anonymous')
  );

CREATE POLICY "Users can view their photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'intervention-photos' AND
    (auth.uid()::text = (storage.foldername(name))[1] OR (storage.foldername(name))[1] = 'anonymous')
  );

CREATE POLICY "Users can delete their photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'intervention-photos' AND
    (auth.uid()::text = (storage.foldername(name))[1] OR (storage.foldername(name))[1] = 'anonymous')
  );
