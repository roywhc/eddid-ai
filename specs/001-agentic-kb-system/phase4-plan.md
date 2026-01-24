# Phase 4 Implementation Plan: External Knowledge Integration (Perplexity)

**Feature**: Agentic AI Knowledge Base System  
**Phase**: Phase 4 - External Knowledge Integration (Perplexity)  
**Date**: 2026-01-25  
**Status**: Planning  
**Prerequisites**: Phase 1 ✅ Complete, Phase 2 ✅ Complete, Phase 3 ✅ Complete

## Summary

Phase 4 implements external knowledge integration using Perplexity API. When internal knowledge base confidence is below the threshold, the system automatically queries Perplexity and combines results to provide comprehensive answers. This phase also includes candidate generation for potential KB updates.

**Primary Requirement**: System queries external knowledge sources (Perplexity) when internal KB confidence is below threshold and combines results to provide comprehensive answers with citations.

**Technical Approach**: 
- Implement Perplexity service using OpenAI-compatible SDK
- Update RAG orchestrator to query Perplexity when confidence < threshold
- Combine internal and external knowledge in LLM context
- Extract citations from Perplexity responses
- Generate candidate entries for KB updates (basic implementation)

## Technical Context

**Language/Version**: Python 3.11+  
**Primary Dependencies**: 
- FastAPI 0.115.0 (already in use)
- OpenAI SDK (for Perplexity API - already in use)
- Existing: LLMService, RAGOrchestrator, ConfidenceService

**Storage**: 
- Metadata DB: SQLite/PostgreSQL (for candidate entries)
- No new storage requirements

**Testing**: pytest 8.2.0, pytest-asyncio 0.24.0, httpx for API testing  
**Target Platform**: Linux/Windows/Mac (containerized deployment)  
**Project Type**: Single backend API project  

**Performance Goals**:
- External KB queries: < 10 seconds (including Perplexity API call)
- Graceful fallback when Perplexity unavailable
- Combined responses maintain < 15 seconds total

**Constraints**:
- Must indicate which sources (internal/external/both) were used (FR-007)
- Must gracefully handle Perplexity API failures (FR-005)
- Must extract and format citations from Perplexity (FR-003)

## Constitution Check

✅ **API-First Architecture**: External knowledge exposed through existing chat API  
✅ **Explainable AI**: Citations from both internal and external sources  
✅ **Test-First Development**: Unit and integration tests for Perplexity service  
✅ **Observability**: Logging for external knowledge queries and results  
✅ **Security**: API key management already in place  

## Implementation Components

### 1. Perplexity Service (`app/services/external_knowledge.py`)

**Purpose**: Encapsulate Perplexity API integration

**Key Methods**:
- `search(query: str, additional_context: Optional[str] = None) -> ExternalKnowledgeResult`
- `_extract_citations(response) -> List[Citation]`

**Dependencies**:
- `app.config.settings` (Perplexity API key, model, timeout)
- `app.models.ExternalKnowledgeResult`, `Citation`

**Error Handling**:
- API timeouts
- Rate limiting
- Invalid responses
- Network errors

### 2. Updated Models (`app/models.py`)

**New/Updated Models**:
- `ExternalKnowledgeResult`: Result from Perplexity API
  - `answer: str`
  - `citations: List[Citation]`
  - `raw_response: Optional[Dict]`
  - `query_time_ms: float`

**Updated Models**:
- `Citation`: Already exists, ensure supports external sources
- `ChatResponse`: Already has `used_external_kb` flag

### 3. Updated RAG Orchestrator (`app/services/rag_orchestrator.py`)

**New Logic**:
1. After internal KB retrieval and confidence calculation
2. If confidence < threshold OR `use_external_kb=True` in request:
   - Query Perplexity service
   - Combine internal + external context
   - Generate answer with combined context
   - Extract citations from both sources
3. If Perplexity fails:
   - Fall back to internal KB only
   - Log error
   - Set `used_external_kb=False`

**Updated Methods**:
- `process_query()`: Add Perplexity integration logic

### 4. Candidate Generation (Basic) (`app/services/kb_curator.py`)

**Purpose**: Generate candidate entries when external knowledge is used

**Key Methods**:
- `generate_candidate(query: str, answer: str, citations: List[Citation]) -> CandidateEntry`
- `save_candidate(candidate: CandidateEntry) -> str`

**Dependencies**:
- `app.db.metadata_store` (for saving candidates)
- `app.models.CandidateEntry`

**Note**: Full review/approval workflow deferred to Phase 5

## Implementation Order

1. **Update Models** - Add `ExternalKnowledgeResult` model
2. **Implement Perplexity Service** - Create `external_knowledge.py`
3. **Update RAG Orchestrator** - Integrate Perplexity queries
4. **Basic Candidate Generation** - Create `kb_curator.py` with basic save
5. **Tests** - Unit and integration tests
6. **Documentation** - Update API docs and usage guide

## Test Strategy

### Unit Tests
- `test_external_knowledge.py`:
  - Perplexity service initialization
  - Successful search query
  - Citation extraction
  - Error handling (timeout, rate limit, network error)
  - Empty response handling

### Integration Tests
- `test_rag_orchestrator_external.py`:
  - Low confidence triggers Perplexity query
  - Combined internal + external results
  - Perplexity failure fallback
  - Citation extraction from both sources

### API Tests
- `test_chat_api_external.py`:
  - Request with `use_external_kb=True`
  - Response includes external citations
  - `used_external_kb` flag set correctly

## Success Criteria

- ✅ Perplexity service successfully queries API
- ✅ Low confidence triggers external knowledge query
- ✅ Combined internal + external results work correctly
- ✅ Citations extracted from Perplexity responses
- ✅ Graceful fallback when Perplexity unavailable
- ✅ Candidate entries generated when external KB used
- ✅ All tests pass (80%+ coverage)
- ✅ Response time < 15 seconds for combined queries

## Risks and Mitigations

**Risk**: Perplexity API rate limits or downtime  
**Mitigation**: Graceful fallback to internal KB, clear error messages

**Risk**: Perplexity API costs  
**Mitigation**: Only query when confidence < threshold, configurable threshold

**Risk**: Citation extraction from Perplexity may be inconsistent  
**Mitigation**: Robust parsing, fallback to raw response if needed

## Next Steps After Phase 4

**Phase 5**: Knowledge Base Management
- Full candidate review/approval workflow
- Document management API
- KB update pipeline

---

**Status**: Ready for Implementation  
**Next Action**: Begin implementation with model updates
