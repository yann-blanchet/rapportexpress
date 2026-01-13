<template>
  <div
    class="flex flex-col gap-2"
    @contextmenu.prevent="$emit('show-menu', $event)"
    @touchstart="$emit('touch-start')"
    @touchend="$emit('touch-end')"
  >
    <!-- Entry Content -->
    <div class="flex items-start">
      <!-- Entry Bubble -->
      <div class="flex-1 bg-base-100 rounded-lg p-2 relative group">
        <!-- Action buttons (3-dot menu and delete) -->
        <div class="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <!-- Delete button -->
          <button
            type="button"
            @click.stop="$emit('delete')"
            class="btn btn-xs btn-error btn-circle"
            title="Delete entry"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          <!-- 3-dot menu -->
          <button
            type="button"
            @click.stop="$emit('show-menu', $event)"
            class="btn btn-xs btn-ghost btn-circle"
            title="More options"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>

        <!-- Text Entry -->
        <div v-if="entry.type === 'text'" class="mb-1">
          <p class="text-sm whitespace-pre-wrap">{{ entry.text }}</p>
        </div>

        <!-- Photo Entry -->
        <div v-else-if="entry.type === 'photo'" class="mb-1">
          <div v-if="photo" class="relative">
            <img
              :src="photoUrl"
              alt="Photo"
              class="w-full max-w-xs rounded-lg cursor-pointer"
              @click="$emit('view-photo')"
              @error="$emit('image-error', $event)"
            />
            <div v-if="entry.status === 'uploading'" class="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center z-10">
              <span class="loading loading-spinner loading-md text-white"></span>
            </div>
          </div>
          <div v-else class="text-xs text-base-content/70">Photo not found</div>
        </div>

        <!-- Audio Entry -->
        <div v-else-if="entry.type === 'audio'" class="mb-1">
          <div v-if="entry.status === 'transcribing'" class="flex items-center gap-2">
            <span class="loading loading-spinner loading-sm"></span>
            <span class="text-xs">Transcribing...</span>
          </div>
          <div v-else-if="entry.status === 'pending'" class="flex items-center gap-2">
            <span class="badge badge-warning badge-sm">Pending transcription</span>
          </div>
          <div v-else-if="entry.transcription">
            <p class="text-sm">{{ entry.transcription }}</p>
            <div v-if="entry.pending_audio_id" class="text-xs text-base-content/70 mt-1">
              Audio stored locally
            </div>
          </div>
          <div v-else class="text-xs text-base-content/70">
            Processing audio...
          </div>
        </div>

        <!-- Footer: Category (left) + Time + Sync Status (right) -->
        <div class="flex items-center justify-between mt-1 pt-1 border-t border-base-300/50">
          <!-- Category Badge (left) -->
          <div>
            <span v-if="entry.category" class="badge badge-xs badge-primary">
              {{ categoryName }}
            </span>
          </div>
          
          <!-- Time + Sync Status (right) -->
          <div class="flex items-center gap-2">
            <span class="text-xs text-base-content/70">{{ formattedTime }}</span>
            <!-- Sync Status Icons -->
            <div v-if="entry.type === 'photo'">
              <div v-if="entry.status === 'pending'" class="badge badge-xs badge-warning" title="Pending upload">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div v-else-if="entry.status === 'completed' && photo?.url_cloud" class="badge badge-xs badge-success opacity-70" title="Synced">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  entry: {
    type: Object,
    required: true
  },
  categoryName: {
    type: String,
    default: ''
  },
  photo: {
    type: Object,
    default: null
  },
  photoUrl: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['delete', 'show-menu', 'view-photo', 'image-error', 'touch-start', 'touch-end'])

const formattedTime = computed(() => {
  if (!props.entry.created_at) return ''
  const date = new Date(props.entry.created_at)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
})
</script>
