# AIOps Logging Guide

## Overview

The AIOps (AI Operations) logging system provides structured, detailed logging of all AI interactions in the system. Each query creates a timestamped folder with sequential log files documenting the entire request lifecycle.

## Folder Structure

```
aiops/
├── 2026-01-25/
│   ├── 10-30-45-a1b2c3d4e5f6/
│   │   ├── 00-summary.json
│   │   ├── 01-user-query.json
│   │   ├── 02-kb-search.json
│   │   ├── 03-perplexity-query.json (if external KB used)
│   │   ├── 04-llm-prompt.json
│   │   ├── 05-llm-response.json
│   │   ├── 06-final-response.json
│   │   └── 99-error.json (if error occurred)
│   ├── 10-31-12-b2c3d4e5f6g7/
│   │   └── ...
│   └── ...
└── 2026-01-26/
    └── ...
```

## Log File Sequence

### 00-summary.json
**Created**: At the end of query processing  
**Contents**:
- Query ID
- Completion timestamp
- Total number of sequences logged

### 01-user-query.json
**Created**: When query starts  
**Contents**:
- Sequence number
- Timestamp
- User query text
- Session ID
- Request metadata (use_external_kb, include_sources, etc.)

### 02-kb-search.json
**Created**: After KB retrieval and confidence calculation  
**Contents**:
- Sequence number
- Timestamp
- Query text
- KB ID searched
- Result count
- Confidence score
- Top 10 retrieval results (chunk_id, score, content preview, document info)
- Metadata

### 03-perplexity-query.json
**Created**: Only if external KB (Perplexity) is queried  
**Contents**:
- Sequence number
- Timestamp
- Query text
- Additional context from internal KB
- Query time (milliseconds)
- Response preview (first 500 chars)
- Citation count
- Top 10 citations
- Metadata

### 04-llm-prompt.json
**Created**: Before sending prompt to LLM  
**Contents**:
- Sequence number
- Timestamp
- Model name
- Temperature setting
- Stock analysis detection flag
- System prompt preview (first 1000 chars)
- System prompt length
- Message count
- Messages with role and content preview (first 500 chars per message)
- Metadata

### 05-llm-response.json
**Created**: After receiving LLM response  
**Contents**:
- Sequence number
- Timestamp
- Model name
- Response preview (first 500 chars)
- Response length
- Response time (milliseconds)
- Token usage (if available)
- Metadata

### 06-final-response.json
**Created**: At the end of successful processing  
**Contents**:
- Sequence number
- Timestamp
- Query text
- Answer preview (first 500 chars)
- Answer length
- Session ID
- Confidence score
- Used internal KB flag
- Used external KB flag
- Citation count
- Top 20 citations
- Processing time (milliseconds)
- Candidate ID (if generated)
- Metadata

### 99-error.json
**Created**: If an error occurs during processing  
**Contents**:
- Sequence number
- Timestamp
- Error type
- Error message
- Metadata

## Configuration

### Environment Variables

Add to `.env` file:

```bash
# Enable/disable AIOps logging
AIOPS_LOGGING_ENABLED=true

# Base directory for AIOps logs
AIOPS_LOG_DIR=./aiops

# Retention period (days)
AIOPS_RETENTION_DAYS=7
```

### Settings

In `app/config.py`:
- `aiops_logging_enabled: bool = True` - Enable/disable logging
- `aiops_log_dir: str = "./aiops"` - Base directory for logs
- `aiops_retention_days: int = 7` - Days to keep logs (future cleanup feature)

## Usage

### Automatic Logging

AIOps logging is **automatic** for all chat queries. No code changes needed in your application.

### Manual Logging (Advanced)

If you need to log custom events:

```python
from app.utils.aiops_logger import get_aiops_logger

aiops = get_aiops_logger()

# Start a query
query_id = aiops.start_query(
    query="What is AI?",
    session_id="session_123",
    custom_metadata={"user_id": "user_456"}
)

# Log custom event
aiops.log_custom_event(
    event_type="custom_action",
    data={"key": "value"}
)

# End query
aiops.end_query()
```

## Log File Format

