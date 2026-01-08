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
    
    // If reloading too quickly (less than 100ms), prevent infinite loop
    if (timeSinceLastReload < 100 && reloadCount > 3) {
      console.error('[Reload Diagnostics] ⚠️ INFINITE RELOAD LOOP DETECTED!')
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
    console.error('[Reload Diagnostics] ⚠️ Reload loop was detected.')
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
        console.error('[Reload Diagnostics] ⚠️ window.location.reload() was called!')
        return originalReload.apply(this, args)
      },
      writable: true,
      configurable: true
    })
  }
} catch (error) {
  // Silently fail - not critical
}

// Monitor intervals
const originalSetInterval = window.setInterval
const activeIntervals = new Set()

window.setInterval = function(...args) {
  const id = originalSetInterval.apply(this, args)
  activeIntervals.add(id)
  return id
}

const originalClearInterval = window.clearInterval
window.clearInterval = function(id) {
  activeIntervals.delete(id)
  return originalClearInterval.apply(this, arguments)
}

// Check for service workers
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    if (registrations.length > 0) {
      console.warn('[Reload Diagnostics] ⚠️ Service workers found:', registrations.length)
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
// Silently monitor - only log errors

export default {
  getReloadCount: () => reloadCount,
  clearReloadCount: () => {
    sessionStorage.removeItem('reloadCount')
    sessionStorage.removeItem('lastReloadTime')
  }
}
