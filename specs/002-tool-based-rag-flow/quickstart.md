# Quick Start Guide: Tool-Based RAG Flow

**Feature**: 002-tool-based-rag-flow  
**Date**: 2026-01-27

## Overview

This guide provides a quick introduction to the tool-based RAG flow refactoring. The system refactors the existing RAG orchestrator to use a tool-based agentic architecture where the LLM orchestrates tool calls.

## Key Concepts

### Tool-Based Architecture

Instead of a procedural orchestrator, the LLM now:
1. Receives a system prompt with tool definitions
2. Decides which tools to call and with what parameters
3. Executes tools and processes results
4. Makes decisions about whether additional tools are needed
5. Generates final response using a mandatory response tool

### Mandatory Tools

- **Knowledge Base Tool**: Must be called for every query
- **Response Generation Tool**: Must be called to return the final answer

### Conditional Tools

- **Perplexity Tool**: Called only when KB results are insufficient
- **Keyword Indexing Tool**: Called automatically after Perplexity results

## Architecture Flow

```
User Query
    ↓
Chat API (/api/chat/query)
    ↓
Agent Controller (Tool Orchestrator)
    ↓
LLM with Tool Definitions
    ↓
[LLM decides tool calls]
    ↓
Tool Execution (KB → Perplexity? → Keywords? → Response)
    ↓
Final Response
```

## Tool Definitions

### 1. knowledge_base_search (Mandatory)

**Purpose**: Search internal knowledge base

**Parameters**:
- `query` (string, required): Tailored search query
- `kb_id` (string, default: "default_kb")
- `top_k` (integer, default: 5)

**Returns**: Chunks with content, scores, metadata

### 2. perplexity_search (Conditional)

**Purpose**: Search external knowledge via Perplexity

**Parameters**:
- `query` (string, required): Tailored search query
- `context` (string, optional): KB results summary

**Returns**: Answer, citations, metadata

### 3. index_keywords (Automatic after Perplexity)

**Purpose**: Index keywords from Perplexity results

**Parameters**:
- `keywords` (array, required): 3-10 keywords (2-50 chars each)
- `query_id` (string, optional)
- `perplexity_result_id` (string, optional)

**Returns**: Indexing confirmation

### 4. generate_response (Mandatory)

**Purpose**: Format and return final response

**Parameters**:
- `answer` (string, required)
- `sources` (array, required)
- `confidence_score` (float, optional)
- `used_internal_kb` (boolean, required)
- `used_external_kb` (boolean, required)

**Returns**: Formatted response

## Example Query Flow

### Query: "What is the current price of AAPL?"

1. **LLM receives query** with system prompt and tool definitions

2. **LLM calls knowledge_base_search**:
   ```json
   {
     "tool": "knowledge_base_search",
     "parameters": {
       "query": "AAPL Apple stock price current",
       "kb_id": "default_kb",
       "top_k": 5
     }
   }
   ```
   - Returns: KB chunks with AAPL information

3. **LLM evaluates sufficiency**:
   - KB has general AAPL info but not current price
   - Decides: Insufficient → Call Perplexity

4. **LLM calls perplexity_search**:
   ```json
   {
     "tool": "perplexity_search",
     "parameters": {
       "query": "AAPL Apple stock current price January 2026",
       "context": "User asking about AAPL stock price. KB has general info but not current price."
     }
   }
   ```
   - Returns: Current price, market data, citations

5. **LLM calls index_keywords**:
   ```json
   {
     "tool": "index_keywords",
     "parameters": {
       "keywords": ["AAPL stock price", "Apple stock", "current market price"],
       "query_id": "query_123",
       "perplexity_result_id": "perplexity_456"
     }
   }
   ```
   - Returns: Keywords indexed

6. **LLM calls generate_response**:
   ```json
   {
     "tool": "generate_response",
     "parameters": {
       "answer": "As of January 27, 2026, AAPL is trading at $...",
       "sources": [/* KB citations */, /* Perplexity citations */],
       "confidence_score": 0.85,
       "used_internal_kb": true,
       "used_external_kb": true
     }
   }
   ```
   - Returns: Final formatted response

7. **Agent Controller** returns response to user

## API Usage

### Standard Request

```bash
curl -X POST http://localhost:8000/api/chat/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is the current price of AAPL?",
    "session_id": "session_123",
    "use_external_kb": true,
    "include_sources": true
  }'
```

### Streaming Request

```bash
curl -X POST http://localhost:8000/api/chat/query/stream \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is the current price of AAPL?",
    "session_id": "session_123"
  }'
```

## Error Handling

### Missing Mandatory Tool

If LLM doesn't call mandatory tool:
1. System detects missing tool call
2. Provides feedback to LLM
3. Retries once
4. If still missing, returns error to user

### Tool Call Validation Failure

If tool parameters are invalid:
1. Validator rejects parameters
2. Returns error message to LLM
3. LLM can retry with corrected parameters

### Perplexity API Failure

If Perplexity API fails:
1. System logs error
2. LLM proceeds with KB results only
3. Response generated from available information

## Keyword Indexing

### Automatic Indexing

Keywords are automatically indexed when:
- Perplexity tool is called
- Perplexity returns results
- LLM extracts keywords (3-10 recommended)

### Keyword Quality

Keywords must:
- Be 2-50 characters
- Be non-empty
- Not be generic words ("the", "and", "is")
- Represent core concepts

### Duplicate Handling

If duplicate keywords detected:
- System merges duplicates
- Associates keyword with all related queries/results
- Updates usage count

## Observability

### Tool Call Logging

All tool calls are logged with:
- Tool name and parameters (sanitized)
- Execution result and status
- Duration and retry count
- Correlation ID (query_id)

### Metrics

Key metrics tracked:
- Tool call success rates
- Tool call durations
- Retry frequencies
- Keyword indexing operations
- Mandatory tool compliance

## Testing

### Unit Tests

Test individual components:
- Tool parameter validation
- Tool call enforcement
- Keyword indexing
- Response generation

### Integration Tests

Test end-to-end flows:
- Complete query processing
- Tool call sequences
- Error handling
- Retry mechanisms

### Contract Tests

Test tool definitions:
- Tool schemas match implementation
- Parameter validation rules
- Return value formats

## Next Steps

1. Review [data-model.md](./data-model.md) for data structures
2. Review [contracts/openapi.yaml](./contracts/openapi.yaml) for API contracts
3. Review [sequence-diagram.md](./sequence-diagram.md) for detailed flows
4. Proceed to implementation tasks

## References

- [Specification](./spec.md)
- [Implementation Plan](./plan.md)
- [Research](./research.md)
- [Data Model](./data-model.md)
- [Sequence Diagram](./sequence-diagram.md)
