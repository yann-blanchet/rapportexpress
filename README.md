# RapportExpress - Field Technician MVP

A Vue.js application for independent field technicians to manage interventions with offline-first capabilities.

## Features

- 📋 Dashboard with intervention list, filters, and search
- ✏️ Create/Edit interventions with checklist, photos, and comments
- 📄 View intervention details with PDF generation
- ⚙️ Settings and configuration
- 💾 Offline-first with Dexie.js (IndexedDB)
- ☁️ Cloud sync with Supabase
- 📱 Responsive design with DaisyUI

## Setup

### 1. Install Dependencies

```bash
npm install --legacy-peer-deps
```

**Note**: The `--legacy-peer-deps` flag is needed because `vite-plugin-pwa` hasn't fully updated its peer dependencies for Vite 7 yet, but it works fine.

### 2. Supabase Setup

**⚠️ Important**: The app works offline without Supabase, but cloud sync requires setup.

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API
3. Copy your Project URL and anon/public key
4. **Run the SQL schema** in your Supabase SQL Editor:
   - Go to SQL Editor in Supabase dashboard
   - Copy all content from `supabase-schema.sql`
   - Paste and run it
   - See `SUPABASE_SETUP.md` for detailed instructions
5. Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Note**: If you see "Could not find the table" errors, you need to run the SQL schema first!

### 3. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Database Schema

The application uses the following tables:
- `interventions` - Main intervention records
- `checklist_items` - Checklist items for each intervention
- `photos` - Photos attached to interventions
- `comments` - Comments/notes for interventions

All data is stored locally in IndexedDB (via Dexie) and synced to Supabase when online.

## Usage

### Creating an Intervention

1. Click "Create New Intervention" from the dashboard
2. Fill in client/site name, date, and status
3. Add checklist items as needed
4. Take or upload photos
5. Add comments
6. Save - data is stored locally immediately and synced to cloud when online

### Viewing and Editing

- Click on any intervention from the dashboard to view details
- Click "Edit" to modify an intervention (if not completed)
- Click "Download PDF" to generate a PDF report

### Settings

- Configure user profile (name, email)
- Customize PDF settings (header, logo)
- Manual sync for offline data
- Export data as JSON backup
- View statistics

## Tech Stack

- **Vue.js 3** - Progressive JavaScript framework
- **Vue Router** - Official router for Vue.js
- **DaisyUI** - Tailwind CSS component library
- **Supabase** - Backend as a Service (Auth, Database, Storage)
- **Dexie.js** - IndexedDB wrapper for offline storage
- **jsPDF** - PDF generation library
- **Vite** - Build tool and dev server

## Project Structure

```
src/
├── views/          # Page components
│   ├── Dashboard.vue
│   ├── InterventionForm.vue
│   ├── InterventionDetail.vue
│   └── Settings.vue
├── services/       # API and utility services
│   ├── supabase.js
│   └── pdf.js
├── db/            # Database configuration
│   └── indexeddb.js
├── router/        # Vue Router configuration
│   └── index.js
├── utils/         # Utility functions
│   └── uuid.js
├── App.vue        # Root component
├── main.js        # Application entry point
└── style.css      # Global styles
```

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## PWA (Progressive Web App)

The app is configured as a PWA and can be installed on devices. See `PWA_SETUP.md` for:
- Icon generation instructions
- Installation steps
- Service worker configuration

**Note**: You need to create app icons (`icon-192.png` and `icon-512.png`) in the `public/` directory before building for production.

## License

MIT
# rapportexpress
