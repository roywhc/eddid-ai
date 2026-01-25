<template>
  <div class="pagination flex items-center justify-between">
    <div class="pagination-info text-sm text-gray-600">
      Showing {{ startItem }} to {{ endItem }} of {{ total || 0 }} results
    </div>
    <div class="pagination-controls flex gap-2">
      <Button
        variant="outline"
        size="sm"
        :disabled="!hasPrev"
        @click="$emit('prev')"
      >
        Previous
      </Button>
      <div class="flex items-center gap-1">
        <button
          v-for="page in visiblePages"
          :key="page"
          :class="[
            'px-3 py-1 rounded text-sm',
            page === currentPage
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
          ]"
          @click="$emit('go-to-page', page)"
        >
          {{ page }}
        </button>
      </div>
      <Button
        variant="outline"
        size="sm"
        :disabled="!hasNext"
        @click="$emit('next')"
      >
        Next
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Button from './Button.vue'

interface Props {
  currentPage: number
  totalPages: number
  total?: number
  pageSize: number
}

const props = defineProps<Props>()

defineEmits<{
  prev: []
  next: []
  'go-to-page': [page: number]
}>()

const hasPrev = computed(() => props.currentPage > 1)
const hasNext = computed(() => props.currentPage < props.totalPages)

const startItem = computed(() => {
  if (props.total === 0) return 0
  return (props.currentPage - 1) * props.pageSize + 1
})

const endItem = computed(() => {
  const end = props.currentPage * props.pageSize
  return props.total !== undefined ? Math.min(end, props.total) : end
})

const visiblePages = computed(() => {
  const pages: (number | string)[] = []
  const total = props.totalPages
  const current = props.currentPage

  if (total <= 7) {
    // Show all pages if 7 or fewer
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    // Always show first page
    pages.push(1)

    if (current > 3) {
      pages.push('...')
    }

    // Show pages around current
    const start = Math.max(2, current - 1)
    const end = Math.min(total - 1, current + 1)

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    if (current < total - 2) {
      pages.push('...')
    }

    // Always show last page
    pages.push(total)
  }

  return pages
})
</script>

<style scoped>
.pagination {
  @apply py-4;
}
</style>
