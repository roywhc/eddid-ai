<template>
  <Card variant="default" padding="md">
    <template #header>
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-gray-900">{{ candidate.title }}</h3>
          <p class="text-sm text-gray-500 mt-1">{{ candidate.suggested_kb_id }}</p>
        </div>
        <span
          :class="[
            'px-2 py-1 text-xs font-medium rounded',
            statusClasses[candidate.status] || 'bg-gray-100 text-gray-800'
          ]"
        >
          {{ candidate.status }}
        </span>
      </div>
    </template>

    <div class="candidate-content">
      <p class="text-sm text-gray-600 line-clamp-3">{{ truncatedContent }}</p>
      <div class="mt-3 text-xs text-gray-500 space-y-1">
        <div>
          <span class="font-medium">Source:</span> {{ candidate.source_type }}
        </div>
        <div v-if="candidate.external_urls.length > 0">
          <span class="font-medium">URLs:</span>
          <a
            v-for="(url, index) in candidate.external_urls.slice(0, 2)"
            :key="index"
            :href="url"
            target="_blank"
            rel="noopener noreferrer"
            class="text-blue-600 hover:underline ml-1"
          >
            {{ index + 1 }}
          </a>
          <span v-if="candidate.external_urls.length > 2" class="text-gray-400">
            +{{ candidate.external_urls.length - 2 }} more
          </span>
        </div>
        <div>
          <span class="font-medium">Hit Count:</span> {{ candidate.hit_count }}
        </div>
        <div v-if="candidate.reviewed_by">
          <span class="font-medium">Reviewed by:</span> {{ candidate.reviewed_by }}
        </div>
        <div v-if="candidate.doc_id" class="text-blue-600">
          <span class="font-medium">Document:</span> {{ candidate.doc_id }}
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between">
        <div class="text-xs text-gray-500">
          Extracted: {{ formatDate(candidate.extracted_on) }}
        </div>
        <div class="flex gap-2">
          <Button
            v-if="candidate.status === 'pending'"
            variant="primary"
            size="sm"
            @click="$emit('review', candidate)"
          >
            Review
          </Button>
          <Button
            v-if="candidate.status === 'approved' || candidate.status === 'modified'"
            variant="outline"
            size="sm"
            @click="handleReimport"
          >
            Reimport
          </Button>
          <Button
            v-if="candidate.doc_id"
            variant="danger"
            size="sm"
            @click="$emit('deleteDocument', candidate.doc_id)"
          >
            Delete Document
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
import type { KBCandidate } from '@/services/candidates.service'

interface Props {
  candidate: KBCandidate
}

const props = defineProps<Props>()

const emit = defineEmits<{
  review: [candidate: KBCandidate]
  reimport: [candidate: KBCandidate]
  deleteDocument: [docId: string]
}>()

function handleReimport() {
  console.log('CandidateCard: handleReimport called for candidate:', props.candidate.candidate_id)
  emit('reimport', props.candidate)
}

const statusClasses: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  modified: 'bg-blue-100 text-blue-800'
}

const truncatedContent = computed(() => {
  return truncateText(props.candidate.content, 150)
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
