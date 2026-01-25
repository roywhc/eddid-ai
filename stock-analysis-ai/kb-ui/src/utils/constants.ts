/**
 * Application constants
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'
export const APP_TITLE = import.meta.env.VITE_APP_TITLE || 'Agentic KB System'

// Session management
export const SESSION_STORAGE_KEY = 'kb_current_session'
export const SESSION_PREFIX = 'kb_chat_session_'
export const MAX_MESSAGES_PER_SESSION = 50

// Validation
export const MAX_QUERY_LENGTH = 5000
export const MIN_QUERY_LENGTH = 1

// Pagination
export const DEFAULT_PAGE_SIZE = 50
export const MAX_PAGE_SIZE = 100
export const MIN_PAGE_SIZE = 1

// API Timeouts
export const DEFAULT_TIMEOUT = 30000 // 30 seconds
export const CHAT_TIMEOUT = 60000 // 60 seconds for chat queries

// Status values
export const DOCUMENT_STATUSES = ['active', 'archived', 'deleted'] as const
export const CANDIDATE_STATUSES = ['pending', 'approved', 'rejected', 'modified'] as const
export const HEALTH_STATUSES = ['healthy', 'degraded', 'unhealthy'] as const
