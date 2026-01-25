<template>
  <Card variant="default" padding="md">
    <template #header>
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-gray-900">{{ document.title }}</h3>
          <p class="text-sm text-gray-500 mt-1">{{ document.kb_id }}</p>
        </div>
        <span
          :class="[
            'px-2 py-1 text-xs font-medium rounded',
            statusClasses[document.status] || 'bg-gray-100 text-gray-800'
          ]"
        >
          {{ document.status }}
        </span>
      </div>
    </template>

    <div class="document-content">
      <p class="text-sm text-gray-600 line-clamp-3">{{ truncatedContent }}</p>
      <div class="flex flex-wrap gap-2 mt-3">
        <span
          v-for="tag in document.tags"
          :key="tag"
          class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
        >
          {{ tag }}
        </span>
      </div>
      <div class="mt-3 text-xs text-gray-500">
        <span>Type: {{ document.doc_type }}</span>
        <span class="ml-4">Language: {{ document.language }}</span>
        <span v-if="document.chunks" class="ml-4">Chunks: {{ document.chunks }}</span>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between">
        <div class="text-xs text-gray-500">
          Updated: {{ formatDate(document.updated_at) }}
        </div>
        <div class="flex gap-2">
          <Button variant="outline" size="sm" @click="$emit('view', document)">
            View
          </Button>
          <Button variant="outline" size="sm" @click="$emit('edit', document)">
            Edit
          </Button>
          <Button variant="danger" size="sm" @click="$emit('delete', document)">
            Delete
          </Button>
        </div>
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Card from '../common/Card.vue'
import Button from '../common/Button.vue'
import { formatDate, truncateText } from '@/utils/formatters'
import type { KBDocument } from '@/services/documents.service'

interface Props {
  document: KBDocument
}

const props = defineProps<Props>()

defineEmits<{
  view: [document: KBDocument]
  edit: [document: KBDocument]
  delete: [document: KBDocument]
}>()

const statusClasses: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  archived: 'bg-yellow-100 text-yellow-800',
  deleted: 'bg-red-100 text-red-800'
}

const truncatedContent = computed(() => {
  return truncateText(props.document.content, 150)
})
</script>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
