import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import './utils/reloadDiagnostics.js'

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
  console.error('[Main] Global error caught:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    error: event.error,
    stack: event.error?.stack
  })
  // Prevent the error from causing a reload
  event.preventDefault()
  return false
}, true) // Use capture phase

window.addEventListener('unhandledrejection', (event) => {
  console.error('[Main] Unhandled promise rejection:', {
    reason: event.reason,
    stack: event.reason?.stack
  })
  // Prevent default to avoid page reload on unhandled rejections
  event.preventDefault()
  return false
})

const app = createApp(App)
app.use(router)
app.mount('#app')
