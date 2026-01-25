# Data Model: Web UI for Agentic KB System

**Date**: 2026-01-25  
**Feature**: Web UI for Agentic KB System  
**Phase**: 1 - Design & Contracts

## Frontend Data Models

### Chat Session

**Purpose**: Represents a conversation between a user and the AI system.

**Fields**:
- `sessionId: string` - Unique session identifier (format: `session_<12-char-hex>`)
- `messages: ChatMessage[]` - Array of conversation messages
- `createdAt: Date` - Session creation timestamp
- `lastActivityAt: Date` - Last message timestamp

**State Transitions**:
- `new` → `active` (first message sent)
- `active` → `active` (subsequent messages)
- `active` → `expired` (after inactivity period, handled by backend)

**Validation Rules**:
- `sessionId` must match pattern: `^session_[a-f0-9]{12}$`
- `messages` array length ≤ 50 (SC-007: view last 50 messages)

**Storage**: localStorage key: `kb_chat_session_${sessionId}`

---

### ChatMessage

**Purpose**: Represents a single message in a chat conversation.

**Fields**:
- `role: 'user' | 'assistant'` - Message sender role
- `content: string` - Message content (min 1 char, max 5000 chars for user messages)
- `timestamp: Date` - Message timestamp
- `citations?: Citation[]` - Source citations (assistant messages only)
- `confidenceScore?: number` - AI confidence score (0-1, assistant messages only)
- `processingTimeMs?: number` - Response processing time (assistant messages only)

**Validation Rules**:
- `content` must be non-empty
- `role` must be either 'user' or 'assistant'
- `confidenceScore` must be between 0 and 1 if present

---

### Citation

**Purpose**: Represents a source reference for an AI-generated answer.

**Fields**:
- `source: 'internal' | 'external'` - Source type
- `documentId?: string` - Internal document ID (if source is 'internal')
- `documentTitle?: string` - Document title
- `section?: string` - Section within document
- `url?: string` - External URL (if source is 'external')
- `relevanceScore?: number` - Relevance score (0-1)
- `snippet?: string` - Content snippet

**Validation Rules**:
- `source` must be either 'internal' or 'external'
- If `source === 'internal'`, `documentId` should be present
- If `source === 'external'`, `url` should be present

---

### Document

**Purpose**: Represents a knowledge base document entry.

**Fields**:
- `docId: string` - Unique document identifier
- `kbId: string` - Knowledge base identifier
- `title: string` - Document title
- `docType: string` - Document type
- `content: string` - Document content
- `version: string` - Document version
- `createdAt: Date` - Creation timestamp
- `updatedAt: Date` - Last update timestamp
- `createdBy: string` - Creator identifier
- `approvedBy?: string` - Approver identifier
- `language: string` - Language code (default: 'en')
- `tags: string[]` - Document tags
- `status: 'active' | 'archived' | 'deleted'` - Document status
- `chunks?: number` - Number of chunks (if available)

**State Transitions**:
- `active` → `archived` (administrator action)
- `active` → `deleted` (soft delete, administrator action)
- `archived` → `active` (restore, administrator action)

**Validation Rules**:
- `title` must be non-empty
- `content` must be non-empty
- `status` must be one of: 'active', 'archived', 'deleted'

---

### Candidate

**Purpose**: Represents a potential knowledge base entry pending review.

**Fields**:
- `candidateId: string` - Unique candidate identifier
- `originalQuery: string` - Original user query that generated this candidate
- `sourceType: string` - Source type (e.g., 'perplexity', 'external')
- `title: string` - Suggested title
- `content: string` - Candidate content
- `suggestedKbId: string` - Suggested knowledge base ID
- `suggestedCategory?: string` - Suggested category
- `externalUrls: string[]` - External source URLs
- `extractedOn: Date` - Extraction timestamp
- `status: 'pending' | 'approved' | 'rejected' | 'modified'` - Review status
- `reviewedBy?: string` - Reviewer identifier
- `reviewNotes?: string` - Review notes
- `hitCount: number` - Number of times this candidate was referenced

**State Transitions**:
- `pending` → `approved` (administrator approves)
- `pending` → `rejected` (administrator rejects)
- `pending` → `modified` (administrator modifies then approves)

**Validation Rules**:
- `status` must be one of: 'pending', 'approved', 'rejected', 'modified'
- `title` must be non-empty
- `content` must be non-empty

---

### System Health

**Purpose**: Represents the health status of system components.

