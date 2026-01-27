# Implementation Plan: Tool-Based RAG Flow Refactoring

**Branch**: `002-tool-based-rag-flow` | **Date**: 2026-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-tool-based-rag-flow/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Refactor the existing RAG orchestrator from a procedural orchestration pattern to a tool-based agentic flow where the LLM orchestrates tool calls. The LLM will decide tool call parameters, enforce mandatory tool usage (knowledge base and response generation), conditionally call Perplexity when KB results are insufficient, and create indexed keywords from Perplexity results. This shifts control from a central orchestrator to the LLM, enabling more flexible and intelligent query processing.

## Technical Context

**Language/Version**: Python 3.11+  
**Primary Dependencies**: FastAPI 0.115.0, LangChain 1.0.0, OpenAI SDK (for tool calling), ChromaDB 0.6.0+, Pydantic 2.8.0  
**Storage**: ChromaDB (vector store), SQLite/PostgreSQL (metadata store for keywords), existing session management  
**Testing**: pytest, with contract tests for tool definitions and integration tests for tool call flows  
**Target Platform**: Linux server (FastAPI backend)  
**Project Type**: Web application (backend API refactoring)  
**Performance Goals**: Process queries end-to-end in under 10 seconds for 95% of queries (SC-005)  
**Constraints**: Must maintain backward compatibility with existing API contracts, tool call validation must not add significant latency (<100ms overhead), LLM tool calling support required  
**Scale/Scope**: Refactoring existing RAG orchestrator service, adding tool-based agent controller, keyword indexing system, affecting ~5 core services

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. API-First Architecture ✅
- **Status**: PASS
- **Rationale**: Feature refactors internal flow but maintains existing REST API endpoints (`/api/chat/query`, `/api/chat/query/stream`). No API contract changes required. Tool definitions will be internal implementation details.

### II. Multi-Agent Orchestration ✅
- **Status**: PASS
- **Rationale**: This feature enables agentic behavior within the RAG system. The LLM acts as an agent orchestrating tool calls. No new external agents introduced, maintains existing service boundaries.

### III. Explainable AI (NON-NEGOTIABLE) ✅
- **Status**: PASS
- **Rationale**: All tool calls and decisions are logged (FR-014 preserves citations). LLM reasoning for tool selection and parameter tailoring can be captured. Source attribution maintained from both KB and Perplexity results.

### IV. Test-First Development ✅
- **Status**: PASS
- **Rationale**: Feature requires comprehensive tests for tool call validation, mandatory tool enforcement, keyword indexing, and error handling. Contract tests needed for tool definitions.

### V. Observability & Monitoring ✅
- **Status**: PASS
- **Rationale**: Tool call execution must be logged with correlation IDs. Metrics needed for tool call success rates, retry frequencies, keyword indexing operations. Existing AIOps logging infrastructure can be extended.

### VI. Security & Compliance ✅
- **Status**: PASS
- **Rationale**: Tool call parameter validation required (FR-002, FR-005) - validates types, sanitizes inputs, enforces length limits, rejects malicious patterns. No new authentication requirements.

### VII. Data Source Abstraction ✅
- **Status**: PASS
- **Rationale**: Knowledge base and Perplexity services remain abstracted behind tool interfaces. No changes to data source integration patterns.

**Overall Status**: ✅ ALL GATES PASS

## Project Structure

### Documentation (this feature)

```text
specs/002-tool-based-rag-flow/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── openapi.yaml     # Tool definitions and API contracts
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
stock-analysis-ai/
├── app/
│   ├── api/
│   │   └── chat.py                    # Existing API endpoints (unchanged)
│   ├── services/
│   │   ├── rag_orchestrator.py        # TO BE REFACTORED → tool_agent_controller.py
│   │   ├── llm_service.py             # TO BE EXTENDED → add tool calling support
│   │   ├── retrieval.py                # WRAPPED AS TOOL → knowledge_base_tool.py
│   │   ├── external_knowledge.py       # WRAPPED AS TOOL → perplexity_tool.py
│   │   ├── tool_validator.py           # NEW → parameter validation
│   │   ├── tool_enforcer.py            # NEW → mandatory tool call enforcement
│   │   ├── keyword_indexer.py          # NEW → keyword indexing service
│   │   └── response_generator_tool.py  # NEW → response generation tool
│   ├── models/
│   │   └── models.py                   # EXTENDED → add tool call models
│   └── db/
│       └── metadata_store.py           # EXTENDED → add keyword storage
└── tests/
    ├── contract/
    │   └── test_tool_definitions.py    # NEW → tool contract tests
    ├── integration/
    │   └── test_tool_based_flow.py     # NEW → end-to-end tool flow tests
    └── unit/
        ├── test_tool_validator.py      # NEW
        ├── test_tool_enforcer.py       # NEW
        └── test_keyword_indexer.py     # NEW
```

**Structure Decision**: Single project structure maintained. Refactoring existing services and adding new tool-related services. No new projects or major structural changes required.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations detected. All constitution principles are satisfied.
