<template>
  <div class="citations">
    <div class="text-xs font-semibold text-gray-600 mb-2">Sources:</div>
    <div class="flex flex-wrap gap-2">
      <a
        v-for="(citation, index) in citations"
        :key="index"
        :href="citation.url || '#'"
        :target="citation.url ? '_blank' : undefined"
        :rel="citation.url ? 'noopener noreferrer' : undefined"
        class="citation-link"
        @click="handleCitationClick(citation, $event)"
      >
        <span class="citation-badge">
          {{ citation.source === 'internal' ? '📄' : '🌐' }}
          {{ citation.documentTitle || citation.url || `Source ${index + 1}` }}
        </span>
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Citation } from '@/types/api.types'

interface Props {
  citations: Citation[]
}

defineProps<Props>()

const emit = defineEmits<{
  citationClick: [citation: Citation]
}>()

function handleCitationClick(citation: Citation, event: MouseEvent) {
  emit('citationClick', citation)
  
  // If it's an internal citation without URL, prevent default navigation
  if (citation.source === 'internal' && !citation.url) {
    event.preventDefault()
  }
}
</script>

<style scoped>
.citation-link {
  @apply no-underline;
}

.citation-badge {
  @apply inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors;
}
</style>
