# Tasks: Web UI for Agentic KB System

**Input**: Design documents from `/specs/001-web-ui/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Test tasks are included to align with test-first development principle (Constitution IV).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend application**: `stock-analysis-ai/kb-ui/` (under stock-analysis-ai folder)
- **Source code**: `stock-analysis-ai/kb-ui/src/`
- **Tests**: `stock-analysis-ai/kb-ui/tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create Vue 3 project structure in stock-analysis-ai/kb-ui/ directory using Vite template
- [x] T002 [P] Install core dependencies (vue-router@4, pinia, axios) in stock-analysis-ai/kb-ui/
- [x] T003 [P] Install development dependencies (vitest, @vue/test-utils, typescript, @vitejs/plugin-vue) in stock-analysis-ai/kb-ui/
- [x] T004 [P] Install Tailwind CSS and configure in stock-analysis-ai/kb-ui/tailwind.config.js
- [x] T005 [P] Configure TypeScript in stock-analysis-ai/kb-ui/tsconfig.json with path aliases
- [x] T006 [P] Configure Vite in stock-analysis-ai/kb-ui/vite.config.ts with proxy for API
- [x] T007 [P] Create .env file with VITE_API_BASE_URL in stock-analysis-ai/kb-ui/
- [x] T008 [P] Setup ESLint and Prettier configuration in stock-analysis-ai/kb-ui/
- [x] T009 Create project README.md in stock-analysis-ai/kb-ui/ with setup instructions

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T010 Create API client base configuration in stock-analysis-ai/kb-ui/src/services/api/client.ts
- [x] T011 [P] Create TypeScript type definitions for API models in stock-analysis-ai/kb-ui/src/types/api.types.ts
- [x] T012 [P] Create TypeScript type definitions for frontend models in stock-analysis-ai/kb-ui/src/types/models.types.ts
- [x] T013 [P] Create utility functions for formatters in stock-analysis-ai/kb-ui/src/utils/formatters.ts
- [x] T014 [P] Create utility functions for validators in stock-analysis-ai/kb-ui/src/utils/validators.ts
- [x] T015 [P] Create constants file in stock-analysis-ai/kb-ui/src/utils/constants.ts
- [x] T016 Setup Vue Router with base routes in stock-analysis-ai/kb-ui/src/router/index.ts
- [x] T017 Setup Pinia store configuration in stock-analysis-ai/kb-ui/src/stores/index.ts
- [x] T018 Create error handling composable in stock-analysis-ai/kb-ui/src/composables/useApi.ts
- [x] T019 Create base App.vue component with router-view in stock-analysis-ai/kb-ui/src/App.vue
- [x] T020 Create main.ts entry point with router and store initialization in stock-analysis-ai/kb-ui/src/main.ts
- [x] T021 [P] Create common UI components (Button, Input, Card) in stock-analysis-ai/kb-ui/src/components/common/

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Chat Interface (Priority: P1) 🎯 MVP

**Goal**: Users can interact with the AI knowledge base through a conversational chat interface to ask questions and receive answers with citations.

**Independent Test**: Open the chat interface, send a query, and verify that an answer is returned with proper formatting and citations. This delivers immediate value as users can start querying the knowledge base.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T022 [P] [US1] Unit test for chat service in stock-analysis-ai/kb-ui/tests/unit/services/chat.service.test.ts
- [ ] T023 [P] [US1] Component test for ChatView in stock-analysis-ai/kb-ui/tests/component/views/ChatView.test.ts
- [ ] T024 [P] [US1] Component test for ChatMessage component in stock-analysis-ai/kb-ui/tests/component/components/chat/ChatMessage.test.ts
- [ ] T025 [P] [US1] E2E test for chat query flow in stock-analysis-ai/kb-ui/tests/e2e/chat.spec.ts

### Implementation for User Story 1

