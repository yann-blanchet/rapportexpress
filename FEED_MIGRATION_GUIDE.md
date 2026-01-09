# Unified Feed Migration Guide

## Overview

The Photos and Comments tabs have been merged into a single **Feed** tab with a WhatsApp-style interface. The feed supports text, photos, and audio entries in a unified timeline.

## Schema Changes

### New Structure

**Comments JSONB** now supports multiple entry types:
```json
[
  {
    "id": "uuid",
    "type": "text" | "photo" | "audio",
    "text": "text content" (for type: "text"),
    "photo_id": "uuid" (for type: "photo", references photos.id),
    "transcription": "transcribed text" (for type: "audio"),
    "pending_audio_id": "uuid" (for type: "audio", references pending_audio.id - local only),
    "created_at": "ISO timestamp",
    "status": "pending" | "uploading" | "transcribing" | "completed"
  }
]
```

**Note**: Tags are only for interventions (stored in `intervention_tags` junction table), not for individual feed entries.

### Audio Handling

- **No audio table in Supabase** - Audio stays local-only in IndexedDB
- Audio is stored in `pending_audio` table (IndexedDB) until transcribed
- Transcriptions are stored directly in feed entries (comments JSONB)
- Audio files are deleted after successful transcription

## Migration Steps

### 1. Run Supabase Migrations

```sql
-- Migrate existing data
-- Run: supabase-migrate-to-feed.sql
```

### 2. Update IndexedDB

The app uses IndexedDB version 4 (no changes needed). Audio stays in `pending_audio` table.

### 3. Data Migration

The migration script will:
- Convert existing photos to photo entries in comments
- Convert existing text comments to text entries
- Preserve all existing data

## Features

### ✅ Implemented

- ✅ Unified Feed tab (replaces Photos + Comments)
- ✅ WhatsApp-style message bubbles
- ✅ Text, photo, and audio entries
- ✅ Inline tags as badges
- ✅ Status indicators (pending upload, transcribing, etc.)
- ✅ Long press / 3-dot menu for duplication
- ✅ Offline-first support
- ✅ Photo upload with status tracking
- ✅ Audio transcription with status tracking

### Entry Types

1. **Text Entry**: Simple text message
2. **Photo Entry**: References photo from photos table, shows upload status
3. **Audio Entry**: Contains transcription text, references pending_audio (local only), shows transcription status

### Status Indicators

- **Pending upload**: Photo/audio waiting to upload
- **Uploading**: Currently uploading to cloud
- **Transcribing**: Audio being transcribed
- **Completed**: Successfully processed

### Duplication

- Long press (500ms) on any entry
- Or click 3-dot menu
- Options: Duplicate, Delete

## UI Layout

```
Feed Tab:
├── Feed Entries (scrollable)
│   ├── Text Entry (bubble with text)
│   ├── Photo Entry (bubble with image + status)
│   └── Audio Entry (bubble with transcription + status)
│
└── Input Area (bottom)
    ├── Tag Input
    ├── Text Input
    └── Action Buttons (Photo, Audio, Send)
```

## Backward Compatibility

- Old comments format is still supported during migration
- Old photos are automatically converted to feed entries
- Migration happens automatically when loading interventions

## Next Steps

1. Run the SQL migrations in Supabase
2. The app will automatically migrate IndexedDB on next open
3. Existing data will be converted to the new format
4. Start using the new Feed tab!
