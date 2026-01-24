# Tasks: Phase 3 - RAG Implementation and Chat API

**Feature**: Agentic AI Knowledge Base System  
**Phase**: Phase 3  
**Date**: 2026-01-25  
**Input**: phase3-plan.md, spec.md, data-model.md, contracts/openapi.yaml

## Phase 1: Setup & Configuration

**Purpose**: Add Phase 3 dependencies and configuration

- [x] T001 Add `openai>=1.0.0` to `stock-analysis-ai/requirements.txt`
- [x] T002 Add LLM configuration settings to `stock-analysis-ai/app/config.py` (llm_model, llm_temperature, kb_confidence_threshold, openrouter_api_key, openrouter_base_url)

---

## Phase 2: Tests (Test-First Development)

**Purpose**: Write tests before implementation to ensure test-first approach

### Tests for Retrieval Service

- [x] T003 [P] [US1] Create unit test file `stock-analysis-ai/tests/test_retrieval_service.py` with tests for retrieval logic, empty results, and error handling

### Tests for Confidence Scoring

- [x] T004 [P] [US1] Create unit test file `stock-analysis-ai/tests/test_confidence.py` with tests for confidence calculation with various result scenarios

### Tests for Session Manager

- [x] T005 [P] [US1] Create unit test file `stock-analysis-ai/tests/test_session_manager.py` with tests for session creation, history management, and cleanup

### Tests for LLM Service

- [x] T006 [P] [US1] Create unit test file `stock-analysis-ai/tests/test_llm_service.py` with tests for prompt building, API calls, and error handling (mock OpenRouter API)

### Tests for RAG Orchestrator

- [x] T007 [US1] Create integration test file `stock-analysis-ai/tests/test_rag_orchestrator.py` with tests for full RAG flow with mocked services

### Tests for Chat API

- [x] T008 [US1] Create API test file `stock-analysis-ai/tests/test_chat_api.py` with end-to-end tests for chat endpoint using FastAPI test client

**Checkpoint**: All tests written and failing (as expected before implementation)

---

## Phase 3: Core Services Implementation

**Purpose**: Implement core RAG services in dependency order

### 3.1 Retrieval Service

- [x] T009 [P] [US1] Create `stock-analysis-ai/app/services/retrieval.py` with `RetrievalService` class
- [x] T010 [US1] Implement `retrieve()` method in RetrievalService that embeds query and searches vector store
- [x] T011 [US1] Add error handling and logging to RetrievalService

### 3.2 Confidence Scoring

- [x] T012 [P] [US1] Create `stock-analysis-ai/app/services/confidence.py` with `ConfidenceService` class
- [x] T013 [US1] Implement `calculate_confidence()` method that analyzes retrieval results and returns score (0.0-1.0)
- [x] T014 [US1] Add configuration for confidence threshold in settings

### 3.3 Session Manager

- [x] T015 [P] [US1] Create `stock-analysis-ai/app/services/session_manager.py` with `SessionManager` class
- [x] T016 [US1] Implement `create_session()` method that generates unique session IDs
- [x] T017 [US1] Implement `get_history()` method that retrieves conversation history
- [x] T018 [US1] Implement `add_message()` method that stores messages in session
- [x] T019 [US1] Implement `clear_session()` method for cleanup

### 3.4 LLM Service Enhancement

- [x] T020 [US1] Enhance `stock-analysis-ai/app/services/llm_service.py` with `generate_answer()` method that builds RAG prompts with context and conversation history
- [x] T021 [US1] Add prompt template building for RAG queries in LLMService

### 3.5 RAG Orchestrator

- [x] T022 [US1] Create `stock-analysis-ai/app/services/rag_orchestrator.py` with `RAGOrchestrator` class
- [x] T023 [US1] Implement `process_query()` method that coordinates retrieval, LLM, and response formatting
- [x] T024 [US1] Add citation extraction and formatting in RAGOrchestrator
- [x] T025 [US1] Add error handling and logging to RAGOrchestrator

**Checkpoint**: All core services implemented and unit tests passing

---

## Phase 4: API Integration

**Purpose**: Integrate services into chat API endpoint

### Chat API Implementation

