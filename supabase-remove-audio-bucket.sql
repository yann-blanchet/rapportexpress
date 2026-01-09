-- Remove intervention-audio storage bucket (not needed for dictation feature)
-- Audio files are stored temporarily in IndexedDB and deleted after transcription
-- Run this in Supabase SQL Editor

-- Remove storage policies for intervention-audio bucket
DROP POLICY IF EXISTS "Users can insert audio for their interventions or unassigned" ON storage.objects;
DROP POLICY IF EXISTS "Users can view audio for their interventions or unassigned" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete audio for their interventions or unassigned" ON storage.objects;
DROP POLICY IF EXISTS "Users can update audio for their interventions or unassigned" ON storage.objects;

-- Remove the bucket (this will also remove all files in the bucket)
DELETE FROM storage.buckets WHERE id = 'intervention-audio';

-- Note: If you get an error about the bucket not existing, that's fine - it means it was never created
