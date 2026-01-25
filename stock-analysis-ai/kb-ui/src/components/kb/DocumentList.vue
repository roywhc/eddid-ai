<template>
  <div class="document-list">
    <div v-if="documents.length === 0 && !isLoading" class="empty-state text-center py-12">
      <p class="text-gray-500">No documents found</p>
      <p class="text-sm text-gray-400 mt-2">Create your first document to get started</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <DocumentCard
        v-for="document in documents"
        :key="document.doc_id"
        :document="document"
        @view="$emit('view', $event)"
        @edit="$emit('edit', $event)"
        @delete="$emit('delete', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import DocumentCard from './DocumentCard.vue'
import type { KBDocument } from '@/services/documents.service'

interface Props {
  documents: KBDocument[]
  isLoading?: boolean
}

withDefaults(defineProps<Props>(), {
  isLoading: false
})

defineEmits<{
  view: [document: KBDocument]
  edit: [document: KBDocument]
  delete: [document: KBDocument]
}>()
</script>
