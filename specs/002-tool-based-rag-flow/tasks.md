# Tasks: Tool-Based RAG Flow Refactoring

**Input**: Design documents from `/specs/002-tool-based-rag-flow/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are included per Constitution IV (Test-First Development)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Project**: `stock-analysis-ai/` at repository root
- Paths shown below use `stock-analysis-ai/app/` structure

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create database migration for keyword tables in stock-analysis-ai/app/db/migrations/add_keyword_tables.py
- [X] T002 Create database migration for tool_call table in stock-analysis-ai/app/db/migrations/add_tool_call_table.py
- [X] T003 [P] Update requirements.txt with any new dependencies if needed in stock-analysis-ai/requirements.txt
- [X] T004 [P] Create tool definitions module structure in stock-analysis-ai/app/services/tools/__init__.py

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Run database migrations to create keyword and tool_call tables
- [X] T006 [P] Create ToolCall model in stock-analysis-ai/app/models.py (extend existing models)
- [X] T007 [P] Create Keyword model in stock-analysis-ai/app/models.py (extend existing models)
- [X] T008 [P] Create KeywordAssociation model in stock-analysis-ai/app/models.py (extend existing models)
- [X] T009 Extend metadata_store.py with keyword storage methods in stock-analysis-ai/app/db/metadata_store.py
- [X] T010 Create tool_validator.py with parameter validation in stock-analysis-ai/app/services/tool_validator.py
- [X] T011 Create tool_enforcer.py with mandatory tool detection in stock-analysis-ai/app/services/tool_enforcer.py
- [X] T012 Extend aiops_logger.py with tool call logging in stock-analysis-ai/app/utils/aiops_logger.py
- [X] T013 Create tool_agent_controller.py base structure in stock-analysis-ai/app/services/tool_agent_controller.py

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Query Processing with Knowledge Base Tool (Priority: P1) 🎯 MVP

**Goal**: Core tool-based flow where LLM orchestrates tool calls, with mandatory KB tool and response generation tool

**Independent Test**: Submit a query and verify LLM calls knowledge base tool with tailored parameters, receives results, evaluates sufficiency, and generates response using response tool. System enforces mandatory tools with retry logic.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T014 [P] [US1] Contract test for knowledge_base_search tool definition in tests/contract/test_tool_definitions.py
- [X] T015 [P] [US1] Contract test for generate_response tool definition in tests/contract/test_tool_definitions.py
- [X] T016 [P] [US1] Unit test for tool_validator parameter validation in tests/unit/test_tool_validator.py
- [X] T017 [P] [US1] Unit test for tool_enforcer mandatory tool detection in tests/unit/test_tool_enforcer.py
- [X] T018 [P] [US1] Integration test for tool-based query flow (KB only) in tests/integration/test_tool_based_flow.py

### Implementation for User Story 1

- [X] T019 [P] [US1] Extend LLMService with tool calling support in stock-analysis-ai/app/services/llm_service.py
- [X] T020 [P] [US1] Create knowledge_base_tool.py wrapping RetrievalService in stock-analysis-ai/app/services/tools/knowledge_base_tool.py
- [X] T021 [P] [US1] Create response_generator_tool.py for final response formatting in stock-analysis-ai/app/services/tools/response_generator_tool.py
- [X] T022 [US1] Implement tool definition schemas (JSON Schema format) in stock-analysis-ai/app/services/tools/tool_definitions.py
- [X] T023 [US1] Implement system prompt with tool definitions and workflow instructions in stock-analysis-ai/app/utils/prompt_templates.py
- [X] T024 [US1] Implement tool_agent_controller.py process_query method with tool orchestration in stock-analysis-ai/app/services/tool_agent_controller.py
- [X] T025 [US1] Implement tool call execution and result handling in stock-analysis-ai/app/services/tool_agent_controller.py
- [X] T026 [US1] Implement mandatory tool call enforcement with retry logic in stock-analysis-ai/app/services/tool_agent_controller.py
- [X] T027 [US1] Integrate tool_agent_controller with chat.py API endpoint in stock-analysis-ai/app/api/chat.py
- [X] T028 [US1] Add tool call logging to AIOps logger in stock-analysis-ai/app/utils/aiops_logger.py
- [X] T029 [US1] Update session_manager to maintain context across tool calls in stock-analysis-ai/app/services/session_manager.py

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. LLM can process queries using tool-based flow with mandatory KB tool and response generation tool.

---

## Phase 4: User Story 2 - Perplexity Tool Integration (Priority: P2)

**Goal**: When KB results are insufficient, LLM calls Perplexity tool to retrieve external information

**Independent Test**: Submit a query requiring external knowledge, verify LLM calls Perplexity with tailored search query, receives results, and incorporates into final response. System handles Perplexity API failures gracefully.

### Tests for User Story 2

- [X] T030 [P] [US2] Contract test for perplexity_search tool definition in tests/contract/test_tool_definitions.py
- [X] T031 [P] [US2] Unit test for perplexity_tool parameter validation in tests/unit/test_tool_validator.py
- [X] T032 [P] [US2] Integration test for tool-based flow with Perplexity in tests/integration/test_tool_based_flow.py
- [X] T033 [P] [US2] Integration test for Perplexity API failure handling in tests/integration/test_tool_based_flow.py

### Implementation for User Story 2

- [X] T034 [P] [US2] Create perplexity_tool.py wrapping PerplexityService in stock-analysis-ai/app/services/tools/perplexity_tool.py
- [X] T035 [US2] Add perplexity_search tool definition to tool_definitions.py in stock-analysis-ai/app/services/tools/tool_definitions.py
- [X] T036 [US2] Update system prompt with Perplexity tool usage instructions in stock-analysis-ai/app/utils/prompt_templates.py
- [X] T037 [US2] Extend tool_agent_controller to handle Perplexity tool calls in stock-analysis-ai/app/services/tool_agent_controller.py
- [X] T038 [US2] Implement Perplexity API failure handling with graceful fallback in stock-analysis-ai/app/services/tool_agent_controller.py
- [X] T039 [US2] Update response generation to combine KB and Perplexity results in stock-analysis-ai/app/services/tools/response_generator_tool.py
- [X] T040 [US2] Add Perplexity tool call logging to AIOps logger in stock-analysis-ai/app/utils/aiops_logger.py

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. System can handle queries requiring external knowledge via Perplexity tool.

---

## Phase 5: User Story 3 - Keyword Indexing for Future Queries (Priority: P3)

**Goal**: Index keywords from Perplexity results to improve future KB retrieval

**Independent Test**: Submit query triggering Perplexity, verify keywords are extracted and indexed, then submit related query and verify indexed keywords help retrieve relevant information.

### Tests for User Story 3

- [X] T041 [P] [US3] Contract test for index_keywords tool definition in tests/contract/test_tool_definitions.py
- [X] T042 [P] [US3] Unit test for keyword_indexer keyword validation in tests/unit/test_keyword_indexer.py
- [X] T043 [P] [US3] Unit test for keyword_indexer duplicate handling in tests/unit/test_keyword_indexer.py
- [X] T044 [P] [US3] Integration test for keyword indexing flow in tests/integration/test_tool_based_flow.py
- [X] T045 [P] [US3] Integration test for keyword retrieval in KB queries in tests/integration/test_tool_based_flow.py

### Implementation for User Story 3

- [X] T046 [P] [US3] Create keyword_indexer.py service for keyword operations in stock-analysis-ai/app/services/keyword_indexer.py
- [X] T047 [US3] Implement keyword validation (2-50 chars, non-empty, not generic) in stock-analysis-ai/app/services/keyword_indexer.py
- [X] T048 [US3] Implement keyword storage with duplicate detection and merging in stock-analysis-ai/app/services/keyword_indexer.py
- [X] T049 [US3] Implement keyword association with queries and Perplexity results in stock-analysis-ai/app/services/keyword_indexer.py
- [X] T050 [P] [US3] Create index_keywords_tool.py wrapping KeywordIndexer in stock-analysis-ai/app/services/tools/index_keywords_tool.py
- [X] T051 [US3] Add index_keywords tool definition to tool_definitions.py in stock-analysis-ai/app/services/tools/tool_definitions.py
- [X] T052 [US3] Update system prompt with keyword extraction guidance in stock-analysis-ai/app/utils/prompt_templates.py
- [X] T053 [US3] Extend tool_agent_controller to handle index_keywords tool calls in stock-analysis-ai/app/services/tool_agent_controller.py
- [ ] T054 [US3] Integrate keyword retrieval into KB search (optional enhancement) in stock-analysis-ai/app/services/tools/knowledge_base_tool.py
- [X] T055 [US3] Add keyword indexing logging to AIOps logger in stock-analysis-ai/app/utils/aiops_logger.py

**Checkpoint**: At this point, all user stories should be independently functional. System can index keywords from Perplexity results and use them for future queries.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T056 [P] Add comprehensive error handling for all tool failures in stock-analysis-ai/app/services/tool_agent_controller.py
- [X] T057 [P] Add metrics for tool call success rates and durations in stock-analysis-ai/app/services/tool_agent_controller.py
- [X] T058 [P] Add streaming support for tool-based flow in stock-analysis-ai/app/services/tool_agent_controller.py
- [ ] T059 [P] Update documentation with tool-based flow architecture in stock-analysis-ai/docs/
- [X] T060 [P] Code cleanup and refactoring of old RAG orchestrator (deprecate or remove) in stock-analysis-ai/app/services/rag_orchestrator.py
- [X] T061 [P] Add performance monitoring for tool call overhead in stock-analysis-ai/app/services/tool_agent_controller.py
- [X] T062 [P] Security review of tool parameter validation in stock-analysis-ai/app/services/tool_validator.py
- [X] T063 Run quickstart.md validation and update if needed in specs/002-tool-based-rag-flow/quickstart.md
- [X] T064 [P] Add integration tests for edge cases (empty KB results, tool failures, etc.) in tests/integration/test_tool_based_flow.py
- [ ] T065 [P] Add unit tests for all tool implementations in tests/unit/

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Depends on US1 for tool infrastructure but should be independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Depends on US2 for Perplexity tool but should be independently testable

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Models before services
- Services before tools
- Tools before agent controller integration
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, user stories can start sequentially (P1 → P2 → P3) or in parallel if team capacity allows
- All tests for a user story marked [P] can run in parallel
- Models within a story marked [P] can run in parallel
- Tool implementations marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Contract test for knowledge_base_search tool definition in tests/contract/test_tool_definitions.py"
Task: "Contract test for generate_response tool definition in tests/contract/test_tool_definitions.py"
Task: "Unit test for tool_validator parameter validation in tests/unit/test_tool_validator.py"
Task: "Unit test for tool_enforcer mandatory tool detection in tests/unit/test_tool_enforcer.py"

# Launch tool implementations in parallel:
Task: "Create knowledge_base_tool.py wrapping RetrievalService in stock-analysis-ai/app/services/tools/knowledge_base_tool.py"
Task: "Create response_generator_tool.py for final response formatting in stock-analysis-ai/app/services/tools/response_generator_tool.py"
Task: "Extend LLMService with tool calling support in stock-analysis-ai/app/services/llm_service.py"
```