- [x] T026 [P] [US1] Create ChatMessage type in stock-analysis-ai/kb-ui/src/types/models.types.ts
- [x] T027 [P] [US1] Create Citation type in stock-analysis-ai/kb-ui/src/types/models.types.ts
- [x] T028 [P] [US1] Create ChatSession type in stock-analysis-ai/kb-ui/src/types/models.types.ts
- [x] T029 [US1] Implement chat service in stock-analysis-ai/kb-ui/src/services/chat.service.ts
- [x] T030 [US1] Create chat store with session management in stock-analysis-ai/kb-ui/src/stores/chat.store.ts
- [x] T031 [US1] Create session store for localStorage persistence in stock-analysis-ai/kb-ui/src/stores/session.store.ts
- [x] T032 [US1] Create useSession composable in stock-analysis-ai/kb-ui/src/composables/useSession.ts
- [x] T033 [US1] Create ChatView component in stock-analysis-ai/kb-ui/src/views/ChatView.vue
- [x] T034 [US1] Create ChatMessage component in stock-analysis-ai/kb-ui/src/components/chat/ChatMessage.vue
- [x] T035 [US1] Create ChatInput component in stock-analysis-ai/kb-ui/src/components/chat/ChatInput.vue
- [x] T036 [US1] Create CitationList component in stock-analysis-ai/kb-ui/src/components/chat/CitationList.vue
- [x] T037 [US1] Create LoadingIndicator component in stock-analysis-ai/kb-ui/src/components/common/LoadingIndicator.vue
- [x] T038 [US1] Implement input validation for chat queries in stock-analysis-ai/kb-ui/src/components/chat/ChatInput.vue
- [x] T039 [US1] Implement session persistence in localStorage in stock-analysis-ai/kb-ui/src/stores/session.store.ts
- [x] T040 [US1] Implement conversation history display in stock-analysis-ai/kb-ui/src/views/ChatView.vue
- [x] T041 [US1] Implement citation display and click handling in stock-analysis-ai/kb-ui/src/components/chat/CitationList.vue
- [x] T042 [US1] Add error handling and user-friendly error messages in stock-analysis-ai/kb-ui/src/views/ChatView.vue
- [x] T043 [US1] Add loading states during API calls in stock-analysis-ai/kb-ui/src/views/ChatView.vue
- [x] T044 [US1] Implement follow-up question context handling in stock-analysis-ai/kb-ui/src/stores/chat.store.ts

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Users can chat with the AI and receive answers with citations.

---

## Phase 4: User Story 2 - Knowledge Base Management (Priority: P2)

**Goal**: Administrators can view, create, edit, and delete documents in the knowledge base through a web interface.

**Independent Test**: Navigate to the KB management section and perform CRUD operations on documents. This delivers value by enabling knowledge base maintenance without API calls.

### Tests for User Story 2

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T045 [P] [US2] Unit test for documents service in stock-analysis-ai/kb-ui/tests/unit/services/documents.service.test.ts
- [ ] T046 [P] [US2] Component test for DocumentsView in stock-analysis-ai/kb-ui/tests/component/views/DocumentsView.test.ts
- [ ] T047 [P] [US2] Component test for DocumentForm component in stock-analysis-ai/kb-ui/tests/component/components/kb/DocumentForm.test.ts
- [ ] T048 [P] [US2] E2E test for document CRUD operations in stock-analysis-ai/kb-ui/tests/e2e/documents.spec.ts

### Implementation for User Story 2

