-- Supabase Database Schema for RapportExpress
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Interventions table
CREATE TABLE IF NOT EXISTS interventions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_name TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'To Do',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synced BOOLEAN DEFAULT false,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NULL
);

-- Checklist items table
CREATE TABLE IF NOT EXISTS checklist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  intervention_id UUID NOT NULL REFERENCES interventions(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  checked BOOLEAN DEFAULT false,
  photo_ids UUID[] DEFAULT ARRAY[]::UUID[]
);

-- Photos table
CREATE TABLE IF NOT EXISTS photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  intervention_id UUID NOT NULL REFERENCES interventions(id) ON DELETE CASCADE,
  url_local TEXT,
  url_cloud TEXT,
  description TEXT,
  taken_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  intervention_id UUID NOT NULL REFERENCES interventions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_interventions_user_id ON interventions(user_id);
CREATE INDEX IF NOT EXISTS idx_interventions_date ON interventions(date);
CREATE INDEX IF NOT EXISTS idx_interventions_status ON interventions(status);
CREATE INDEX IF NOT EXISTS idx_checklist_items_intervention_id ON checklist_items(intervention_id);
CREATE INDEX IF NOT EXISTS idx_photos_intervention_id ON photos(intervention_id);
CREATE INDEX IF NOT EXISTS idx_comments_intervention_id ON comments(intervention_id);

-- Enable Row Level Security (RLS)
ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

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
-- Separate policies for SELECT/UPDATE/DELETE and INSERT

-- Checklist items policies
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
