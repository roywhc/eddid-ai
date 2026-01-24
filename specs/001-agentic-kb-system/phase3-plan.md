# Phase 3 Implementation Plan: RAG Implementation and Chat API

**Feature**: Agentic AI Knowledge Base System  
**Phase**: Phase 3 - RAG Implementation and Chat API  
**Date**: 2026-01-25  
**Status**: Planning  
**Prerequisites**: Phase 1 ✅ Complete, Phase 2 ✅ Complete

## Summary

Phase 3 implements the core RAG (Retrieval-Augmented Generation) functionality and chat API endpoint. This phase enables users to query the internal knowledge base, receive answers with citations, and includes confidence scoring to determine when external knowledge sources should be queried (Phase 4).

**Primary Requirement**: Users can submit chat queries through a REST API and receive answers with source citations from the internal knowledge base.

**Technical Approach**: 
- Implement retrieval service using existing vector store
- Implement LLM service for answer generation using OpenRouter
- Create chat API endpoint with RAG orchestration
- Implement session management for conversation history
- Add confidence scoring for retrieval results

## Technical Context

**Language/Version**: Python 3.11+  
**Primary Dependencies**: 
- FastAPI 0.115.0 (already in use)
- LangChain 1.0.0 (already in use)
- OpenRouter API (via openai SDK)
- Existing: vector_store, chunking utilities

**Storage**: 
- Vector Store: ChromaDB (Phase 2 complete)
- Metadata: PostgreSQL/SQLite (Phase 1 complete)
- Session Storage: In-memory initially, database-backed for production

**Testing**: pytest 8.2.0, pytest-asyncio 0.24.0, httpx for API testing  
**Target Platform**: Linux/Windows/Mac (containerized deployment)  
**Project Type**: Single backend API project  

**Performance Goals**:
- Internal KB queries: < 5 seconds (SC-001)
- Support 100 concurrent chat sessions (SC-004)
- 80% retrieval success rate for matching queries (SC-002)

**Constraints**:
- Must provide citations for 100% of answers (SC-003, Explainable AI principle)
- Must include confidence scores (Explainable AI principle)
- Must handle conversation history (FR-017)
- Must support rate limiting (FR-020)

**Scale/Scope**:
- 10,000+ document chunks (SC-010)
- Multi-turn conversations with context
- Session-based conversation tracking

## Constitution Check

### I. API-First Architecture ✅
- **Status**: PASS
- **Evidence**: Chat API endpoint defined in OpenAPI spec (`/api/v1/chat/query`)
- **Compliance**: RESTful endpoint with versioned API path, request/response models defined

### II. Multi-Agent Orchestration ⚠️
- **Status**: N/A (Single service with internal orchestration)
- **Note**: This feature is a single service. Multi-agent orchestration applies to future agent-to-agent communication.

### III. Explainable AI (NON-NEGOTIABLE) ✅
- **Status**: PASS
- **Evidence**: 
  - Citations required in all responses (FR-003, SC-003)
  - Confidence scores required (FR-004)
  - Source attribution in response model
- **Compliance**: All answers MUST include citations and confidence scores

### IV. Test-First Development ⚠️
- **Status**: NEEDS ATTENTION
- **Evidence**: Tests must be written before implementation
- **Action Required**: Create test cases for retrieval service, LLM service, and chat endpoint before implementation

### V. Observability & Monitoring ⚠️
- **Status**: PARTIAL
- **Evidence**: Logging infrastructure exists (Phase 1)
- **Action Required**: Add structured logs for chat queries, retrieval operations, LLM calls
- **Note**: Full observability implementation in Phase 6

### VI. Security & Compliance ⚠️
- **Status**: PARTIAL
- **Evidence**: Rate limiting configuration exists
- **Action Required**: 
  - Implement rate limiting middleware
  - Add input validation and sanitization
  - Authentication/authorization (deferred to later phase)

### VII. Data Source Abstraction ✅
- **Status**: PASS
- **Evidence**: Vector store abstraction exists (Phase 2), LLM service will abstract OpenRouter

## Phase 3 Components

### 3.1 Retrieval Service (`app/services/retrieval.py`)

