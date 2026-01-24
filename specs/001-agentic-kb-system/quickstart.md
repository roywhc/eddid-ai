# Quickstart Guide: Agentic AI Knowledge Base System

**Date**: 2026-01-24  
**Feature**: Agentic AI Knowledge Base System

## Overview

This guide provides step-by-step instructions to test and validate the Agentic AI Knowledge Base System implementation. The system is located in `stock-analysis-ai/` directory.

## Prerequisites

- Python 3.11+ installed
- Dependencies installed (see `stock-analysis-ai/requirements.txt`)
- Environment variables configured (see `stock-analysis-ai/.env.example`)
- Database initialized

## Setup Steps

### 1. Navigate to Project Directory

```bash
cd stock-analysis-ai
```

### 2. Activate Environment

**Conda (Recommended):**
```bash
conda activate agentic-kb
```

**Troubleshooting Conda Activation:**

If you encounter `CondaError: Run 'conda init' before 'conda activate'`:

1. **Validate your conda setup:**
   ```bash
   bash validate-conda.sh
   ```

2. **Manual activation (if conda activate fails):**
   ```bash
   export CONDA_DEFAULT_ENV=agentic-kb
   export PATH="/c/Users/Wanho/.conda/envs/agentic-kb/Scripts:/c/Users/Wanho/.conda/envs/agentic-kb:$PATH"
   ```

3. **Or use the validation script to activate:**
   ```bash
   source validate-conda.sh
   ```

**Or Virtual Environment:**
```bash
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate     # Windows
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment

```bash
cp .env.example .env
# Edit .env and add your API keys:
# - OPENROUTER_API_KEY (or OPENAI_API_KEY)
# - PERPLEXITY_API_KEY (optional for Phase 1 testing)
```

### 5. Initialize Database

```bash
python -c "from app.db.metadata_store import init_db; init_db()"
```

### 6. Start the Server

```bash
uvicorn app.main:app --reload
```

The server should start on `http://localhost:8000`

## Test Scenarios

### Scenario 1: Health Check Validation

**Purpose**: Verify that the core infrastructure is working correctly

**Steps**:
1. Start the server (see Setup Steps above)
2. Open browser or use curl:
   ```bash
   curl http://localhost:8000/api/v1/health
   ```

**Expected Result**:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-24T10:00:00Z",
  "components": {
    "metadata_db": "healthy",
    "vector_db": "not_initialized"
  },
  "version": "1.0.0"
}
```

**Validation**:
- ✅ Status is "healthy" or "degraded" (degraded is acceptable if vector_db not initialized)
- ✅ Metadata database shows "healthy"
- ✅ Timestamp is current
- ✅ Version matches expected version

### Scenario 2: Configuration Loading

**Purpose**: Verify that configuration loads correctly from environment

**Steps**:
1. Ensure `.env` file exists with required variables
2. Run Python:
   ```bash
   python -c "from app.config import settings; print(f'Environment: {settings.env}'); print(f'API Port: {settings.api_port}')"
   ```

**Expected Result**:
```
Environment: Environment.DEV
API Port: 8000
```

**Validation**:
- ✅ Configuration loads without errors
- ✅ Default values are correct
- ✅ Environment variables are read correctly

### Scenario 3: Database Connection and Schema

**Purpose**: Verify database tables are created correctly

**Steps**:
1. Initialize database (see Setup Step 5)
2. Run test:
   ```bash
   pytest tests/test_db_connection.py -v
   ```

**Expected Result**: All tests pass

**Validation**:
- ✅ Database connection succeeds
- ✅ All tables are created (documents, chunks, kb_candidates, chat_history)
- ✅ Can insert and query test data

### Scenario 4: API Documentation Access

**Purpose**: Verify OpenAPI documentation is accessible

**Steps**:
1. Start the server
2. Open browser: `http://localhost:8000/docs`

**Expected Result**: Swagger UI displays with all API endpoints

**Validation**:
- ✅ Swagger UI loads
- ✅ All endpoints are listed (health, chat, kb management)
- ✅ Can view request/response schemas

### Scenario 5: Chat Endpoint (Stub Validation)

**Purpose**: Verify chat endpoint structure (implementation will be in Phase 3)

