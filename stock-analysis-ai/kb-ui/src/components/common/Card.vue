<template>
  <div :class="cardClasses">
    <div v-if="$slots.header" class="card-header">
      <slot name="header" />
    </div>
    <div class="card-body">
      <slot />
    </div>
    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'default' | 'outlined' | 'elevated'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  padding: 'md'
})

const cardClasses = computed(() => {
  const base = 'rounded-lg'
  
  const variants = {
    default: 'bg-white border border-gray-200',
    outlined: 'border-2 border-gray-300 bg-white',
    elevated: 'bg-white shadow-lg'
  }
  
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  }
  
  return `${base} ${variants[props.variant]} ${paddings[props.padding]}`
})
</script>

<style scoped>
.card-header {
  @apply border-b border-gray-200 pb-3 mb-3;
}

.card-footer {
  @apply border-t border-gray-200 pt-3 mt-3;
}
</style>
