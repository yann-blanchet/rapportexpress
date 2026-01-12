-- Fix RLS Policies for Interventions
-- Run this SQL in your Supabase SQL Editor
-- This fixes the "new row violates row-level security policy" error

-- Step 1: Update INSERT policy to allow null user_id (trigger will set it)
DROP POLICY IF EXISTS "Users can insert their own interventions" ON interventions;

CREATE POLICY "Users can insert their own interventions"
  ON interventions FOR INSERT
  WITH CHECK (
    -- Allow if user_id matches auth.uid() OR if user_id is null (trigger will set it)
    (auth.uid() = user_id) OR (user_id IS NULL AND auth.uid() IS NOT NULL)
  );

-- Step 2: Update UPDATE policy to ensure user_id matches
DROP POLICY IF EXISTS "Users can update their own interventions" ON interventions;

CREATE POLICY "Users can update their own interventions"
  ON interventions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Step 3: Update trigger function to handle both INSERT and UPDATE
CREATE OR REPLACE FUNCTION set_intervention_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Always set user_id to current authenticated user
  -- This ensures RLS policies work correctly
  IF auth.uid() IS NOT NULL THEN
    NEW.user_id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Update triggers
DROP TRIGGER IF EXISTS trigger_set_intervention_user_id_insert ON interventions;
CREATE TRIGGER trigger_set_intervention_user_id_insert
  BEFORE INSERT ON interventions
  FOR EACH ROW
  EXECUTE FUNCTION set_intervention_user_id();

DROP TRIGGER IF EXISTS trigger_set_intervention_user_id_update ON interventions;
CREATE TRIGGER trigger_set_intervention_user_id_update
  BEFORE UPDATE ON interventions
  FOR EACH ROW
  WHEN (NEW.user_id IS NULL OR NEW.user_id != auth.uid())
  EXECUTE FUNCTION set_intervention_user_id();

-- Step 5: Update existing interventions to set user_id for current user
-- This fixes interventions created before authentication was set up
-- Only run this if you want to assign existing interventions to the current user
-- Uncomment the line below and run it if needed:
-- UPDATE interventions SET user_id = auth.uid() WHERE user_id IS NULL;
