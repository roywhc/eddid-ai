<template>
  <div class="candidate-list">
    <div v-if="candidates.length === 0 && !isLoading" class="empty-state text-center py-12">
      <p class="text-gray-500">No candidates found</p>
      <p class="text-sm text-gray-400 mt-2">Candidates will appear here when generated from external knowledge</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <CandidateCard
        v-for="candidate in candidates"
        :key="candidate.candidate_id"
        :candidate="candidate"
        @review="$emit('review', $event)"
        @reimport="$emit('reimport', $event)"
        @delete-document="$emit('deleteDocument', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import CandidateCard from './CandidateCard.vue'
import type { KBCandidate } from '@/services/candidates.service'

interface Props {
  candidates: KBCandidate[]
  isLoading?: boolean
}

withDefaults(defineProps<Props>(), {
  isLoading: false
})

defineEmits<{
  review: [candidate: KBCandidate]
  reimport: [candidate: KBCandidate]
  deleteDocument: [docId: string]
}>()
</script>
