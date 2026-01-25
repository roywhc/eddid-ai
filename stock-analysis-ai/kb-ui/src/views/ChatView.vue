<template>
  <div class="chat-view h-screen flex flex-col">
    <div class="chat-header bg-white border-b border-gray-200 p-4">
      <h1 class="text-2xl font-bold">Chat with AI Knowledge Base</h1>
      <p class="text-sm text-gray-600 mt-1">Ask questions and get answers with citations</p>
    </div>
    
    <div class="chat-messages flex-1 overflow-y-auto p-4 bg-gray-50">
      <div v-if="messages.length === 0" class="empty-state text-center py-12">
        <p class="text-gray-500">Start a conversation by asking a question below</p>
      </div>
      
      <ChatMessage
        v-for="(message, index) in messages"
        :key="index"
        :message="message"
        @citation-click="handleCitationClick"
      />
      
      <LoadingIndicator
        v-if="isLoading"
        :visible="true"
        message="Thinking..."
        size="md"
      />
    </div>
    
    <div v-if="error" class="error-banner bg-red-50 border-l-4 border-red-500 p-4 mx-4 mb-2">
      <div class="flex items-center">
        <span class="text-red-600 font-medium">{{ error }}</span>
        <Button
          variant="outline"
          size="sm"
          class="ml-auto"
          @click="clearError"
        >
          Dismiss
        </Button>
      </div>
    </div>
    
    <div class="chat-input-container bg-white border-t border-gray-200 p-4">
      <ChatInput
        :disabled="isLoading"
        :loading="isLoading"
        @submit="handleQuerySubmit"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useChatStore } from '@/stores/chat.store'
import { useSession } from '@/composables/useSession'
import ChatMessage from '@/components/chat/ChatMessage.vue'
import ChatInput from '@/components/chat/ChatInput.vue'
import LoadingIndicator from '@/components/common/LoadingIndicator.vue'
import Button from '@/components/common/Button.vue'
import type { Citation } from '@/types/api.types'

const chatStore = useChatStore()
const { loadSession } = useSession()

const messages = computed(() => chatStore.messages)
const isLoading = computed(() => chatStore.isLoading)
const error = computed(() => chatStore.error)

onMounted(() => {
  // Load session if available
  if (chatStore.currentSessionId) {
    loadSession(chatStore.currentSessionId)
  }
})

function handleQuerySubmit(query: string) {
  chatStore.sendQuery(query)
}

function handleCitationClick(citation: Citation) {
  if (citation.url) {
    window.open(citation.url, '_blank', 'noopener,noreferrer')
  } else if (citation.document_id) {
    // Navigate to document view (to be implemented in Phase 4)
    console.log('Navigate to document:', citation.document_id)
  }
}

function clearError() {
  // Clear error by accessing the store's error ref directly
  // Note: This requires exposing a method in the store
  chatStore.error = null
}
</script>

<style scoped>
.chat-view {
  @apply flex flex-col;
}

.chat-messages {
  @apply flex-1 overflow-y-auto;
}

.empty-state {
  @apply text-center py-12;
}
</style>