- [x] T049 [P] [US2] Create Document type in stock-analysis-ai/kb-ui/src/types/models.types.ts
- [x] T050 [P] [US2] Create KBUpdateRequest type in stock-analysis-ai/kb-ui/src/types/api.types.ts
- [x] T051 [US2] Implement documents service in stock-analysis-ai/kb-ui/src/services/documents.service.ts
- [x] T052 [US2] Create documents store with pagination in stock-analysis-ai/kb-ui/src/stores/documents.store.ts
- [x] T053 [US2] Create usePagination composable in stock-analysis-ai/kb-ui/src/composables/usePagination.ts
- [x] T054 [US2] Create DocumentsView component in stock-analysis-ai/kb-ui/src/views/DocumentsView.vue
- [x] T055 [US2] Create DocumentList component in stock-analysis-ai/kb-ui/src/components/kb/DocumentList.vue
- [x] T056 [US2] Create DocumentForm component in stock-analysis-ai/kb-ui/src/components/kb/DocumentForm.vue
- [x] T057 [US2] Create DocumentCard component in stock-analysis-ai/kb-ui/src/components/kb/DocumentCard.vue
- [x] T058 [US2] Create Pagination component in stock-analysis-ai/kb-ui/src/components/common/Pagination.vue
- [x] T059 [US2] Create SearchInput component in stock-analysis-ai/kb-ui/src/components/common/SearchInput.vue
- [x] T060 [US2] Implement document list with pagination in stock-analysis-ai/kb-ui/src/views/DocumentsView.vue
- [x] T061 [US2] Implement document creation form in stock-analysis-ai/kb-ui/src/components/kb/DocumentForm.vue
- [x] T062 [US2] Implement document edit functionality in stock-analysis-ai/kb-ui/src/components/kb/DocumentForm.vue
- [x] T063 [US2] Implement document deletion with confirmation in stock-analysis-ai/kb-ui/src/views/DocumentsView.vue
- [x] T064 [US2] Implement document search and filtering in stock-analysis-ai/kb-ui/src/stores/documents.store.ts
- [x] T065 [US2] Add form validation for document fields in stock-analysis-ai/kb-ui/src/components/kb/DocumentForm.vue
- [x] T066 [US2] Add empty state for no documents in stock-analysis-ai/kb-ui/src/components/kb/DocumentList.vue
- [x] T067 [US2] Add success/error feedback for document operations in stock-analysis-ai/kb-ui/src/views/DocumentsView.vue

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Administrators can manage documents in the knowledge base.

---

## Phase 5: User Story 3 - Candidate Review Interface (Priority: P2)

**Goal**: Administrators can review, approve, reject, or modify candidate entries generated from external knowledge sources.

**Independent Test**: Navigate to the candidates page, view pending candidates, and perform review actions. This delivers value by enabling quality control of automatically generated knowledge entries.

### Tests for User Story 3

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T068 [P] [US3] Unit test for candidates service in stock-analysis-ai/kb-ui/tests/unit/services/candidates.service.test.ts
- [ ] T069 [P] [US3] Component test for CandidatesView in stock-analysis-ai/kb-ui/tests/component/views/CandidatesView.test.ts
- [ ] T070 [P] [US3] Component test for CandidateCard component in stock-analysis-ai/kb-ui/tests/component/components/kb/CandidateCard.test.ts
- [ ] T071 [P] [US3] E2E test for candidate review workflow in stock-analysis-ai/kb-ui/tests/e2e/candidates.spec.ts

### Implementation for User Story 3

- [x] T072 [P] [US3] Create Candidate type in stock-analysis-ai/kb-ui/src/types/models.types.ts
- [x] T073 [P] [US3] Create CandidateApproveRequest type in stock-analysis-ai/kb-ui/src/types/api.types.ts
- [x] T074 [P] [US3] Create CandidateRejectRequest type in stock-analysis-ai/kb-ui/src/types/api.types.ts
- [x] T075 [P] [US3] Create CandidateModifyRequest type in stock-analysis-ai/kb-ui/src/types/api.types.ts
- [x] T076 [US3] Implement candidates service in stock-analysis-ai/kb-ui/src/services/candidates.service.ts
- [x] T077 [US3] Create candidates store with filtering in stock-analysis-ai/kb-ui/src/stores/candidates.store.ts
- [x] T078 [US3] Create CandidatesView component in stock-analysis-ai/kb-ui/src/views/CandidatesView.vue
- [x] T079 [US3] Create CandidateList component in stock-analysis-ai/kb-ui/src/components/kb/CandidateList.vue
- [x] T080 [US3] Create CandidateCard component in stock-analysis-ai/kb-ui/src/components/kb/CandidateCard.vue
- [x] T081 [US3] Create CandidateReviewDialog component in stock-analysis-ai/kb-ui/src/components/kb/CandidateReviewDialog.vue
- [x] T082 [US3] Create StatusFilter component in stock-analysis-ai/kb-ui/src/components/common/StatusFilter.vue
- [x] T083 [US3] Implement candidate list with status filtering in stock-analysis-ai/kb-ui/src/views/CandidatesView.vue
- [x] T084 [US3] Implement candidate approval functionality in stock-analysis-ai/kb-ui/src/components/kb/CandidateReviewDialog.vue
- [x] T085 [US3] Implement candidate rejection functionality in stock-analysis-ai/kb-ui/src/components/kb/CandidateReviewDialog.vue
- [x] T086 [US3] Implement candidate modify and approve functionality in stock-analysis-ai/kb-ui/src/components/kb/CandidateReviewDialog.vue
- [x] T087 [US3] Add candidate source information display in stock-analysis-ai/kb-ui/src/components/kb/CandidateCard.vue
- [x] T088 [US3] Add review notes input in stock-analysis-ai/kb-ui/src/components/kb/CandidateReviewDialog.vue
- [x] T089 [US3] Add status filter dropdown in stock-analysis-ai/kb-ui/src/views/CandidatesView.vue
- [x] T090 [US3] Add empty state for no candidates in stock-analysis-ai/kb-ui/src/components/kb/CandidateList.vue
- [x] T091 [US3] Add success/error feedback for review actions in stock-analysis-ai/kb-ui/src/views/CandidatesView.vue

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently. Administrators can review and manage candidate entries.