**Steps**:
1. Start the server
2. Send POST request:
   ```bash
   curl -X POST http://localhost:8000/api/v1/chat/query \
     -H "Content-Type: application/json" \
     -d '{
       "query": "What is the knowledge base system?",
       "session_id": "test-session-001"
     }'
   ```

**Expected Result**:
```json
{
  "session_id": "test-session-001",
  "query": "What is the knowledge base system?",
  "answer": "Answer from KB or Perplexity (to be implemented in Step 3)",
  "sources": [],
  "confidence_score": 0.8,
  "used_internal_kb": true,
  "used_external_kb": false,
  "processing_time_ms": <number>,
  "timestamp": "2026-01-24T10:00:00Z"
}
```

**Validation**:
- ✅ Endpoint responds (even if stub)
- ✅ Response structure matches ChatResponse model
- ✅ All required fields are present

### Scenario 6: KB Management Endpoints (Stub Validation)

**Purpose**: Verify KB management endpoint structure (implementation will be in Phase 5)

**Steps**:
1. Start the server
2. Send POST request:
   ```bash
   curl -X POST http://localhost:8000/api/v1/kb/documents \
     -H "Content-Type: application/json" \
     -d '{
       "kb_id": "kb_001",
       "title": "Test Document",
       "content": "This is a test document.",
       "doc_type": "test"
     }'
   ```

**Expected Result**: 
- Returns 501 Not Implemented or raises NotImplementedError
- Error message indicates "To be implemented in Step 5"

**Validation**:
- ✅ Endpoint exists and is registered
- ✅ Returns appropriate "not implemented" response
- ✅ Error message is clear

### Scenario 7: Logging System

**Purpose**: Verify structured logging is working

**Steps**:
1. Start the server
2. Make a few API requests (health check, chat query)
3. Check log output in console or log file

**Expected Result**:
- Console shows log messages
- Log format is structured (JSON in production, standard in dev)
- Logs include timestamps, log levels, and messages

**Validation**:
- ✅ Logs are generated for API requests
- ✅ Log format matches configuration
- ✅ Log files are created (if file logging enabled)

### Scenario 8: Error Handling

**Purpose**: Verify error handling and validation

**Steps**:
1. Start the server
2. Send invalid request:
   ```bash
   curl -X POST http://localhost:8000/api/v1/chat/query \
     -H "Content-Type: application/json" \
     -d '{"query": ""}'
   ```

**Expected Result**: Returns 422 Unprocessable Entity with validation error

**Validation**:
- ✅ Invalid input is rejected
- ✅ Error message is clear and helpful
- ✅ Response follows error schema

## Phase 1 Testing Checklist

Use this checklist to validate Phase 1 implementation:

- [ ] Health check endpoint responds correctly
- [ ] Configuration loads from environment variables
- [ ] Database initializes and creates all tables
- [ ] Database connection tests pass
- [ ] API documentation is accessible at `/docs`
- [ ] Chat endpoint exists and responds (stub is acceptable)
- [ ] KB management endpoints exist (stubs are acceptable)
- [ ] Logging system works (console and file if configured)
- [ ] Error handling returns appropriate status codes
- [ ] CORS middleware allows requests from configured origins
- [ ] Global exception handler catches unhandled errors

## Next Steps After Phase 1 Validation

Once Phase 1 is validated:

1. **Phase 2**: Implement vector store setup (ChromaDB/pgvector)
2. **Phase 3**: Implement RAG logic and complete chat endpoint
3. **Phase 4**: Implement Perplexity integration
4. **Phase 5**: Implement KB update pipeline
5. **Phase 6**: Add observability and monitoring
7. **Phase 7**: Containerization and deployment

## Troubleshooting

### Database Connection Issues
- Check that SQLite file path is writable
- Verify `metadata_db_url` in `.env` is correct
- Ensure database directory exists

### API Not Starting
- Check that port 8000 is not in use
- Verify all dependencies are installed
- Check logs for initialization errors

### Configuration Not Loading
- Verify `.env` file exists in project root
- Check that environment variable names match Settings class
- Ensure no syntax errors in `.env` file

## Additional Resources

- Implementation Guide: `stock-analysis-ai/docs/agentic-kb-implementation-guide.md`
- API Documentation: `http://localhost:8000/docs` (when server is running)
- Step 1 Completion Notes: `stock-analysis-ai/docs/STEP1-COMPLETION.md`
