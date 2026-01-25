import apiClient from './api/client'
import type { CandidateApproveRequest, CandidateRejectRequest, CandidateModifyRequest } from '@/types/api.types'

export interface KBCandidate {
  candidate_id: string
  original_query: string
  source_type: string
  title: string
  content: string
  suggested_kb_id: string
  suggested_category?: string | null
  external_urls: string[]
  extracted_on: string
  status: 'pending' | 'approved' | 'rejected' | 'modified'
  reviewed_by?: string | null
  review_notes?: string | null
  hit_count: number
  doc_id?: string | null  // Link to document if approved
}

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

export const candidatesService = {
  /**
   * List candidates with filters
   */
  async listCandidates(params: {
    kb_id?: string
    status?: 'pending' | 'approved' | 'rejected' | 'modified'
    limit?: number
    offset?: number
  }): Promise<KBCandidate[]> {
    const response = await apiClient.get<KBCandidate[]>('/kb/candidates', { params })
    return response.data
  },

  /**
   * Get candidate by ID
   */
  async getCandidate(candidateId: string): Promise<KBCandidate> {
    const response = await apiClient.get<KBCandidate>(`/kb/candidates/${candidateId}`)
    return response.data
  },

  /**
   * Approve a candidate
   */
  async approveCandidate(candidateId: string, data: CandidateApproveRequest): Promise<KBDocument> {
    const response = await apiClient.post<KBDocument>(`/kb/candidates/${candidateId}/approve`, data)
    return response.data
  },

  /**
   * Reject a candidate
   */
  async rejectCandidate(candidateId: string, data: CandidateRejectRequest): Promise<void> {
    await apiClient.post(`/kb/candidates/${candidateId}/reject`, data)
  },

  /**
   * Modify and approve a candidate
   */
  async modifyAndApproveCandidate(candidateId: string, data: CandidateModifyRequest): Promise<KBDocument> {
    const response = await apiClient.post<KBDocument>(`/kb/candidates/${candidateId}/modify`, data)
    return response.data
  },

  /**
   * Re-import a candidate (re-approve to create a new document)
   */
  async reimportCandidate(candidateId: string, data: CandidateApproveRequest): Promise<KBDocument> {
    const response = await apiClient.post<KBDocument>(`/kb/candidates/${candidateId}/reimport`, data)
    return response.data
  }
}
