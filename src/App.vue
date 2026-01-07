<template>
  <div :class="['min-h-screen bg-base-200 safe-area-bottom', shouldShowMenu ? 'pb-16' : 'pb-4']">
    <main class="container mx-auto p-4">
      <router-view v-slot="{ Component, route }">
        <keep-alive :include="['Dashboard']">
          <component :is="Component" :key="route.path" />
        </keep-alive>
      </router-view>
    </main>
    
    <!-- Bottom Menu Bar - Mobile App Style -->
    <div 
      v-if="shouldShowMenu" 
      class="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom"
    >
      <!-- Background with blur effect -->
      <div class="absolute inset-0 bg-base-100/95 backdrop-blur-xl border-t border-base-300/50"></div>
      
      <!-- Content -->
      <div class="relative flex items-center justify-around max-w-md mx-auto px-6 py-2">
        <!-- Dashboard -->
        <router-link
          to="/"
          class="flex flex-col items-center justify-center gap-1 px-4 py-1.5 rounded-xl transition-all duration-200 min-w-[60px] relative group"
          :class="$route.path === '/' || $route.path.startsWith('/interventions/') && $route.path !== '/interventions/new' 
            ? 'text-primary scale-105' 
            : 'text-base-content/60 active:scale-95'"
        >
          <!-- Active indicator -->
          <div 
            v-if="$route.path === '/' || ($route.path.startsWith('/interventions/') && $route.path !== '/interventions/new')"
            class="absolute inset-0 bg-primary/10 rounded-2xl"
          ></div>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            class="h-5 w-5 relative z-10 transition-transform duration-200"
            :class="$route.path === '/' || ($route.path.startsWith('/interventions/') && $route.path !== '/interventions/new') ? 'scale-110' : ''"
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            stroke-width="2.5"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span class="text-[10px] font-medium relative z-10">Dashboard</span>
        </router-link>

        <!-- FAB - Create Intervention -->
        <div class="flex-1 flex justify-center -mt-8 relative z-20">
          <router-link
            to="/interventions/new"
            class="btn btn-primary btn-circle w-14 h-14 shadow-xl hover:shadow-primary/50 transition-all duration-300 hover:scale-110 active:scale-95 border-4 border-base-100"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              class="h-6 w-6" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              stroke-width="3"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </router-link>
        </div>

        <!-- Settings -->
        <router-link
          to="/settings"
          class="flex flex-col items-center justify-center gap-1 px-4 py-1.5 rounded-xl transition-all duration-200 min-w-[60px] relative group"
          :class="$route.path === '/settings' 
            ? 'text-primary scale-105' 
            : 'text-base-content/60 active:scale-95'"
        >
          <!-- Active indicator -->
          <div 
            v-if="$route.path === '/settings'"
            class="absolute inset-0 bg-primary/10 rounded-2xl"
          ></div>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            class="h-5 w-5 relative z-10 transition-transform duration-200"
            :class="$route.path === '/settings' ? 'scale-110' : ''"
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            stroke-width="2.5"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span class="text-[10px] font-medium relative z-10">Settings</span>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAutoSync } from './composables/useAutoSync'

const route = useRoute()

// Initialize automatic sync
useAutoSync()

// Hide bottom menu on intervention pages (create, edit, detail)
const shouldShowMenu = computed(() => {
  const routeName = route.name
  const path = route.path || ''
  
  // Hide on create page
  if (routeName === 'NewIntervention' || path === '/interventions/new') {
    return false
  }
  
  // Hide on edit page
  if (routeName === 'EditIntervention' || path.endsWith('/edit') || path.includes('/edit')) {
    return false
  }
  
  // Hide on intervention detail page
  if (routeName === 'InterventionDetail' || (path.startsWith('/interventions/') && !path.includes('/new') && !path.includes('/edit'))) {
    return false
  }
  
  return true
})
</script>
