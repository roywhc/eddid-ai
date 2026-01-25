/**
 * Utility functions for validation
 */

import { MAX_QUERY_LENGTH, MIN_QUERY_LENGTH } from './constants'

export function validateQuery(query: string): { valid: boolean; error?: string } {
  if (!query || !query.trim()) {
    return { valid: false, error: 'Query cannot be empty' }
  }
  
  if (query.length > MAX_QUERY_LENGTH) {
    return { valid: false, error: `Query exceeds maximum length of ${MAX_QUERY_LENGTH} characters` }
  }
  
  if (query.length < MIN_QUERY_LENGTH) {
    return { valid: false, error: `Query must be at least ${MIN_QUERY_LENGTH} character` }
  }
  
  return { valid: true }
}

export function validateSessionId(sessionId: string): boolean {
  const pattern = /^session_[a-f0-9]{12}$/
  return pattern.test(sessionId)
}

export function validateDocumentFields(title: string, content: string): { valid: boolean; error?: string } {
  if (!title || !title.trim()) {
    return { valid: false, error: 'Title is required' }
  }
  
  if (!content || !content.trim()) {
    return { valid: false, error: 'Content is required' }
  }
  
  return { valid: true }
}

export function validatePaginationParams(limit: number, offset: number): { valid: boolean; error?: string } {
  if (limit < 1 || limit > 100) {
    return { valid: false, error: 'Limit must be between 1 and 100' }
  }
  
  if (offset < 0) {
    return { valid: false, error: 'Offset must be >= 0' }
  }
  
  return { valid: true }
}
