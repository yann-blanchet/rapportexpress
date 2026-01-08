import Dexie from 'dexie'

export const db = new Dexie('RapportExpressDB')

// JSONB schema - checklist_items and comments stored in interventions table
db.version(1).stores({
  interventions: 'id, client_name, date, status, created_at, updated_at, synced',
  photos: 'id, intervention_id, url_local, url_cloud, description, taken_at'
  // Note: checklist_items and comments are stored as JSONB in interventions.checklist_items and interventions.comments
})

export default db
