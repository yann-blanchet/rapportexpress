import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import InterventionForm from '../views/InterventionForm.vue'
import Settings from '../views/Settings.vue'
import Login from '../views/Login.vue'
import { getCurrentSession } from '../services/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: Login,
      meta: { requiresAuth: false }
    },
    {
      path: '/',
      name: 'Dashboard',
      component: Dashboard,
      meta: { requiresAuth: true }
    },
    {
      path: '/interventions/new',
      name: 'NewIntervention',
      component: InterventionForm,
      meta: { requiresAuth: true }
    },
    {
      path: '/interventions/:id',
      name: 'InterventionDetail',
      component: InterventionForm,
      meta: { requiresAuth: true }
    },
    {
      path: '/interventions/:id/edit',
      name: 'EditIntervention',
      component: InterventionForm,
      meta: { requiresAuth: true }
    },
    {
      path: '/settings',
      name: 'Settings',
      component: Settings,
      meta: { requiresAuth: true }
    }
  ]
})

// Navigation guard - check authentication
router.beforeEach(async (to, from, next) => {
  // Check if route requires authentication
  if (to.meta.requiresAuth) {
    const { user } = await getCurrentSession()
    
    if (!user) {
      // Not authenticated - redirect to login
      next({ name: 'Login', query: { redirect: to.fullPath } })
    } else {
      // Authenticated - allow access
      next()
    }
  } else if (to.name === 'Login') {
    // If already authenticated, redirect to dashboard
    const { user } = await getCurrentSession()
    if (user) {
      // Check if there's a redirect query param
      const redirect = to.query.redirect || '/'
      next(redirect)
    } else {
      next()
    }
  } else {
    // Public route - allow access
    next()
  }
})

export default router
