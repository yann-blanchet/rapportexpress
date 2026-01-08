-- Supabase Database Schema for RapportExpress
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Interventions table
CREATE TABLE IF NOT EXISTS interventions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_name TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'In Progress',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synced BOOLEAN DEFAULT false,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NULL,
  checklist_items JSONB DEFAULT '[]'::jsonb,
  comments JSONB DEFAULT '[]'::jsonb
);

-- Photos table (kept separate as they're large and stored in Supabase Storage)
CREATE TABLE IF NOT EXISTS photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  intervention_id UUID NOT NULL REFERENCES interventions(id) ON DELETE CASCADE,
  url_local TEXT,
  url_cloud TEXT,
  description TEXT,
  taken_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Note: checklist_items and comments are now stored as JSONB columns in interventions table
-- Old tables kept for reference (can be dropped after migration):
-- CREATE TABLE IF NOT EXISTS checklist_items (...);
-- CREATE TABLE IF NOT EXISTS comments (...);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_interventions_user_id ON interventions(user_id);
CREATE INDEX IF NOT EXISTS idx_interventions_date ON interventions(date);
CREATE INDEX IF NOT EXISTS idx_interventions_status ON interventions(status);
CREATE INDEX IF NOT EXISTS idx_interventions_checklist_items ON interventions USING GIN (checklist_items);
CREATE INDEX IF NOT EXISTS idx_interventions_comments ON interventions USING GIN (comments);
CREATE INDEX IF NOT EXISTS idx_photos_intervention_id ON photos(intervention_id);

-- Enable Row Level Security (RLS)
ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
-- Note: checklist_items and comments are now part of interventions table, so RLS is handled there

-- RLS Policies: Allow access to own data or data without user_id (for MVP without auth)
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

-- Similar policies for related tables (allow access to unassigned interventions)
-- Note: checklist_items and comments are now JSONB columns in interventions table,
-- so they're automatically covered by the interventions RLS policies above

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

-- Add constraints to ensure JSONB columns are always arrays
ALTER TABLE interventions 
ADD CONSTRAINT IF NOT EXISTS checklist_items_is_array 
CHECK (jsonb_typeof(checklist_items) = 'array');

ALTER TABLE interventions 
ADD CONSTRAINT IF NOT EXISTS comments_is_array 
CHECK (jsonb_typeof(comments) = 'array');

-- Create storage bucket for photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('intervention-photos', 'intervention-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: Users can upload photos (or anonymous for MVP)
CREATE POLICY "Users can upload photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'intervention-photos' AND
    (auth.uid()::text = (storage.foldername(name))[1] OR (storage.foldername(name))[1] = 'anonymous')
  );

-- Storage policy: Users can view their photos (or anonymous for MVP)
CREATE POLICY "Users can view their photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'intervention-photos' AND
    (auth.uid()::text = (storage.foldername(name))[1] OR (storage.foldername(name))[1] = 'anonymous')
  );

-- Storage policy: Users can delete their photos (or anonymous for MVP)
CREATE POLICY "Users can delete their photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'intervention-photos' AND
    (auth.uid()::text = (storage.foldername(name))[1] OR (storage.foldername(name))[1] = 'anonymous')
  );
