<template>
  <div class="component-status flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
    <span class="text-sm text-gray-700">{{ component }}</span>
    <span
      :class="[
        'px-2 py-1 text-xs font-medium rounded',
        statusClass
      ]"
    >
      {{ status }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  component: string
  status: string
}

defineProps<Props>()

const statusClass = computed(() => {
  const statusLower = props.status.toLowerCase()
  if (statusLower.includes('healthy') || statusLower === 'ok') {
    return 'bg-green-100 text-green-800'
  } else if (statusLower.includes('degraded') || statusLower.includes('warning')) {
    return 'bg-yellow-100 text-yellow-800'
  } else {
    return 'bg-red-100 text-red-800'
  }
})
</script>
