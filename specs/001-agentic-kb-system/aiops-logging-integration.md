# AIOps Logging Integration Summary

**Date**: 2026-01-25  
**Feature**: Agentic AI Knowledge Base System  
**Enhancement**: Structured AIOps Logging  
**Status**: ✅ **COMPLETE**

## Summary

Implemented comprehensive AIOps (AI Operations) logging system that captures all interactions during query processing. Each query creates a timestamped folder with sequential JSON log files documenting the complete request lifecycle.

## Folder Structure

```
aiops/
├── YYYY-MM-DD/                    # Date folder
│   ├── HH-MM-SS-{query_id}/       # Query folder (timestamp + 12-char ID)
│   │   ├── 00-summary.json        # Query summary
│   │   ├── 01-user-query.json     # User query
│   │   ├── 02-kb-search.json      # KB search results
│   │   ├── 03-perplexity-query.json  # Perplexity query (if used)
│   │   ├── 04-llm-prompt.json   # LLM prompt sent
│   │   ├── 05-llm-response.json   # LLM response received
│   │   ├── 06-final-response.json # Final response
│   │   └── 99-error.json          # Error log (if error occurred)
│   └── ...
└── ...
```

## Components Implemented

### 1. ✅ AIOpsLogger (`app/utils/aiops_logger.py`)

**Purpose**: Structured logging service for AI operations

**Key Features**:
- Automatic folder creation with date/time structure
- Sequential file numbering (01-, 02-, etc.)
- JSON format with indentation for readability
- Preview fields for large content (first 500-1000 chars)
- Full length tracking for analysis
- Error logging support
- Configurable enable/disable

**Key Methods**:
- `start_query(query, session_id, **metadata) -> str` - Start logging a query
- `log_user_query(query, session_id, **metadata)` - Log user query
- `log_kb_search(query, kb_id, results, confidence_score, **metadata)` - Log KB search
- `log_perplexity_query(query, additional_context, response, query_time_ms, **metadata)` - Log Perplexity query
- `log_llm_prompt(system_prompt, messages, model, temperature, is_stock_analysis, **metadata)` - Log LLM prompt
- `log_llm_response(response, model, response_time_ms, token_usage, **metadata)` - Log LLM response
- `log_final_response(...)` - Log final response
- `log_error(error_type, error_message, **metadata)` - Log errors
- `end_query()` - End query logging and create summary

### 2. ✅ Configuration (`app/config.py`)

**Added Settings**:
- `aiops_logging_enabled: bool = True` - Enable/disable logging
- `aiops_log_dir: str = "./aiops"` - Base directory for logs
- `aiops_retention_days: int = 7` - Retention period (for future cleanup)

### 3. ✅ RAG Orchestrator Integration (`app/services/rag_orchestrator.py`)

**Integration Points**:
- Start query logging at beginning of `process_query()`
- Log KB search results after retrieval
- Log Perplexity query when external KB is used
- Log final response with all metadata
- Log errors if they occur
- End query logging at completion

**Logged Information**:
- User query and session ID
- KB search results with confidence scores
- Perplexity queries with response times
- Final response with citations and processing time
- Candidate generation (if applicable)

### 4. ✅ LLM Service Integration (`app/services/llm_service.py`)

**Integration Points**:
- Log LLM prompt before sending to API
- Log LLM response after receiving
- Capture token usage if available
- Track response times

**Logged Information**:
- System prompt preview (first 1000 chars)
- Full prompt length
- Message count and previews
- Model and temperature settings
- Stock analysis detection flag
- Response preview and length
- Response time
- Token usage (if available)

### 5. ✅ Documentation (`docs/AIOPS-LOGGING.md`)

**Contents**:
- Overview and folder structure
- Detailed description of each log file
- Configuration options
- Example log files
- Privacy and security considerations
- Troubleshooting guide

## Log File Details

### 00-summary.json
- Query ID
- Completion timestamp
- Total sequences logged

### 01-user-query.json
- Query text
- Session ID
- Request metadata

### 02-kb-search.json
- Query text
- KB ID searched
- Result count
- Confidence score
- Top 10 results (chunk_id, score, content preview, document info)