---

## Parallel Example: Foundational Phase

```bash
# Launch all model creations in parallel:
Task: "Create ToolCall model in stock-analysis-ai/app/models.py"
Task: "Create Keyword model in stock-analysis-ai/app/models.py"
Task: "Create KeywordAssociation model in stock-analysis-ai/app/models.py"

# Launch service creations in parallel:
Task: "Create tool_validator.py with parameter validation in stock-analysis-ai/app/services/tool_validator.py"
Task: "Create tool_enforcer.py with mandatory tool detection in stock-analysis-ai/app/services/tool_enforcer.py"
Task: "Extend aiops_logger.py with tool call logging in stock-analysis-ai/app/utils/aiops_logger.py"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

**MVP Delivers**: Core tool-based query processing with mandatory KB tool and response generation tool. System can process queries using LLM-orchestrated tool calls.

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo (Enhanced with external knowledge)
4. Add User Story 3 → Test independently → Deploy/Demo (Self-improving knowledge system)
5. Each story adds value without breaking previous stories

### Sequential Team Strategy

With single developer or small team:

1. Complete Setup + Foundational together
2. Once Foundational is done:
   - Complete User Story 1 (P1) → Test → Deploy
   - Complete User Story 2 (P2) → Test → Deploy
   - Complete User Story 3 (P3) → Test → Deploy
3. Stories complete and integrate sequentially

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (can start immediately)
   - Developer B: User Story 2 (can start after US1 tool infrastructure)
   - Developer C: User Story 3 (can start after US2 Perplexity tool)
3. Stories complete and integrate as dependencies allow

---

## Task Summary

- **Total Tasks**: 65
- **Setup Tasks**: 4 (T001-T004)
- **Foundational Tasks**: 9 (T005-T013)
- **User Story 1 Tasks**: 16 (T014-T029) - 5 tests, 11 implementation
- **User Story 2 Tasks**: 11 (T030-T040) - 4 tests, 7 implementation
- **User Story 3 Tasks**: 15 (T041-T055) - 5 tests, 10 implementation
- **Polish Tasks**: 10 (T056-T065)

### Task Count per User Story

- **User Story 1 (P1)**: 16 tasks (MVP)
- **User Story 2 (P2)**: 11 tasks
- **User Story 3 (P3)**: 15 tasks

### Parallel Opportunities Identified

- **Foundational Phase**: 6 parallel tasks (models, services, logger)
- **User Story 1**: 8 parallel tasks (tests, tools, LLM service)
- **User Story 2**: 4 parallel tasks (tests, perplexity tool)
- **User Story 3**: 5 parallel tasks (tests, keyword indexer, tool)
- **Polish Phase**: 10 parallel tasks

### Independent Test Criteria

- **User Story 1**: Submit query → Verify KB tool called → Verify response tool called → Verify response returned
- **User Story 2**: Submit query requiring external knowledge → Verify Perplexity tool called → Verify results incorporated
- **User Story 3**: Submit query triggering Perplexity → Verify keywords indexed → Submit related query → Verify keywords help retrieval

### Suggested MVP Scope

**MVP = User Story 1 Only** (16 tasks)
- Delivers core tool-based architecture
- Mandatory KB tool and response generation tool
- Tool call validation and enforcement
- Independent and testable

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- Tool definitions use OpenAI function calling format (JSON Schema)
- All tool calls must be logged for observability (Constitution V)
- Parameter validation must prevent security issues (Constitution VI)
