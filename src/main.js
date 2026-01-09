import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import './utils/reloadDiagnostics.js'
import './utils/processPendingAudio.js' // Initialize pending audio processor

// Theme management - supports auto, light, and dark modes
function setTheme() {
  const themeMode = localStorage.getItem('themeMode') || 'auto'
  
  if (themeMode === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
  } else {
    document.documentElement.setAttribute('data-theme', themeMode)
  }
}

// Set initial theme
setTheme()

// Listen for system theme changes (only applies if themeMode is 'auto')
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  const themeMode = localStorage.getItem('themeMode') || 'auto'
  if (themeMode === 'auto') {
    setTheme()
  }
})

// Listen for theme changes from Settings page
window.addEventListener('themeChanged', setTheme)

// Global error handler to catch unhandled errors
window.addEventListener('error', (event) => {
  // Filter out browser extension errors and undefined errors
  if (!event.error && !event.message && !event.filename) {
    // Likely a browser extension message, ignore it
    return
  }
  
  // Only log actual errors with meaningful information
  if (event.error || event.message || event.filename) {
    console.error('[Main] Global error caught:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      error: event.error,
      stack: event.error?.stack
    })
    // Prevent the error from causing a reload only for real errors
    if (event.error) {
      event.preventDefault()
      return false
    }
  }
}, true) // Use capture phase

window.addEventListener('unhandledrejection', (event) => {
  // Only log if there's an actual rejection reason
  if (event.reason) {
    console.error('[Main] Unhandled promise rejection:', {
      reason: event.reason,
      stack: event.reason?.stack
    })
    // Prevent default to avoid page reload on unhandled rejections
    event.preventDefault()
    return false
  }
})

const app = createApp(App)
app.use(router)
app.mount('#app')
