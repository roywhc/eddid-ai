# Research: Tool-Based RAG Flow Refactoring

**Feature**: 002-tool-based-rag-flow  
**Date**: 2026-01-27  
**Purpose**: Resolve technical unknowns and establish implementation patterns

## Research Questions

### 1. LLM Tool Calling Implementation

**Question**: How to implement tool calling with existing LLM service (OpenRouter/DeepSeek)?

**Decision**: Use OpenAI SDK's function calling interface (compatible with OpenRouter) or LangChain's tool calling abstractions.

**Rationale**: 
- Existing codebase uses `openai>=1.40.0` which supports function calling
- OpenRouter API is compatible with OpenAI function calling format
- LangChain 1.0.0 provides tool abstractions that can wrap existing services
- DeepSeek models via OpenRouter support function calling

**Alternatives Considered**:
- Custom tool calling protocol: Rejected - unnecessary complexity, OpenAI format is standard
- Anthropic tool use: Rejected - not compatible with current OpenRouter setup

**Implementation Approach**:
- Define tools using OpenAI function calling schema (JSON Schema)
- Use `tools` parameter in chat completion API calls
- Handle `tool_calls` in response and execute tools
- Return tool results in subsequent API call

**References**:
- OpenAI Function Calling: https://platform.openai.com/docs/guides/function-calling
- OpenRouter Compatibility: https://openrouter.ai/docs/function-calling
- LangChain Tools: https://python.langchain.com/docs/modules/tools/

---

### 2. Tool Parameter Validation Strategy

**Question**: How to validate and sanitize tool call parameters efficiently?

**Decision**: Use Pydantic models for tool parameter validation with custom validators for sanitization and security checks.

**Rationale**:
- Existing codebase uses Pydantic 2.8.0 for validation
- Pydantic provides type validation, length limits, and custom validators
- Can integrate security checks (SQL injection, XSS patterns) in validators
- Validation overhead minimal (<10ms for typical parameters)

**Alternatives Considered**:
- Manual validation functions: Rejected - less maintainable, error-prone
- JSON Schema validation only: Rejected - insufficient for security checks

**Implementation Approach**:
- Define Pydantic models for each tool's parameters
- Add custom validators for:
  - Length limits (query strings, context)
  - Pattern matching (reject malicious patterns)
  - Type coercion and sanitization
- Validate before tool execution, return clear error messages

**References**:
- Pydantic Validators: https://docs.pydantic.dev/latest/concepts/validators/
- OWASP Input Validation: https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html

---

### 3. Mandatory Tool Call Enforcement

**Question**: How to detect and enforce mandatory tool calls when LLM doesn't call them?

**Decision**: Implement detection logic that checks LLM response for required tool calls, provide feedback, and retry with explicit instruction.

**Rationale**:
- LLM responses can be parsed to detect presence/absence of tool calls
- Retry mechanism with explicit feedback improves compliance
- Single retry balances enforcement with performance
- Error returned to user if retry fails (FR-003)

**Alternatives Considered**:
- Force tool call via prompt only: Rejected - insufficient reliability (FR-003 requires detection)
- Automatic tool execution with defaults: Rejected - defeats purpose of LLM-driven tool selection

**Implementation Approach**:
- After LLM response, check for `tool_calls` array
- If mandatory tool missing, construct feedback message
- Retry with: original prompt + feedback + explicit instruction
- Track retry attempts, return error after max retries

**References**:
- OpenAI Tool Calling Response Format: https://platform.openai.com/docs/api-reference/chat/object#chat/object-tool_calls
- LangChain Tool Calling: https://python.langchain.com/docs/modules/model_io/chat/function_calling/

---

### 4. Keyword Indexing Storage and Retrieval

**Question**: How to store and retrieve indexed keywords for future KB queries?

**Decision**: Extend existing metadata store (SQLite/PostgreSQL) with keyword tables, integrate keyword matching into KB retrieval.

**Rationale**:
- Existing `metadata_store.py` uses SQLAlchemy, can be extended
- Keywords need relational storage (associations with queries, Perplexity results)
- Can add keyword-based search to vector store queries
- Duplicate merging requires database transactions

