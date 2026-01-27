# Data Model: Tool-Based RAG Flow

**Feature**: 002-tool-based-rag-flow  
**Date**: 2026-01-27

## Overview

This feature extends the existing data model to support:
1. Tool call tracking and history
2. Keyword indexing from Perplexity results
3. Tool call validation metadata

## New Entities

### Keyword

Represents an indexed keyword extracted from Perplexity results for future knowledge base queries.

**Fields**:
- `keyword_id` (UUID, Primary Key): Unique identifier
- `keyword_text` (String, 2-50 chars, Required, Indexed): The keyword text (validated: 2-50 characters, non-empty)
- `created_at` (DateTime, Required): When keyword was first created
- `updated_at` (DateTime, Required): Last update timestamp
- `usage_count` (Integer, Default: 1): Number of times keyword has been used/associated
- `last_used_at` (DateTime, Nullable): Last time keyword was used in a query

**Validation Rules**:
- `keyword_text`: Must be 2-50 characters, non-empty, trimmed
- `keyword_text`: Must not be generic words (filtered: "the", "and", "is", "a", "an", etc.)
- `keyword_text`: Case-insensitive uniqueness (duplicates merged)

**Relationships**:
- One-to-Many with `KeywordAssociation` (a keyword can be associated with multiple queries/results)

**State Transitions**:
- Created → Active (on first indexing)
- Active → Pruned (when manually or automatically pruned based on usage/age)

---

### KeywordAssociation

Associates keywords with queries and Perplexity results for traceability and retrieval.

**Fields**:
- `association_id` (UUID, Primary Key): Unique identifier
- `keyword_id` (UUID, Foreign Key → Keyword, Required): Reference to keyword
- `query_id` (String, Nullable): Original query that triggered Perplexity (for traceability)
- `perplexity_result_id` (String, Nullable): Perplexity result ID (for traceability)
- `session_id` (String, Nullable): Session ID where keyword was created
- `created_at` (DateTime, Required): When association was created

**Validation Rules**:
- At least one of `query_id` or `perplexity_result_id` must be present
- `keyword_id` must reference existing keyword

**Relationships**:
- Many-to-One with `Keyword` (multiple associations per keyword)
- Optional relationship to query/session for traceability

**State Transitions**:
- Created → Active (on association creation)
- Active → Archived (when keyword is pruned, associations preserved for audit)

---

### ToolCall

Tracks tool calls made during query processing for debugging, logging, and analysis.

**Fields**:
- `tool_call_id` (UUID, Primary Key): Unique identifier
- `query_id` (String, Required): Correlation ID linking to user query
- `session_id` (String, Nullable): Session ID
- `tool_name` (String, Required, Indexed): Name of tool called (e.g., "knowledge_base_search", "perplexity_search", "generate_response")
- `parameters` (JSON, Required): Tool call parameters (sanitized, no sensitive data)
- `result` (JSON, Nullable): Tool execution result (may be truncated for large results)
- `status` (Enum: "success", "failure", "retry", Required): Execution status
- `error_message` (String, Nullable): Error message if status is "failure"
- `duration_ms` (Integer, Required): Tool execution duration in milliseconds
- `retry_count` (Integer, Default: 0): Number of retries attempted
- `created_at` (DateTime, Required): When tool call was made

**Validation Rules**:
- `tool_name`: Must be one of valid tool names
- `parameters`: Must be valid JSON, validated against tool schema
- `duration_ms`: Must be non-negative

**Relationships**:
- Many tool calls per query (query_id correlation)

**State Transitions**:
- Created → Executing → Success/Failure
- Failure → Retry → Success/Failure (max 1 retry for response generation tool)

---

## Extended Entities

### Existing: Query/Session (from SessionManager)

**Extensions**:
- Add `tool_call_count` (Integer): Number of tool calls made for this query
- Add `used_tools` (Array of Strings): List of tool names used
- Add `keyword_count` (Integer): Number of keywords indexed (if Perplexity used)

---

## Database Schema

### Keywords Table