### 03-perplexity-query.json (conditional)
- Query text
- Additional context from internal KB
- Query time (ms)
- Response preview
- Citation count and top 10 citations

### 04-llm-prompt.json
- Model name
- Temperature
- Stock analysis flag
- System prompt preview (1000 chars)
- System prompt length
- Message count
- Messages with role and content preview (500 chars each)

### 05-llm-response.json
- Model name
- Response preview (500 chars)
- Response length
- Response time (ms)
- Token usage (if available)

### 06-final-response.json
- Query text
- Answer preview (500 chars)
- Answer length
- Session ID
- Confidence score
- Used internal/external KB flags
- Citation count and top 20 citations
- Processing time (ms)
- Candidate ID (if generated)

### 99-error.json (conditional)
- Error type
- Error message
- Metadata

## Features

### Automatic Logging
- ✅ No code changes needed in application code
- ✅ Integrated into RAG pipeline automatically
- ✅ Captures all interactions

### Structured Format
- ✅ JSON format for easy parsing
- ✅ Sequential numbering for order
- ✅ Preview fields for large content
- ✅ Full length tracking

### Performance Tracking
- ✅ Query processing time
- ✅ KB search time
- ✅ Perplexity query time
- ✅ LLM response time
- ✅ Token usage (if available)

### Error Handling
- ✅ Errors logged to separate file
- ✅ Query logging continues even on errors
- ✅ Summary file created on completion

## Configuration

### Environment Variables

```bash
# Enable/disable AIOps logging
AIOPS_LOGGING_ENABLED=true

# Base directory for logs
AIOPS_LOG_DIR=./aiops

# Retention period (days) - for future cleanup
AIOPS_RETENTION_DAYS=7
```

### Disable Logging

```bash
# In .env file
AIOPS_LOGGING_ENABLED=false
```

## Benefits

1. **Complete Traceability**: Every query fully logged from start to finish
2. **Debugging**: Easy to identify issues by examining log files
3. **Performance Analysis**: Track response times for each component
4. **Quality Assurance**: Review prompts and responses for quality
5. **Compliance**: Maintain audit trail of all AI interactions
6. **Learning**: Analyze patterns in queries and responses
7. **Troubleshooting**: Detailed logs help diagnose production issues

## Privacy & Security

⚠️ **Important Considerations**:
- Logs contain user queries (may contain sensitive information)
- Logs contain LLM prompts and responses
- Logs contain internal knowledge base content

**Recommendations**:
1. Store logs in secure location
2. Implement access controls
3. Encrypt logs if containing sensitive data
4. Set appropriate retention periods
5. Consider PII redaction for production

## Files Created/Modified

### New Files
- `app/utils/aiops_logger.py` - AIOps logging service
- `docs/AIOPS-LOGGING.md` - Comprehensive documentation
- `specs/001-agentic-kb-system/aiops-logging-integration.md` - This file

### Modified Files
- `app/config.py` - Added AIOps configuration settings
- `app/services/rag_orchestrator.py` - Integrated AIOps logging
- `app/services/llm_service.py` - Integrated AIOps logging for prompts/responses
- `app/utils/__init__.py` - Exported AIOpsLogger
- `.gitignore` - Added aiops/ directory

## Example Usage

### Automatic (Default)

No code changes needed - logging happens automatically for all queries.

### Manual (Advanced)

```python
from app.utils.aiops_logger import get_aiops_logger

aiops = get_aiops_logger()

# Start query
query_id = aiops.start_query(
    query="What is AI?",
    session_id="session_123"
)

# Log custom event (if needed)
# ... custom logging ...

# End query
aiops.end_query()
```

## Testing

AIOps logging can be tested by:
1. Making a query through the API
2. Checking `./aiops/` directory for log files
3. Verifying all expected files are created
4. Reviewing log file contents

## Future Enhancements

- [ ] Automatic log cleanup based on retention policy
- [ ] Log compression for old logs
- [ ] Log search and analysis tools
- [ ] Metrics aggregation from logs
- [ ] Real-time log streaming
- [ ] PII detection and redaction
- [ ] Log rotation and archival
- [ ] Dashboard for log visualization

---

**Status**: ✅ **COMPLETE**  
**Default**: Enabled  
**Location**: `./aiops/` (configurable)
