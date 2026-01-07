// Diagnostic utility to track what's causing page reloads
try {
  let reloadCount = 0
  let lastReloadTime = Date.now()

  // Track reloads
  if (sessionStorage.getItem('reloadCount')) {
    reloadCount = parseInt(sessionStorage.getItem('reloadCount'), 10) + 1
  } else {
    reloadCount = 1
  }

  const previousReloadTime = sessionStorage.getItem('lastReloadTime')
  const now = Date.now()

  if (previousReloadTime) {
    const timeSinceLastReload = now - parseInt(previousReloadTime, 10)
    console.log(`[Reload Diagnostics] Page reloaded ${reloadCount} time(s)`)
    console.log(`[Reload Diagnostics] Time since last reload: ${timeSinceLastReload}ms`)
    
    // If reloading too quickly (less than 100ms), prevent infinite loop
    if (timeSinceLastReload < 100 && reloadCount > 3) {
      console.error('[Reload Diagnostics] ⚠️ INFINITE RELOAD LOOP DETECTED!')
      console.error('[Reload Diagnostics] Clearing sessionStorage to break the loop...')
      sessionStorage.clear()
      // Don't continue - this might be causing the loop
      // Exit early without setting new values
    } else {
      sessionStorage.setItem('reloadCount', reloadCount.toString())
      sessionStorage.setItem('lastReloadTime', now.toString())
    }
  } else {
    sessionStorage.setItem('reloadCount', reloadCount.toString())
    sessionStorage.setItem('lastReloadTime', now.toString())
  }

  // Check if we're in a reload loop
  if (sessionStorage.getItem('reloadLoopDetected') === 'true') {
    console.error('[Reload Diagnostics] ⚠️ Reload loop was detected. Please check the console for errors.')
  }
} catch (error) {
  console.error('[Reload Diagnostics] Error in diagnostic script:', error)
  // Don't let the diagnostic script break the app
}

// Monitor for reload triggers - wrap in try-catch since it might fail
try {
  const originalReload = window.location.reload.bind(window.location)
  // Only try to override if it's configurable
  const descriptor = Object.getOwnPropertyDescriptor(window.location, 'reload')
  if (descriptor && descriptor.configurable) {
    Object.defineProperty(window.location, 'reload', {
      value: function(...args) {
        console.error('[Reload Diagnostics] ⚠️ window.location.reload() was called!', new Error().stack)
        return originalReload.apply(this, args)
      },
      writable: true,
      configurable: true
    })
  } else {
    // If not configurable, just log when it's called (we can't intercept it)
    console.log('[Reload Diagnostics] Note: window.location.reload is not configurable, cannot intercept calls')
  }
} catch (error) {
  console.warn('[Reload Diagnostics] Could not intercept window.location.reload:', error.message)
}

// Monitor intervals
const originalSetInterval = window.setInterval
const activeIntervals = new Set()

window.setInterval = function(...args) {
  const id = originalSetInterval.apply(this, args)
  activeIntervals.add(id)
  console.log(`[Reload Diagnostics] setInterval created: ${id}, total active: ${activeIntervals.size}`)
  return id
}

const originalClearInterval = window.clearInterval
window.clearInterval = function(id) {
  activeIntervals.delete(id)
  console.log(`[Reload Diagnostics] setInterval cleared: ${id}, remaining: ${activeIntervals.size}`)
  return originalClearInterval.apply(this, arguments)
}

// Check for service workers
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    if (registrations.length > 0) {
      console.warn('[Reload Diagnostics] ⚠️ Service workers found:', registrations.length)
      registrations.forEach(reg => {
        console.warn('[Reload Diagnostics] Service worker:', reg.scope, reg.active?.scriptURL)
      })
    } else {
      console.log('[Reload Diagnostics] ✓ No service workers registered')
    }
  })
}

// Monitor for errors that might cause reloads
window.addEventListener('error', (event) => {
  console.error('[Reload Diagnostics] Error caught:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error,
    stack: event.error?.stack
  })
  // Don't prevent default - we want to see the error
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('[Reload Diagnostics] Unhandled rejection:', {
    reason: event.reason,
    stack: event.reason?.stack
  })
  // Prevent default to avoid crashes
  event.preventDefault()
})

// Monitor for visibility changes (tab switching might trigger reloads)
document.addEventListener('visibilitychange', () => {
  console.log('[Reload Diagnostics] Visibility changed:', document.hidden ? 'hidden' : 'visible')
})

// Log when page is about to unload
window.addEventListener('beforeunload', (event) => {
  console.log('[Reload Diagnostics] ⚠️ Page is about to unload/reload')
  console.log('[Reload Diagnostics] Active intervals:', activeIntervals.size)
  console.log('[Reload Diagnostics] Event type:', event.type)
  console.trace('[Reload Diagnostics] Call stack:')
})

// Also monitor pagehide (more reliable than beforeunload)
window.addEventListener('pagehide', () => {
  console.log('[Reload Diagnostics] ⚠️ Page is hiding (reload likely)')
})

// Monitor pageshow to detect back/forward navigation or reloads
window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    console.log('[Reload Diagnostics] Page restored from cache (back/forward)')
  } else {
    console.log('[Reload Diagnostics] Page shown (fresh load or reload)')
  }
})

export default {
  getReloadCount: () => reloadCount,
  clearReloadCount: () => {
    sessionStorage.removeItem('reloadCount')
    sessionStorage.removeItem('lastReloadTime')
  }
}