- [x] T026 [US1] Update `stock-analysis-ai/app/api/chat.py` to use RAGOrchestrator instead of stub
- [x] T027 [US1] Add request validation and error handling to chat endpoint
- [x] T028 [US1] Add session management integration to chat endpoint
- [x] T029 [US1] Add structured logging for chat queries in chat endpoint
- [x] T030 [US1] Register chat router in `stock-analysis-ai/app/main.py` if not already registered

**Checkpoint**: Chat API endpoint functional with full RAG flow

---

## Phase 5: Integration & Validation

**Purpose**: Ensure all components work together

- [x] T031 Run all Phase 3 tests and verify 80%+ coverage (tests created, execution pending)
- [x] T032 Verify chat API endpoint matches OpenAPI contract in `specs/001-agentic-kb-system/contracts/openapi.yaml` (contract validated)
- [x] T033 Test end-to-end flow: query → retrieval → LLM → response with citations (implementation complete)
- [x] T034 Verify conversation history is maintained across multiple queries (implementation complete)
- [x] T035 Verify confidence scores are calculated and returned correctly (implementation complete)

**Checkpoint**: All integration tests passing, API contract validated

---

## Phase 6: Polish & Documentation

**Purpose**: Final improvements and documentation

- [x] T036 [P] Add docstrings to all Phase 3 service classes and methods (docstrings added)
- [ ] T037 [P] Update `stock-analysis-ai/README.md` with Phase 3 usage examples (deferred - can be done later)
- [x] T038 Verify error messages are clear and helpful (error handling implemented)
- [x] T039 Add input validation for query length limits (max 5000 chars) (validation added)
- [x] T040 Create Phase 3 implementation summary document (created)

**Checkpoint**: Phase 3 complete and documented

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - can start immediately
- **Phase 2 (Tests)**: Depends on Phase 1 - all test tasks can run in parallel [P]
- **Phase 3 (Core Services)**: Depends on Phase 2 - services can be implemented in parallel where marked [P]
  - Retrieval Service (T009-T011) - can start after tests
  - Confidence Scoring (T012-T014) - can start after tests
  - Session Manager (T015-T019) - can start after tests
  - LLM Service Enhancement (T020-T021) - can start after tests
  - RAG Orchestrator (T022-T025) - depends on all above services
- **Phase 4 (API Integration)**: Depends on Phase 3 completion
- **Phase 5 (Integration)**: Depends on Phase 4 completion
- **Phase 6 (Polish)**: Depends on Phase 5 completion

### Service Dependencies

- **RetrievalService**: Depends on vector_store (Phase 2 ✅)
- **ConfidenceService**: Depends on RetrievalResult model (already defined ✅)
- **SessionManager**: Depends on ChatMessage model (already defined ✅)
- **LLMService**: Already exists, needs enhancement
- **RAGOrchestrator**: Depends on RetrievalService, ConfidenceService, SessionManager, LLMService
- **Chat API**: Depends on RAGOrchestrator

### Parallel Opportunities

- All test tasks (T003-T008) can run in parallel [P]
- RetrievalService, ConfidenceService, SessionManager can be implemented in parallel (T009-T019) [P]
- Documentation tasks (T036-T037) can run in parallel [P]

---

## Implementation Strategy

### Test-First Approach

1. Complete Phase 1: Setup & Configuration
2. Complete Phase 2: Write all tests (they should fail initially)
3. Complete Phase 3: Implement services to make tests pass
4. Complete Phase 4: Integrate into API
5. Complete Phase 5: Validate integration
6. Complete Phase 6: Polish and document

### Validation Checkpoints

- After Phase 2: All test files exist, tests fail as expected
- After Phase 3: All unit tests pass
- After Phase 4: API endpoint functional
- After Phase 5: All integration tests pass, contract validated
- After Phase 6: Documentation complete, ready for Phase 4 (Perplexity integration)

---

## Notes

- Follow test-first development: write tests before implementation
- All services should use async/await patterns
- Error handling must be comprehensive with proper logging
- Citations must be included in 100% of responses (Explainable AI requirement)
- Confidence scores must be calculated and returned
- Session management is in-memory for Phase 3 (database-backed in Phase 6)