**Alternatives Considered**:
- Separate keyword index service: Rejected - unnecessary complexity for initial implementation
- Store in vector store metadata: Rejected - less efficient for keyword lookups and merging

**Implementation Approach**:
- Add `keywords` table: id, keyword_text, created_at, usage_count
- Add `keyword_associations` table: keyword_id, query_id, perplexity_result_id
- Implement keyword search in KB retrieval: augment query with indexed keywords
- Use database transactions for duplicate merging (atomic operations)

**References**:
- SQLAlchemy Relationships: https://docs.sqlalchemy.org/en/20/orm/relationships.html
- Existing metadata_store.py structure

---

### 5. Tool Call History and Observability

**Question**: How to track tool calls for debugging and observability?

**Decision**: Extend existing AIOps logging to include tool call events with correlation IDs.

**Rationale**:
- Existing `aiops_logger.py` provides structured logging infrastructure
- Tool calls are key events that need observability (Constitution V)
- Correlation IDs enable tracing tool call chains
- Metrics can be derived from logged events

**Alternatives Considered**:
- Separate tool call logging: Rejected - duplicates existing infrastructure
- No logging: Rejected - violates Constitution V (Observability)

**Implementation Approach**:
- Add `log_tool_call()` method to AIOps logger
- Log: tool_name, parameters (sanitized), result, duration, success/failure
- Include correlation_id from query context
- Emit metrics for tool call success rates, retry frequencies

**References**:
- Existing aiops_logger.py implementation
- Structured Logging Best Practices: https://www.structlog.org/en/stable/

---

### 6. Response Generation Tool Design

**Question**: Should response generation be a tool or direct LLM response?

**Decision**: Implement as a mandatory tool that formats and structures the final response.

**Rationale**:
- Spec requirement (FR-009): LLM must use tool call for response
- Tool approach ensures structured output (answer, sources, metadata)
- Enables validation of response format
- Supports retry mechanism (FR-010)

**Alternatives Considered**:
- Direct LLM response: Rejected - violates FR-009
- Optional tool: Rejected - violates FR-009 (mandatory requirement)

**Implementation Approach**:
- Define `generate_response` tool with parameters: answer, sources, confidence_score, used_internal_kb, used_external_kb
- Tool validates response structure
- Returns formatted response object
- Enforced as mandatory with retry logic

---

### 7. Session Context Across Tool Calls

**Question**: How to maintain conversation history across multiple tool calls in a single query?

**Decision**: Maintain conversation state in Agent Controller, pass full history to each LLM API call.

**Rationale**:
- Existing SessionManager maintains conversation history
- LLM API supports conversation history in messages array
- Tool calls are part of the conversation, should be included in history
- Enables LLM to make context-aware tool call decisions

**Alternatives Considered**:
- Reset context per tool call: Rejected - loses context, violates FR-012
- Store tool calls separately: Rejected - adds complexity, LLM needs full context

**Implementation Approach**:
- Agent Controller maintains in-memory conversation state for active query
- Each LLM API call includes: system prompt + conversation history + tool results + current query
- Tool call results added to conversation history
- Final response stored in SessionManager after completion

**References**:
- OpenAI Chat Completions API: https://platform.openai.com/docs/api-reference/chat/create
- Existing SessionManager implementation

---

## Technology Decisions Summary

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Tool Calling | OpenAI Function Calling Format | Compatible with OpenRouter, standard format |
| Parameter Validation | Pydantic 2.8.0 | Existing dependency, robust validation |
| Keyword Storage | SQLAlchemy (extend metadata_store) | Existing infrastructure, relational needs |
| Tool Enforcement | Detection + Retry Logic | Balances reliability with performance |
| Observability | Extend AIOps Logger | Existing infrastructure, structured logging |
| Session Context | In-memory + SessionManager | Maintains context across tool calls |

## Open Questions Resolved

✅ All technical unknowns resolved. Ready for Phase 1 design.

## Next Steps

1. Design data model for keywords and associations
2. Define tool schemas (OpenAPI/JSON Schema format)
3. Design Agent Controller architecture
4. Create API contracts for tool definitions