---

## Phase 6: User Story 4 - System Monitoring Dashboard (Priority: P3)

**Goal**: Administrators can view system health, metrics, and performance indicators through a monitoring dashboard.

**Independent Test**: Navigate to the monitoring dashboard and verify that health status, metrics, and performance data are displayed correctly. This delivers value by enabling system administrators to monitor system health.

### Tests for User Story 4

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T092 [P] [US4] Unit test for health service in stock-analysis-ai/kb-ui/tests/unit/services/health.service.test.ts
- [ ] T093 [P] [US4] Component test for MonitoringView in stock-analysis-ai/kb-ui/tests/component/views/MonitoringView.test.ts
- [ ] T094 [P] [US4] Component test for HealthStatus component in stock-analysis-ai/kb-ui/tests/component/components/monitoring/HealthStatus.test.ts
- [ ] T095 [P] [US4] E2E test for monitoring dashboard in stock-analysis-ai/kb-ui/tests/e2e/monitoring.spec.ts

### Implementation for User Story 4

- [x] T096 [P] [US4] Create HealthStatus type in stock-analysis-ai/kb-ui/src/types/models.types.ts
- [x] T097 [P] [US4] Create MetricsSummary type in stock-analysis-ai/kb-ui/src/types/api.types.ts
- [x] T098 [US4] Implement health service in stock-analysis-ai/kb-ui/src/services/health.service.ts
- [x] T099 [US4] Create MonitoringView component in stock-analysis-ai/kb-ui/src/views/MonitoringView.vue
- [x] T100 [US4] Create HealthStatus component in stock-analysis-ai/kb-ui/src/components/monitoring/HealthStatus.vue
- [x] T101 [US4] Create MetricsCard component in stock-analysis-ai/kb-ui/src/components/monitoring/MetricsCard.vue
- [x] T102 [US4] Create ComponentStatus component in stock-analysis-ai/kb-ui/src/components/monitoring/ComponentStatus.vue
- [x] T103 [US4] Implement health status display in stock-analysis-ai/kb-ui/src/views/MonitoringView.vue
- [x] T104 [US4] Implement metrics summary display in stock-analysis-ai/kb-ui/src/components/monitoring/MetricsCard.vue
- [x] T105 [US4] Implement component health indicators in stock-analysis-ai/kb-ui/src/components/monitoring/ComponentStatus.vue
- [x] T106 [US4] Add auto-refresh for health status in stock-analysis-ai/kb-ui/src/views/MonitoringView.vue
- [x] T107 [US4] Add warning indicators for unhealthy components in stock-analysis-ai/kb-ui/src/components/monitoring/ComponentStatus.vue
- [x] T108 [US4] Add metrics visualization (if needed) in stock-analysis-ai/kb-ui/src/components/monitoring/MetricsCard.vue

