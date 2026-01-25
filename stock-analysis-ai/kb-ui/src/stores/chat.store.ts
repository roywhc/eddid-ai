import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { chatService, type StreamChunk } from '@/services/chat.service'
import { useSessionStore } from './session.store'
import type { ChatMessage, ChatSession } from '@/types/models.types'
import type { ChatRequest, ChatResponse } from '@/types/api.types'
import { MAX_MESSAGES_PER_SESSION } from '@/utils/constants'

export const useChatStore = defineStore('chat', () => {
  const sessionStore = useSessionStore()
  
  const messages = ref<ChatMessage[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const currentSessionId = computed(() => sessionStore.sessionId)

  /**
   * Load session from localStorage
   */
  function loadSession(sessionId: string) {
    const stored = localStorage.getItem(`kb_chat_session_${sessionId}`)
    if (stored) {
      try {
        const session: ChatSession = JSON.parse(stored)
        messages.value = session.messages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
        sessionStore.saveSessionToStorage(sessionId)
      } catch (e) {
        console.error('Error loading session:', e)
        messages.value = []
      }
    } else {
      messages.value = []
    }
  }

  /**
   * Save session to localStorage
   */
  function saveSession() {
    if (!currentSessionId.value) return
    
    const session: ChatSession = {
      sessionId: currentSessionId.value,
      messages: messages.value.slice(-MAX_MESSAGES_PER_SESSION), // Keep last 50 messages
      createdAt: messages.value[0]?.timestamp || new Date(),
      lastActivityAt: messages.value[messages.value.length - 1]?.timestamp || new Date()
    }
    
    localStorage.setItem(`kb_chat_session_${currentSessionId.value}`, JSON.stringify(session))
  }

  /**
   * Clear current session
   */
  function clearSession() {
    messages.value = []
    error.value = null
    if (currentSessionId.value) {
      sessionStore.clearSessionFromStorage(currentSessionId.value)
    }
  }

  /**
   * Add a message to the conversation
   */
  function addMessage(message: ChatMessage) {
    messages.value.push(message)
    saveSession()
  }

  /**
   * Send a query to the chat API
   */
  async function sendQuery(query: string): Promise<ChatResponse | null> {
    if (!query.trim()) {
      error.value = 'Query cannot be empty'
      return null
    }

    isLoading.value = true
    error.value = null

    // Add user message immediately
    const userMessage: ChatMessage = {
      role: 'user',
      content: query,
      timestamp: new Date()
    }
    addMessage(userMessage)

    try {
      // Build conversation history for context
      const conversationHistory = messages.value
        .slice(-MAX_MESSAGES_PER_SESSION)
        .map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp.toISOString()
        }))

      const request: ChatRequest = {
        query,
        session_id: currentSessionId.value || null,
        include_sources: false,
        use_external_kb: true,
        conversation_history: conversationHistory
      }

      const response = await chatService.sendQuery(request)

      // Save session ID
      if (response.session_id) {
        sessionStore.saveSessionToStorage(response.session_id)
      }

      // Add assistant message
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.answer,
        timestamp: new Date(response.timestamp),
        citations: response.sources,
        confidenceScore: response.confidence_score,
        processingTimeMs: response.processing_time_ms
      }
      addMessage(assistantMessage)

      return response
    } catch (err: any) {
      error.value = err.userMessage || err.message || 'Failed to send query'
      return null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Send a query with streaming response
   */
  async function sendQueryStream(query: string): Promise<ChatResponse | null> {
    if (!query.trim()) {
      error.value = 'Query cannot be empty'
      return null
    }

    isLoading.value = true
    error.value = null

    // Add user message immediately
    const userMessage: ChatMessage = {
      role: 'user',
      content: query,
      timestamp: new Date()
    }
    addMessage(userMessage)

    // Create assistant message placeholder for streaming
    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      citations: [],
      confidenceScore: 0,
      processingTimeMs: 0
    }
    messages.value.push(assistantMessage)

    try {
      // Build conversation history for context
      const conversationHistory = messages.value
        .slice(0, -1) // Exclude the placeholder message we just added
        .slice(-MAX_MESSAGES_PER_SESSION)
        .map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp.toISOString()
        }))

      const request: ChatRequest = {
        query,
        session_id: currentSessionId.value || null,
        include_sources: false,
        use_external_kb: true,
        conversation_history: conversationHistory
      }

      let fullAnswer = ''
      let finalResponse: ChatResponse | null = null

      // Process streaming chunks
      for await (const chunk of chatService.sendQueryStream(request)) {
        if (chunk.type === 'chunk' && chunk.content) {
          // Append chunk to answer
          fullAnswer += chunk.content
          // Update the assistant message in real-time
          const lastMessage = messages.value[messages.value.length - 1]
          if (lastMessage && lastMessage.role === 'assistant') {
            lastMessage.content = fullAnswer
          }
        } else if (chunk.type === 'complete') {
          // Finalize the response
          finalResponse = {
            session_id: chunk.session_id || currentSessionId.value || '',
            query: chunk.query || query,
            answer: chunk.answer || fullAnswer,
            sources: chunk.sources || [],
            confidence_score: chunk.confidence_score || 0,
            used_internal_kb: chunk.used_internal_kb || false,
            used_external_kb: chunk.used_external_kb || false,
            processing_time_ms: chunk.processing_time_ms || 0,
            timestamp: chunk.timestamp || new Date().toISOString()
          }

          // Update the assistant message with final data
          const lastMessage = messages.value[messages.value.length - 1]
          if (lastMessage && lastMessage.role === 'assistant') {
            lastMessage.content = finalResponse.answer
            lastMessage.citations = finalResponse.sources
            lastMessage.confidenceScore = finalResponse.confidence_score
            lastMessage.processingTimeMs = finalResponse.processing_time_ms
            lastMessage.timestamp = new Date(finalResponse.timestamp)
          }

          // Save session ID
          if (finalResponse.session_id) {
            sessionStore.saveSessionToStorage(finalResponse.session_id)
          }

          saveSession()
        } else if (chunk.type === 'error') {
          error.value = chunk.message || 'Streaming error occurred'
          // Remove the placeholder message on error
          messages.value.pop()
          return null
        }
      }

      return finalResponse
    } catch (err: any) {
      error.value = err.userMessage || err.message || 'Failed to send query'
      // Remove the placeholder message on error
      messages.value.pop()
      return null
    } finally {
      isLoading.value = false
    }
  }

  return {
    messages: computed(() => messages.value),
    isLoading: computed(() => isLoading.value),
    error: computed({
      get: () => error.value,
      set: (value: string | null) => { error.value = value }
    }),
    currentSessionId,
    loadSession,
    clearSession,
    addMessage,
    sendQuery,
    sendQueryStream
  }
})
