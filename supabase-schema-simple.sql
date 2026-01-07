-- SIMPLE RLS POLICIES FOR MVP (No Authentication Required)
-- This is a simpler version that allows all operations when user_id IS NULL
-- Run this if you're still having RLS issues

-- Drop all existing policies first
DROP POLICY IF EXISTS "Users can view their own interventions or unassigned" ON interventions;
DROP POLICY IF EXISTS "Users can insert their own interventions or unassigned" ON interventions;
DROP POLICY IF EXISTS "Users can update their own interventions or unassigned" ON interventions;
DROP POLICY IF EXISTS "Users can delete their own interventions or unassigned" ON interventions;
DROP POLICY IF EXISTS "Users can view checklist items for their interventions or unassigned" ON checklist_items;
DROP POLICY IF EXISTS "Users can insert checklist items for their interventions or unassigned" ON checklist_items;
DROP POLICY IF EXISTS "Users can update checklist items for their interventions or unassigned" ON checklist_items;
DROP POLICY IF EXISTS "Users can delete checklist items for their interventions or unassigned" ON checklist_items;
DROP POLICY IF EXISTS "Users can view photos for their interventions or unassigned" ON photos;
DROP POLICY IF EXISTS "Users can insert photos for their interventions or unassigned" ON photos;
DROP POLICY IF EXISTS "Users can update photos for their interventions or unassigned" ON photos;
DROP POLICY IF EXISTS "Users can delete photos for their interventions or unassigned" ON photos;
DROP POLICY IF EXISTS "Users can view comments for their interventions or unassigned" ON comments;
DROP POLICY IF EXISTS "Users can insert comments for their interventions or unassigned" ON comments;
DROP POLICY IF EXISTS "Users can update comments for their interventions or unassigned" ON comments;
DROP POLICY IF EXISTS "Users can delete comments for their interventions or unassigned" ON comments;

-- Simple policies: Allow all operations when user_id IS NULL (for MVP without auth)
-- Interventions
CREATE POLICY "Allow all for unassigned interventions"
  ON interventions FOR ALL
  USING (user_id IS NULL)
  WITH CHECK (user_id IS NULL);

-- Checklist items - allow if intervention has user_id IS NULL
CREATE POLICY "Allow all checklist items for unassigned interventions"
  ON checklist_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM interventions
      WHERE interventions.id = checklist_items.intervention_id
      AND interventions.user_id IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM interventions
      WHERE interventions.id = checklist_items.intervention_id
      AND interventions.user_id IS NULL
    )
  );

-- Photos - allow if intervention has user_id IS NULL
CREATE POLICY "Allow all photos for unassigned interventions"
  ON photos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM interventions
      WHERE interventions.id = photos.intervention_id
      AND interventions.user_id IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM interventions
      WHERE interventions.id = photos.intervention_id
      AND interventions.user_id IS NULL
    )
  );

-- Comments - allow if intervention has user_id IS NULL
CREATE POLICY "Allow all comments for unassigned interventions"
  ON comments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM interventions
      WHERE interventions.id = comments.intervention_id
      AND interventions.user_id IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM interventions
      WHERE interventions.id = comments.intervention_id
      AND interventions.user_id IS NULL
    )
  );
