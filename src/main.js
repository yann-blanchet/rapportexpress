import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import './utils/reloadDiagnostics.js'

// Auto dark/light mode based on system preference
function setTheme() {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
}

// Set initial theme
setTheme()

// Listen for theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', setTheme)

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
