<template>
  <div v-if="visible" class="loading-indicator" :class="sizeClass">
    <div class="spinner"></div>
    <span v-if="message" class="ml-2">{{ message }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  visible: boolean
  message?: string
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md'
})

const sizeClass = computed(() => {
  const sizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }
  return sizes[props.size]
})
</script>

<style scoped>
.loading-indicator {
  @apply flex items-center justify-center p-4;
}

.spinner {
  @apply animate-spin rounded-full border-2 border-gray-300 border-t-blue-600;
  width: 1.5rem;
  height: 1.5rem;
}
</style>