**Checkpoint**: All user stories should now be independently functional. The complete UI is ready with chat, document management, candidate review, and monitoring capabilities.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T109 [P] Implement responsive design for mobile devices (320px+) in all views
- [ ] T110 [P] Add navigation menu/header component in stock-analysis-ai/kb-ui/src/components/common/Navigation.vue
- [ ] T111 [P] Implement consistent error handling across all views in stock-analysis-ai/kb-ui/src/composables/useApi.ts
- [ ] T112 [P] Add loading states consistency across all components
- [ ] T113 [P] Implement empty states for all list views
- [ ] T114 [P] Add visual feedback (success, error, warning) consistency in stock-analysis-ai/kb-ui/src/components/common/Toast.vue
- [ ] T115 [P] Optimize bundle size with code splitting in stock-analysis-ai/kb-ui/vite.config.ts
- [ ] T116 [P] Add performance optimizations (lazy loading, memoization) in components
- [ ] T117 [P] Update documentation in stock-analysis-ai/kb-ui/README.md
- [ ] T118 [P] Run quickstart.md validation and update if needed
- [ ] T119 [P] Add accessibility improvements (ARIA attributes, keyboard navigation)
- [ ] T120 [P] Code cleanup and refactoring across all components
- [ ] T121 [P] Add additional unit tests for edge cases in stock-analysis-ai/kb-ui/tests/unit/
- [ ] T122 [P] Verify all success criteria from spec.md are met

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Independent from US1, can run in parallel
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Independent from US1/US2, can run in parallel
- **User Story 4 (P3)**: Can start after Foundational (Phase 2) - Independent from other stories, can run in parallel

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Types before services
- Services before stores
- Stores before components
- Components before views
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Types within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Unit test for chat service in stock-analysis-ai/kb-ui/tests/unit/services/chat.service.test.ts"
Task: "Component test for ChatView in stock-analysis-ai/kb-ui/tests/component/views/ChatView.test.ts"
Task: "Component test for ChatMessage component in stock-analysis-ai/kb-ui/tests/component/components/chat/ChatMessage.test.ts"
Task: "E2E test for chat query flow in stock-analysis-ai/kb-ui/tests/e2e/chat.spec.ts"

# Launch all types for User Story 1 together:
Task: "Create ChatMessage type in stock-analysis-ai/kb-ui/src/types/models.types.ts"
Task: "Create Citation type in stock-analysis-ai/kb-ui/src/types/models.types.ts"
Task: "Create ChatSession type in stock-analysis-ai/kb-ui/src/types/models.types.ts"

# Launch all components for User Story 1 together (after services/stores):
Task: "Create ChatMessage component in stock-analysis-ai/kb-ui/src/components/chat/ChatMessage.vue"
Task: "Create ChatInput component in stock-analysis-ai/kb-ui/src/components/chat/ChatInput.vue"
Task: "Create CitationList component in stock-analysis-ai/kb-ui/src/components/chat/CitationList.vue"
Task: "Create LoadingIndicator component in stock-analysis-ai/kb-ui/src/components/common/LoadingIndicator.vue"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Chat Interface)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Chat Interface)
   - Developer B: User Story 2 (Document Management)
   - Developer C: User Story 3 (Candidate Review)
   - Developer D: User Story 4 (Monitoring Dashboard)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- All file paths are relative to repository root
- Follow Vue 3 Composition API patterns
- Use TypeScript for type safety
- Follow Pinia store patterns for state management
- Use Axios for all API calls through service layer

---

## Task Summary

- **Total Tasks**: 122
- **Setup Phase**: 9 tasks
- **Foundational Phase**: 12 tasks
- **User Story 1 (Chat)**: 23 tasks (8 tests + 15 implementation)
- **User Story 2 (Documents)**: 23 tasks (4 tests + 19 implementation)
- **User Story 3 (Candidates)**: 24 tasks (4 tests + 20 implementation)
- **User Story 4 (Monitoring)**: 13 tasks (4 tests + 9 implementation)
- **Polish Phase**: 14 tasks

**Parallel Opportunities**: 
- Setup: 7 parallel tasks
- Foundational: 8 parallel tasks
- User Stories: Can all run in parallel after foundational phase
- Within each story: Tests and types can run in parallel

**Suggested MVP Scope**: Phase 1 + Phase 2 + Phase 3 (User Story 1 - Chat Interface)
