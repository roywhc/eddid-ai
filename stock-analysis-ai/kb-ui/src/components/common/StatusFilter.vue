<template>
  <select
    :value="modelValue"
    :disabled="disabled"
    :class="selectClasses"
    @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
  >
    <option value="">All Statuses</option>
    <option v-for="status in statuses" :key="status" :value="status">
      {{ formatStatus(status) }}
    </option>
  </select>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue: string
  statuses: string[]
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
})

defineEmits<{
  'update:modelValue': [value: string]
}>()

const selectClasses = computed(() => {
  const base = 'px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
  const disabledClass = props.disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
  return `${base} ${disabledClass} border-gray-300`
})

function formatStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}
</script>
