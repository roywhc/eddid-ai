import apiClient from './api/client'
import type { ChatRequest, ChatResponse } from '@/types/api.types'

export const chatService = {
  /**
   * Send a chat query to the API
   */
  async sendQuery(request: ChatRequest): Promise<ChatResponse> {
    const response = await apiClient.post<ChatResponse>('/chat/query', request)
    return response.data
  }
}
