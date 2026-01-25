import apiClient from './api/client'
import type { ChatRequest, ChatResponse } from '@/types/api.types'

export interface StreamChunk {
  type: 'chunk' | 'complete' | 'error'
  content?: string
  session_id?: string
  query?: string
  answer?: string
  sources?: any[]
  confidence_score?: number
  used_internal_kb?: boolean
  used_external_kb?: boolean
  processing_time_ms?: number
  timestamp?: string
  message?: string
}

export const chatService = {
  /**
   * Send a chat query to the API (non-streaming)
   */
  async sendQuery(request: ChatRequest): Promise<ChatResponse> {
    const response = await apiClient.post<ChatResponse>('/chat/query', request)
    return response.data
  },

  /**
   * Send a chat query with streaming response
   */
  async *sendQueryStream(request: ChatRequest): AsyncGenerator<StreamChunk, void, unknown> {
    const baseURL = apiClient.defaults.baseURL || 'http://localhost:8000/api/v1'
    const url = `${baseURL}/chat/query/stream`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
      throw new Error(error.detail || `HTTP ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('Response body is not readable')
    }

    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        
        if (done) {
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6) // Remove 'data: ' prefix
            
            if (data === '[DONE]') {
              return
            }

            try {
              const chunk: StreamChunk = JSON.parse(data)
              yield chunk
              
              // If we got a complete or error, we're done
              if (chunk.type === 'complete' || chunk.type === 'error') {
                return
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', data, e)
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }
}
