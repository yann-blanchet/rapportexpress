import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig(async ({ mode }) => {
  console.log(`[Vite Config] Mode: ${mode}, PWA will be ${mode === 'production' ? 'enabled' : 'disabled'}`)
  
  const plugins = [vue()]
  
  // Only enable PWA in production to avoid dev mode reload issues
  if (mode === 'production') {
    // Dynamic import only in production to avoid loading in dev mode
    const { VitePWA } = await import('vite-plugin-pwa')
    plugins.push(VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'RapportExpress - Field Technician App',
        short_name: 'RapportExpress',
        description: 'Offline-first app for field technicians to manage interventions',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        shortcuts: [
          {
            name: 'New Intervention',
            short_name: 'New',
            description: 'Create a new intervention',
            url: '/interventions/new',
            icons: [{ src: '/icon-192.png', sizes: '192x192' }]
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    }))
  }
  
  return {
    plugins,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      hmr: false, // Completely disable HMR to prevent reloads
      watch: {
        // Ignore certain files that might trigger unnecessary reloads
        ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/dev-dist/**', '**/clear-sw.html', '**/*.log']
      },
      // Disable automatic page reload on errors
      strictPort: false
    },
    // Disable automatic reload on build errors
    build: {
      watch: null
    },
    // Disable HMR in dev mode if it's causing issues
    optimizeDeps: {
      exclude: []
    }
  }
})
