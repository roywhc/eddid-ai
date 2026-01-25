/**
 * API Request/Response Types
 * Based on OpenAPI contract: specs/001-web-ui/contracts/openapi.yaml
 */

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
}

export interface ChatRequest {
  query: string
  session_id?: string | null
  include_sources?: boolean
  use_external_kb?: boolean
  conversation_history?: ChatMessage[]
}

export interface Citation {
  source: 'internal' | 'external'
  document_id?: string | null
  document_title?: string | null
  section?: string | null
  url?: string | null
  relevance_score?: number | null
  snippet?: string | null
}

export interface ChatResponse {
  session_id: string
  query: string
  answer: string
  sources: Citation[]
  confidence_score: number
  used_internal_kb: boolean
  used_external_kb: boolean
  processing_time_ms: number
  timestamp: string
}

export interface KBUpdateRequest {
  doc_id?: string | null
  kb_id: string
  title: string
  content: string
  doc_type: string
  tags?: string[]
  language?: string
  source_type?: string | null
  source_urls?: string[]
}

export interface CandidateApproveRequest {
  reviewer: string
  notes?: string | null
}

export interface CandidateRejectRequest {
  reviewer: string
  notes?: string | null
}

export interface CandidateModifyRequest {
  reviewer: string
  notes?: string | null
  document: KBUpdateRequest
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  components: Record<string, string>
  version: string
}

export interface MetricsSummary {
  enabled: boolean
  counters?: Record<string, number>
  histograms?: Record<string, any>
  gauges?: Record<string, number>
  error?: string
}

export interface ErrorResponse {
  detail: string
}

export interface VectorStoreStats {
  total_chunks?: number | string
  collection_name?: string
  persist_directory?: string | null
  type?: string
  error?: string
}

export interface VectorStoreHealth {
  status: 'healthy' | 'degraded' | 'not_initialized' | 'error'
  available: boolean
  error?: string
}
