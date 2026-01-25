import apiClient from './api/client'
import type { KBUpdateRequest } from '@/types/api.types'

export interface KBDocument {
  doc_id: string
  kb_id: string
  title: string
  doc_type: string
  content: string
  version: string
  created_at: string
  updated_at: string
  created_by: string
  approved_by?: string | null
  language: string
  tags: string[]
  status: string
  chunks?: number
}

export interface DocumentsListResponse {
  items: KBDocument[]
  total?: number
  limit: number
  offset: number
}

export const documentsService = {
  /**
   * List documents with pagination
   */
  async listDocuments(params: {
    kb_id?: string
    limit?: number
    offset?: number
  }): Promise<DocumentsListResponse> {
    const response = await apiClient.get<DocumentsListResponse>('/kb/documents', { params })
    return response.data
  },

  /**
   * Get document by ID
   */
  async getDocument(docId: string): Promise<KBDocument> {
    const response = await apiClient.get<KBDocument>(`/kb/documents/${docId}`)
    return response.data
  },

  /**
   * Create a new document
   */
  async createDocument(data: KBUpdateRequest): Promise<KBDocument> {
    const response = await apiClient.post<KBDocument>('/kb/documents', data)
    return response.data
  },

  /**
   * Update an existing document
   */
  async updateDocument(docId: string, data: KBUpdateRequest): Promise<KBDocument> {
    const response = await apiClient.put<KBDocument>(`/kb/documents/${docId}`, data)
    return response.data
  },

  /**
   * Delete a document
   */
  async deleteDocument(docId: string): Promise<void> {
    await apiClient.delete(`/kb/documents/${docId}`)
  }
}
