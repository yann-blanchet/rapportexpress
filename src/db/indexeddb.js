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

export default db