All log files are JSON format with:
- **Indented** (2 spaces) for readability
- **UTF-8** encoding
- **ISO 8601** timestamps
- **Preview fields** for large content (first N characters)
- **Full length** fields for size information

## Example Log Files

### 01-user-query.json
```json
{
  "sequence": 1,
  "timestamp": "2026-01-25T10:30:45.123456",
  "query": "What is the stock price of AAPL?",
  "session_id": "session_a1b2c3d4e5f6",
  "metadata": {
    "use_external_kb": true,
    "include_sources": false
  }
}
```

### 02-kb-search.json
```json
{
  "sequence": 2,
  "timestamp": "2026-01-25T10:30:45.234567",
  "query": "What is the stock price of AAPL?",
  "kb_id": "default_kb",
  "result_count": 3,
  "confidence_score": 0.45,
  "results": [
    {
      "chunk_id": "chunk_001",
      "score": 0.78,
      "content_preview": "Apple Inc. (AAPL) is a technology company...",
      "document_id": "doc_apple",
      "document_title": "Apple Company Overview"
    }
  ],
  "metadata": {}
}
```

### 04-llm-prompt.json
```json
{
  "sequence": 4,
  "timestamp": "2026-01-25T10:30:46.123456",
  "model": "deepseek/deepseek-v3.2",
  "temperature": 0.7,
  "is_stock_analysis": true,
  "system_prompt_preview": "You are a professional equity research analyst...",
  "system_prompt_length": 5234,
  "message_count": 3,
  "messages": [
    {
      "role": "system",
      "content_preview": "You are a professional equity research analyst...",
      "content_length": 5234
    },
    {
      "role": "user",
      "content_preview": "What is the stock price of AAPL?",
      "content_length": 35
    }
  ],
  "metadata": {}
}
```

## Benefits

1. **Complete Traceability**: Every query is fully logged from start to finish
2. **Debugging**: Easy to identify issues by examining log files
3. **Performance Analysis**: Track response times for each component
4. **Quality Assurance**: Review prompts and responses for quality
5. **Compliance**: Maintain audit trail of all AI interactions
6. **Learning**: Analyze patterns in queries and responses

## Log Retention

Logs are organized by date for easy cleanup:
- Daily folders: `YYYY-MM-DD/`
- Query folders: `HH-MM-SS-{query_id}/`

**Future Enhancement**: Automatic cleanup based on `AIOPS_RETENTION_DAYS` setting.

## Privacy & Security

⚠️ **Important**: Log files contain:
- User queries (may contain sensitive information)
- LLM prompts and responses
- Internal knowledge base content

**Recommendations**:
1. Store logs in secure location
2. Implement access controls
3. Encrypt logs if containing sensitive data
4. Set appropriate retention periods
5. Consider PII redaction for production

## Disabling AIOps Logging

To disable AIOps logging:

```bash
# In .env file
AIOPS_LOGGING_ENABLED=false
```

Or set in code:
```python
from app.config import settings
settings.aiops_logging_enabled = False
```

## Troubleshooting

### Logs Not Created

1. Check `AIOPS_LOGGING_ENABLED` setting
2. Verify write permissions on `AIOPS_LOG_DIR`
3. Check application logs for errors

### Large Log Files

- Logs use previews for large content (first 500-1000 chars)
- Full content lengths are logged for reference
- Consider adjusting preview sizes if needed

### Missing Log Files

- Some files are conditional (e.g., `03-perplexity-query.json` only if external KB used)
- Error file (`99-error.json`) only created on errors
- Check sequence numbers to identify missing steps

## Integration Points

AIOps logging is integrated into:
- ✅ `RAGOrchestrator.process_query()` - Main query flow
- ✅ `LLMService.generate_answer()` - LLM interactions
- ✅ `PerplexityService.search()` - External knowledge queries
- ✅ `RetrievalService.retrieve()` - KB searches (via orchestrator)

## Future Enhancements

- [ ] Automatic log cleanup based on retention policy
- [ ] Log compression for old logs
- [ ] Log search and analysis tools
- [ ] Metrics aggregation from logs
- [ ] Real-time log streaming
- [ ] PII detection and redaction

---

**Status**: ✅ **ACTIVE**  
**Default**: Enabled  
**Location**: `./aiops/` (configurable)
