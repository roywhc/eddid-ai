/**
 * Frontend Data Models
 * Based on data-model.md specifications
 */

import type { Citation } from './api.types'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  citations?: Citation[]
  confidenceScore?: number
  processingTimeMs?: number
}

export interface ChatSession {
  sessionId: string
  messages: ChatMessage[]
  createdAt: Date
  lastActivityAt: Date
}

export interface Document {
  docId: string
  kbId: string
  title: string
  docType: string
  content: string
  version: string
  createdAt: Date
  updatedAt: Date
  createdBy: string
  approvedBy?: string
  language: string
  tags: string[]
  status: 'active' | 'archived' | 'deleted'
  chunks?: number
}

export interface Candidate {
  candidateId: string
  originalQuery: string
  sourceType: string
  title: string
  content: string
  suggestedKbId: string
  suggestedCategory?: string
  externalUrls: string[]
  extractedOn: Date
  status: 'pending' | 'approved' | 'rejected' | 'modified'
  reviewedBy?: string
  reviewNotes?: string
  hitCount: number
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: Date
  components: Record<string, string>
  version: string
}

export interface PaginationMetadata {
  limit: number
  offset: number
  total?: number
  hasMore: boolean
}