```sql
CREATE TABLE keywords (
    keyword_id UUID PRIMARY KEY,
    keyword_text VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    usage_count INTEGER NOT NULL DEFAULT 1,
    last_used_at TIMESTAMP,
    CONSTRAINT keyword_text_length CHECK (LENGTH(keyword_text) >= 2 AND LENGTH(keyword_text) <= 50),
    CONSTRAINT keyword_text_unique UNIQUE (LOWER(keyword_text))
);

CREATE INDEX idx_keywords_text ON keywords(LOWER(keyword_text));
CREATE INDEX idx_keywords_usage ON keywords(usage_count DESC, last_used_at DESC);
```

### Keyword Associations Table

```sql
CREATE TABLE keyword_associations (
    association_id UUID PRIMARY KEY,
    keyword_id UUID NOT NULL REFERENCES keywords(keyword_id) ON DELETE CASCADE,
    query_id VARCHAR(255),
    perplexity_result_id VARCHAR(255),
    session_id VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT at_least_one_reference CHECK (query_id IS NOT NULL OR perplexity_result_id IS NOT NULL)
);

CREATE INDEX idx_keyword_associations_keyword ON keyword_associations(keyword_id);
CREATE INDEX idx_keyword_associations_query ON keyword_associations(query_id);
CREATE INDEX idx_keyword_associations_perplexity ON keyword_associations(perplexity_result_id);
```

### Tool Calls Table

```sql
CREATE TABLE tool_calls (
    tool_call_id UUID PRIMARY KEY,
    query_id VARCHAR(255) NOT NULL,
    session_id VARCHAR(255),
    tool_name VARCHAR(100) NOT NULL,
    parameters JSONB NOT NULL,
    result JSONB,
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failure', 'retry')),
    error_message TEXT,
    duration_ms INTEGER NOT NULL CHECK (duration_ms >= 0),
    retry_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tool_calls_query ON tool_calls(query_id);
CREATE INDEX idx_tool_calls_session ON tool_calls(session_id);
CREATE INDEX idx_tool_calls_tool_name ON tool_calls(tool_name);
CREATE INDEX idx_tool_calls_status ON tool_calls(status);
```

---

## Data Operations

### Keyword Indexing (with Duplicate Handling)

**Operation**: Index keywords from Perplexity results

**Steps**:
1. Validate keywords (2-50 chars, non-empty, not generic)
2. For each keyword:
   - Check if keyword exists (case-insensitive)
   - If exists: Update `usage_count++`, `last_used_at`, `updated_at`
   - If new: Insert new keyword
   - Create association record linking keyword to query and Perplexity result
3. Use database transaction to ensure atomicity

**Concurrency**: Use database transactions with appropriate isolation level to handle concurrent keyword indexing safely.

---

### Keyword Retrieval for KB Queries

**Operation**: Retrieve relevant keywords for a query to enhance KB search

**Steps**:
1. Extract key terms from user query
2. Search keywords table for matches (case-insensitive, partial match)
3. Retrieve associated query_ids and perplexity_result_ids
4. Optionally: Use keyword context to enhance KB query

**Performance**: Indexed on `keyword_text` for fast lookups.

---

### Tool Call Logging

**Operation**: Log tool call for observability

**Steps**:
1. Create ToolCall record with sanitized parameters
2. Execute tool
3. Update record with result, status, duration
4. If retry: Update `retry_count`, create new record or update existing

**Privacy**: Parameters and results sanitized to remove sensitive data before storage.

---

## Validation Rules Summary

### Keyword Validation
- Length: 2-50 characters
- Non-empty after trimming
- Not in generic word list
- Case-insensitive uniqueness

### Tool Call Validation
- Tool name must be valid
- Parameters must match tool schema
- Duration must be non-negative
- Status must be valid enum value

### Association Validation
- At least one reference (query_id or perplexity_result_id)
- Keyword must exist

---

## Migration Strategy

1. **Phase 1**: Create new tables (keywords, keyword_associations, tool_calls)
2. **Phase 2**: Migrate existing data if needed (none for this feature)
3. **Phase 3**: Update application code to use new tables
4. **Phase 4**: Add indexes for performance
5. **Phase 5**: Add constraints and validation

---

## Notes

- Keywords are case-insensitive for duplicate detection but stored in original case
- Tool call parameters are stored as JSONB for efficient querying
- Keyword associations preserve full traceability for audit purposes
- Tool call history enables debugging and performance analysis
- Duplicate keyword merging is atomic via database transactions
