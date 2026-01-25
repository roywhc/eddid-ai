<template>
  <Transition name="toast">
    <div
      v-if="visible"
      :class="[
        'fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md',
        toastClasses
      ]"
    >
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <span v-if="type === 'success'" class="text-2xl">✓</span>
          <span v-else-if="type === 'error'" class="text-2xl">✕</span>
          <span v-else-if="type === 'warning'" class="text-2xl">⚠</span>
          <span v-else class="text-2xl">ℹ</span>
        </div>
        <div class="ml-3 flex-1">
          <p class="text-sm font-medium">{{ message }}</p>
          <p v-if="description" class="mt-1 text-sm opacity-90">{{ description }}</p>
          <div v-if="action" class="mt-2">
            <Button
              :variant="type === 'error' ? 'danger' : 'primary'"
              size="sm"
              @click="handleAction"
            >
              {{ action.label }}
            </Button>
          </div>
        </div>
        <button
          class="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600"
          @click="$emit('close')"
        >
          ✕
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Button from './Button.vue'

interface Props {
  visible: boolean
  type?: 'success' | 'error' | 'warning' | 'info'
  message: string
  description?: string
  action?: {
    label: string
    handler: () => void
  }
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info'
})

defineEmits<{
  close: []
}>()

const toastClasses = computed(() => {
  const base = 'border-l-4'
  const types = {
    success: 'bg-green-50 border-green-500 text-green-800',
    error: 'bg-red-50 border-red-500 text-red-800',
    warning: 'bg-yellow-50 border-yellow-500 text-yellow-800',
    info: 'bg-blue-50 border-blue-500 text-blue-800'
  }
  return `${base} ${types[props.type]}`
})

function handleAction() {
  if (props.action) {
    props.action.handler()
  }
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
