import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import InterventionForm from '../views/InterventionForm.vue'
import InterventionDetail from '../views/InterventionDetail.vue'
import Settings from '../views/Settings.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Dashboard',
      component: Dashboard
    },
    {
      path: '/interventions/new',
      name: 'NewIntervention',
      component: InterventionForm
    },
    {
      path: '/interventions/:id',
      name: 'InterventionDetail',
      component: InterventionDetail
    },
    {
      path: '/interventions/:id/edit',
      name: 'EditIntervention',
      component: InterventionForm
    },
    {
      path: '/settings',
      name: 'Settings',
      component: Settings
    }
  ]
})

export default router