**Purpose**: Retrieve relevant chunks from vector store based on user query

**Key Methods**:
- `retrieve(query: str, kb_id: str, top_k: int = 5) -> List[RetrievalResult]`
  - Embed query using HuggingFace embeddings
  - Search vector store with kb_id filter
  - Return results with relevance scores

**Dependencies**:
- `app.db.vector_store.get_vector_store_instance()`
- `langchain_huggingface.HuggingFaceEmbeddings`
- `app.config.settings` (for embeddings model)

**Output Model**: `RetrievalResult` (chunk_id, content, metadata, score)

### 3.2 LLM Service (`app/services/llm_service.py`)

**Purpose**: Generate answers using LLM with retrieved context

**Key Methods**:
- `generate_answer(query: str, context: List[RetrievalResult], conversation_history: List[ChatMessage]) -> str`
  - Build prompt with retrieved context
  - Include conversation history for context
  - Call OpenRouter API
  - Return generated answer

**Dependencies**:
- `openai.AsyncOpenAI` (for OpenRouter API)
- `app.config.settings` (for API key, model, temperature)

**Configuration**:
- Model: `settings.llm_model` (default: gpt-4-turbo-preview)
- Temperature: `settings.llm_temperature` (default: 0.7)
- Max tokens: Configurable

### 3.3 Confidence Scoring (`app/services/confidence.py`)

**Purpose**: Calculate confidence scores for retrieval results

**Key Methods**:
- `calculate_confidence(results: List[RetrievalResult], query: str) -> float`
  - Analyze relevance scores
  - Consider result count and quality
  - Return confidence score (0.0 - 1.0)

**Algorithm**:
- Base score from top result relevance
- Adjust based on number of results
- Consider score distribution
- Threshold: `settings.kb_confidence_threshold` (default: 0.7)

### 3.4 Session Manager (`app/services/session_manager.py`)

**Purpose**: Manage chat sessions and conversation history

**Key Methods**:
- `create_session() -> str`: Generate new session ID
- `get_history(session_id: str) -> List[ChatMessage]`: Retrieve conversation history
- `add_message(session_id: str, message: ChatMessage)`: Store message in history
- `clear_session(session_id: str)`: Clear conversation history

**Storage**:
- Initial: In-memory dictionary
- Future: Database-backed (Phase 6)

### 3.5 Chat API Endpoint (`app/api/chat.py`)

**Purpose**: Handle chat queries with RAG orchestration

**Endpoint**: `POST /api/v1/chat/query`

**Request Flow**:
1. Validate request (`ChatRequest`)
2. Get or create session
3. Retrieve from internal KB (`RetrievalService`)
4. Calculate confidence score
5. Generate answer using LLM (`LLMService`) with retrieved context
6. Format response with citations
7. Store message in session history
8. Return `ChatResponse`

**Response Includes**:
- Answer text
- Citations (internal KB sources)
- Confidence score
- Session ID
- Processing time
- Flags: `used_internal_kb`, `used_external_kb` (false for Phase 3)

### 3.6 RAG Orchestrator (`app/services/rag_orchestrator.py`)

**Purpose**: Orchestrate retrieval, LLM generation, and response formatting

**Key Methods**:
- `process_query(request: ChatRequest) -> ChatResponse`
  - Coordinate retrieval, LLM, and formatting
  - Handle errors gracefully
  - Log operations for observability

**Dependencies**:
- `RetrievalService`
- `LLMService`
- `ConfidenceService`
- `SessionManager`

## Implementation Order

1. **Retrieval Service** (3.1)
   - Test: Mock vector store, verify retrieval logic
   - Dependencies: Vector store (Phase 2 ✅)

2. **Confidence Scoring** (3.3)
   - Test: Unit tests with sample results
   - Dependencies: RetrievalResult model

3. **LLM Service** (3.2)
   - Test: Mock OpenRouter API, verify prompt building
   - Dependencies: OpenRouter API key configuration

4. **Session Manager** (3.4)
   - Test: In-memory storage, session lifecycle
   - Dependencies: ChatMessage model

5. **RAG Orchestrator** (3.5)
   - Test: Integration test with mocked services
   - Dependencies: All above services