**Fields**:
- `status: 'healthy' | 'degraded' | 'unhealthy'` - Overall system status
- `timestamp: Date` - Health check timestamp
- `components: Record<string, string>` - Component statuses
  - `vector_db: string` - Vector database status
  - `metadata_db: string` - Metadata database status
  - `perplexity_api: string` - Perplexity API status
  - `llm_api: string` - LLM API status
  - Additional metrics as key-value pairs
- `version: string` - System version

**Validation Rules**:
- `status` must be one of: 'healthy', 'degraded', 'unhealthy'
- `components` object must contain at least one component status

---

### Pagination Metadata

**Purpose**: Represents pagination information for list endpoints.

**Fields**:
- `limit: number` - Items per page (default: 50, max: 100)
- `offset: number` - Offset for pagination (default: 0, min: 0)
- `total?: number` - Total number of items (if available)
- `hasMore: boolean` - Whether more items are available

**Validation Rules**:
- `limit` must be between 1 and 100
- `offset` must be >= 0

---

## Frontend State Management

### Chat Store (Pinia)

**State**:
- `currentSessionId: string | null`
- `messages: ChatMessage[]`
- `isLoading: boolean`
- `error: string | null`

**Actions**:
- `sendQuery(query: string): Promise<ChatResponse>`
- `loadSession(sessionId: string): void`
- `clearSession(): void`
- `addMessage(message: ChatMessage): void`

---

### Documents Store (Pinia)

**State**:
- `documents: Document[]`
- `selectedDocument: Document | null`
- `pagination: PaginationMetadata`
- `filters: { kbId?: string, status?: string }`
- `isLoading: boolean`
- `error: string | null`

**Actions**:
- `fetchDocuments(params: { kbId?: string, status?: string, limit?: number, offset?: number }): Promise<void>`
- `createDocument(request: KBUpdateRequest): Promise<Document>`
- `updateDocument(docId: string, request: KBUpdateRequest): Promise<Document>`
- `deleteDocument(docId: string): Promise<void>`
- `selectDocument(docId: string): void`

---

### Candidates Store (Pinia)

**State**:
- `candidates: Candidate[]`
- `selectedCandidate: Candidate | null`
- `pagination: PaginationMetadata`
- `filters: { kbId?: string, status?: string }`
- `isLoading: boolean`
- `error: string | null`

**Actions**:
- `fetchCandidates(params: { kbId?: string, status?: string, limit?: number, offset?: number }): Promise<void>`
- `approveCandidate(candidateId: string, request: CandidateApproveRequest): Promise<Document>`
- `rejectCandidate(candidateId: string, request: CandidateRejectRequest): Promise<void>`
- `modifyCandidate(candidateId: string, request: CandidateModifyRequest): Promise<Document>`
- `selectCandidate(candidateId: string): void`

---

### Session Store (Pinia)

**State**:
- `sessionId: string | null`
- `persistedSessions: string[]` - List of session IDs in localStorage

**Actions**:
- `loadSessionFromStorage(): void`
- `saveSessionToStorage(sessionId: string): void`
- `clearSessionFromStorage(sessionId: string): void`
- `getAllSessions(): string[]`

---

## Data Flow

### Chat Flow
1. User submits query → `ChatStore.sendQuery()`
2. Service layer calls `POST /api/v1/chat/query`
3. Response received → `ChatStore.addMessage()` for both user and assistant messages
4. Session ID saved to `SessionStore` and localStorage
5. Citations displayed in UI

### Document Management Flow
1. Administrator navigates to Documents view → `DocumentsStore.fetchDocuments()`
2. Service layer calls `GET /api/v1/kb/documents`
3. Documents loaded into store
4. CRUD operations trigger corresponding API calls
5. Store updated with new data

### Candidate Review Flow
1. Administrator navigates to Candidates view → `CandidatesStore.fetchCandidates()`
2. Service layer calls `GET /api/v1/kb/candidates`
3. Candidates loaded into store
4. Review actions (approve/reject/modify) trigger API calls
5. Store updated, candidate removed from list if approved

---

## Validation Rules Summary

### Input Validation (FR-011)
- Chat queries: non-empty, max 5000 characters
- Document fields: title and content required, non-empty
- Candidate review: reviewer name required
- Pagination: limit 1-100, offset >= 0

### State Validation
- Session IDs must match pattern
- Status values must be from allowed enums
- Dates must be valid Date objects
- Numbers must be within valid ranges

---

## Error Handling

### API Error Types
- `400 Bad Request`: Validation errors, display field-specific messages
- `404 Not Found`: Resource not found, show "not found" message
- `500 Internal Server Error`: Generic error, show retry option
- `Network Error`: Connection issues, show "check connection" message

### Error State Management
- Each store maintains `error: string | null`
- Errors cleared on successful operations
- User-friendly error messages displayed in UI (FR-007)
