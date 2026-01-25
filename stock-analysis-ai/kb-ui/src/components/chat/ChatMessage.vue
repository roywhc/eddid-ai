<template>
  <div :class="messageClasses">
    <div class="message-header">
      <span class="font-semibold">{{ role === 'user' ? 'You' : 'Assistant' }}</span>
      <span class="text-sm text-gray-500 ml-2">{{ formatTime(timestamp) }}</span>
      <span v-if="confidenceScore !== undefined" class="text-xs text-gray-400 ml-2">
        ({{ formatConfidence(confidenceScore) }})
      </span>
    </div>
    <div class="message-content" v-html="formattedContent"></div>
    <div v-if="citations && citations.length > 0" class="mt-2">
      <CitationList :citations="citations" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ChatMessage as ChatMessageType } from '@/types/models.types'
import type { Citation } from '@/types/api.types'
import { formatRelativeTime, formatConfidenceScore } from '@/utils/formatters'
import CitationList from './CitationList.vue'

interface Props {
  message: ChatMessageType
}

const props = defineProps<Props>()

defineEmits<{
  citationClick: [citation: Citation]
}>()

const role = computed(() => props.message.role)
const timestamp = computed(() => props.message.timestamp)
const content = computed(() => props.message.content)
const citations = computed(() => props.message.citations)
const confidenceScore = computed(() => props.message.confidenceScore)

const messageClasses = computed(() => {
  const base = 'message p-4 rounded-lg mb-4'
  return role.value === 'user'
    ? `${base} bg-blue-50 ml-auto max-w-[80%]`
    : `${base} bg-gray-50 mr-auto max-w-[80%]`
})

const formattedContent = computed(() => {
  // Simple formatting - in production, use a proper markdown renderer
  return content.value
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
})

function formatTime(date: Date): string {
  return formatRelativeTime(date)
}

function formatConfidence(score: number): string {
  return formatConfidenceScore(score)
}
</script>

<style scoped>
.message-content {
  @apply mt-2 text-gray-800;
}
</style>
