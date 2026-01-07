import Dexie from 'dexie'

export const db = new Dexie('RapportExpressDB')

db.version(1).stores({
  interventions: 'id, client_name, date, status, created_at, updated_at, synced',
  checklist_items: 'id, intervention_id, label, checked, photo_ids',
  photos: 'id, intervention_id, url_local, url_cloud, description, taken_at',
  comments: 'id, intervention_id, text, created_at'
})

export default db
