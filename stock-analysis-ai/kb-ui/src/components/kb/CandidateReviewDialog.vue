<template>
  <div v-if="visible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
      <div class="p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold">Review Candidate</h2>
          <button
            class="text-gray-400 hover:text-gray-600"
            @click="$emit('close')"
          >
            ✕
          </button>
        </div>

        <div v-if="candidate" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <Input
              v-model="reviewData.title"
              :required="true"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Content</label>
            <textarea
              v-model="reviewData.content"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="10"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Review Notes</label>
            <textarea
              v-model="reviewData.notes"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Optional notes about this review"
            />
          </div>

          <div class="flex gap-2 justify-end pt-4 border-t">
            <Button variant="secondary" @click="$emit('close')">
              Cancel
            </Button>
            <Button
              variant="danger"
              @click="handleReject"
              :loading="loading"
            >
              Reject
            </Button>
            <Button
              variant="outline"
              @click="handleModifyAndApprove"
              :loading="loading"
            >
              Modify & Approve
            </Button>
            <Button
              variant="primary"
              @click="handleApprove"
              :loading="loading"
            >
              Approve
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import Input from '../common/Input.vue'
import Button from '../common/Button.vue'
import type { KBCandidate } from '@/services/candidates.service'

interface Props {
  visible: boolean
  candidate: KBCandidate | null
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<{
  close: []
  approve: [data: { reviewer: string; notes?: string | null }]
  reject: [data: { reviewer: string; notes?: string | null }]
  'modify-and-approve': [data: { reviewer: string; notes?: string | null; document: any }]
}>()

const reviewData = ref({
  title: '',
  content: '',
  notes: ''
})

// Update form when candidate changes
watch(
  () => props.candidate,
  (candidate) => {
    if (candidate) {
      reviewData.value = {
        title: candidate.title,
        content: candidate.content,
        notes: ''
      }
    }
  },
  { immediate: true }
)

function handleApprove() {
  emit('approve', {
    reviewer: 'admin', // TODO: Get from auth context
    notes: reviewData.value.notes || null
  })
}

function handleReject() {
  emit('reject', {
    reviewer: 'admin', // TODO: Get from auth context
    notes: reviewData.value.notes || null
  })
}

function handleModifyAndApprove() {
  emit('modify-and-approve', {
    reviewer: 'admin', // TODO: Get from auth context
    notes: reviewData.value.notes || null,
    document: {
      kb_id: props.candidate?.suggested_kb_id || '',
      title: reviewData.value.title,
      content: reviewData.value.content,
      doc_type: 'article',
      language: 'en',
      tags: []
    }
  })
}
</script>
