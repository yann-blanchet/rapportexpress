import Dexie from 'dexie'

export const db = new Dexie('RapportExpressDB')

// JSONB schema - checklist_items and comments stored in interventions table
// Version 1: Initial schema
db.version(1).stores({
  interventions: 'id, client_name, date, status, created_at, updated_at, synced',
  photos: 'id, intervention_id, url_local, url_cloud, description, taken_at'
})

// Version 2: Added user_id to interventions index
db.version(2).stores({
  interventions: 'id, client_name, date, status, created_at, updated_at, synced, user_id',
  photos: 'id, intervention_id, url_local, url_cloud, description, taken_at'
})

// Version 3: Added tags and intervention_tags tables for shared tags
db.version(3).stores({
  interventions: 'id, client_name, date, status, created_at, updated_at, synced, user_id',
  photos: 'id, intervention_id, url_local, url_cloud, description, taken_at',
  tags: 'id, name, color, created_at, user_id',
  intervention_tags: '[intervention_id+tag_id], intervention_id, tag_id'
})

// Version 4: Added pending_audio table for offline dictation
db.version(4).stores({
  interventions: 'id, client_name, date, status, created_at, updated_at, synced, user_id',
  photos: 'id, intervention_id, url_local, url_cloud, description, taken_at',
  tags: 'id, name, color, created_at, user_id',
  intervention_tags: '[intervention_id+tag_id], intervention_id, tag_id',
  pending_audio: 'id, intervention_id, created_at'
})

export default db