6. **Chat API Endpoint** (3.6)
   - Test: End-to-end API tests
   - Dependencies: RAG Orchestrator

## Test Strategy

### Unit Tests
- `tests/test_retrieval_service.py`: Mock vector store, test retrieval logic
- `tests/test_llm_service.py`: Mock OpenRouter API, test prompt generation
- `tests/test_confidence.py`: Test confidence calculation algorithms
- `tests/test_session_manager.py`: Test session lifecycle

### Integration Tests
- `tests/test_rag_orchestrator.py`: Test full RAG flow with mocked services
- `tests/test_chat_api.py`: Test API endpoint with test client

### Test Coverage Target
- Core logic: 80%+ coverage
- All error paths tested
- Edge cases: empty results, API failures, invalid inputs

## Data Models (Already Defined)

- `ChatRequest`: Query, session_id, conversation_history, flags
- `ChatResponse`: Answer, citations, confidence_score, metadata
- `RetrievalResult`: Chunk data with relevance score
- `Citation`: Source information for answers
- `ChatMessage`: Individual message in conversation

## API Contract (Already Defined)

- Endpoint: `POST /api/v1/chat/query`
- Request: `ChatRequest` schema
- Response: `ChatResponse` schema
- See `contracts/openapi.yaml` for full specification

## Dependencies to Add

**New Dependencies**:
- `openai>=1.0.0`: For OpenRouter API access (compatible with OpenRouter)

**Configuration Updates**:
- `LLM_MODEL`: OpenRouter model identifier
- `OPENAI_API_KEY`: OpenRouter API key (reused OpenAI SDK)
- `LLM_TEMPERATURE`: Default 0.7
- `KB_CONFIDENCE_THRESHOLD`: Default 0.7

## Error Handling

**Retrieval Failures**:
- Vector store unavailable: Return error, do not proceed
- Empty results: Return response with low confidence, indicate no matches

**LLM Failures**:
- API timeout: Return error with partial response if available
- API error: Return error, log for debugging
- Rate limiting: Return appropriate error message

**Session Errors**:
- Invalid session_id: Create new session
- Session storage failure: Continue without history

## Performance Considerations

**Optimization Strategies**:
- Cache embeddings for common queries (future)
- Batch retrieval operations
- Async LLM API calls
- Connection pooling for OpenRouter

**Monitoring**:
- Track retrieval latency
- Track LLM API latency
- Track confidence score distribution
- Log slow queries (> 5 seconds)

## Security Considerations

**Input Validation**:
- Query length limits (max 5000 chars per FR)
- Sanitize user input
- Validate session_id format

**Rate Limiting**:
- Per-session rate limits
- Global rate limits
- Configurable thresholds

**API Key Security**:
- Store OpenRouter key in environment variables
- Never log API keys
- Rotate keys regularly

## Next Steps After Phase 3

**Phase 4**: External Knowledge Integration (Perplexity)
- Implement Perplexity service
- Add external knowledge fallback when confidence < threshold
- Combine internal + external results

**Phase 5**: Knowledge Base Update Pipeline
- Document management API
- Candidate generation from external knowledge
- Review and approval workflow

## Success Criteria

- ✅ Chat API endpoint responds to queries
- ✅ Answers include citations from internal KB
- ✅ Confidence scores are calculated and returned
- ✅ Conversation history is maintained
- ✅ All tests pass (80%+ coverage)
- ✅ Response time < 5 seconds for internal KB queries
- ✅ 100% of answers include citations (SC-003)

## Risks and Mitigations

**Risk**: OpenRouter API availability/rate limits
- **Mitigation**: Implement retry logic, graceful error handling

**Risk**: LLM API costs
- **Mitigation**: Monitor usage, implement caching, optimize prompts

**Risk**: Performance with large conversation history
- **Mitigation**: Limit history length, implement efficient storage

**Risk**: Confidence scoring accuracy
- **Mitigation**: Tune algorithm based on real queries, make threshold configurable

---

**Plan Status**: Ready for Implementation  
**Next Command**: `/speckit.tasks` to break down into specific tasks  
**Implementation Command**: `/speckit.implement phase 3`
