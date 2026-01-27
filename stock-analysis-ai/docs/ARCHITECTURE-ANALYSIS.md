# Architecture Analysis: Chat Interface, Knowledge Base, and Perplexity Agent

## Executive Summary

This document provides a comprehensive analysis of the relationships between three core components in the stock-analysis-ai system:
1. **Chat Interface** (Frontend)
2. **Knowledge Base** (Internal KB - ChromaDB)
3. **Perplexity Agent** (External Knowledge Service)

The system implements a **hybrid RAG (Retrieval-Augmented Generation) architecture** that intelligently combines internal knowledge base retrieval with external knowledge from Perplexity API.

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Chat Interface (Vue.js Frontend)                        │  │
│  │  - ChatView.vue                                          │  │
│  │  - chat.store.ts (Pinia Store)                           │  │
│  │  - chat.service.ts (API Client)                           │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                              │
                              │ HTTP/REST API
                              │
┌─────────────────────────────▼────────────────────────────────────┐
│                    BACKEND API LAYER                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Chat API (/api/chat/query)                               │  │
│  │  - chat.py                                                │  │
│  │  - Handles: /query, /query/stream                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────┬────────────────────────────────────┘
                              │
                              │ Orchestrates
                              │
┌─────────────────────────────▼────────────────────────────────────┐
│              RAG ORCHESTRATOR (Core Coordinator)                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  RAGOrchestrator (rag_orchestrator.py)                   │  │
│  │  - Manages entire query pipeline                         │  │
│  │  - Coordinates all services                             │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────┬──────────────┬──────────────┬──────────────┬─────────────┘
      │              │              │              │
      │              │              │              │
┌─────▼─────┐  ┌─────▼─────┐  ┌─────▼─────┐  ┌─────▼─────┐
│ Internal  │  │ Confidence│  │ Perplexity│  │   LLM     │
│ Knowledge │  │  Service  │  │  Service  │  │  Service  │
│   Base    │  │           │  │           │  │           │
│           │  │           │  │           │  │           │
│ ChromaDB  │  │ Calculates│  │ External  │  │ OpenRouter│
│ Vector    │  │ confidence│  │ Knowledge │  │ DeepSeek  │
│ Store     │  │   score   │  │   API     │  │   API     │
└───────────┘  └───────────┘  └───────────┘  └───────────┘
```

---

## Component Relationships

### 1. Chat Interface → Backend API

**Location**: `kb-ui/src/stores/chat.store.ts`, `kb-ui/src/services/chat.service.ts`

**Relationship Type**: Client-Server Communication

**Key Interactions**:
- **Request Format**: `ChatRequest` with:
  - `query`: User's question
  - `session_id`: Optional session identifier
  - `use_external_kb`: Boolean flag (default: `true`)
  - `include_sources`: Boolean flag for citations
  - `conversation_history`: Previous messages for context

- **Response Format**: `ChatResponse` with:
  - `answer`: Generated response
  - `sources`: List of citations (internal + external)
  - `confidence_score`: Confidence in internal KB results
  - `used_internal_kb`: Whether internal KB was used
  - `used_external_kb`: Whether Perplexity was queried
  - `processing_time_ms`: Performance metrics

**Communication Modes**:
1. **Standard Request/Response**: `POST /api/chat/query`
2. **Streaming**: `POST /api/chat/query/stream` (Server-Sent Events)

**Key Features**:
- Maintains conversation history in frontend store
- Handles session management
- Real-time streaming updates for better UX
- Error handling and retry logic

---

### 2. Chat API → RAG Orchestrator

**Location**: `app/api/chat.py` → `app/services/rag_orchestrator.py`

**Relationship Type**: Orchestration Pattern

**Key Responsibilities**:
The RAG Orchestrator is the **central coordinator** that manages the entire query processing pipeline:

1. **Session Management**
   - Creates or retrieves conversation sessions
   - Maintains conversation history

2. **Internal KB Retrieval**
   - Calls `RetrievalService` to search ChromaDB
   - Retrieves top-k relevant chunks (default: 5)

3. **Confidence Calculation**
   - Uses `ConfidenceService` to evaluate retrieval quality
   - Determines if external knowledge is needed

4. **External KB Decision**
   - Conditionally queries Perplexity based on:
     - `use_external_kb` flag from request
     - Confidence score vs. threshold
     - Whether internal KB returned results

5. **Answer Generation**
   - Combines internal and external context
   - Calls `LLMService` to generate final answer

6. **Citation Management**
   - Extracts citations from both sources
   - Combines internal and external citations

7. **KB Candidate Generation**
   - If external KB was used, creates candidate entries
   - Enables knowledge base self-improvement

---

### 3. RAG Orchestrator → Internal Knowledge Base

**Location**: `app/services/retrieval.py` → `app/db/vector_store.py`

**Relationship Type**: Retrieval Service

**Technology Stack**:
- **Vector Database**: ChromaDB
- **Embeddings**: HuggingFace (sentence-transformers)
- **Search Method**: Semantic similarity search

**Key Interactions**:

```python
# Retrieval Flow
RAGOrchestrator → RetrievalService.retrieve(query, kb_id, top_k=5)
                → VectorStore.search(query, top_k, kb_id)
                → ChromaDB similarity_search()
                → Returns: List[RetrievalResult]
```

**RetrievalResult Structure**:
- `chunk_id`: Unique chunk identifier
- `content`: Text content of the chunk
- `metadata`: Document metadata (doc_id, section_title, etc.)
- `score`: Relevance score (0.0 - 1.0)

**Key Features**:
- Filters by `kb_id` (currently "default_kb")
- Returns top-k most relevant chunks
- Gracefully handles empty results (allows fallback to external KB)
- Auto-initializes vector store if not available

**Confidence Calculation**:
After retrieval, the system calculates a confidence score based on:
- Number of results retrieved
- Relevance scores of top results
- Query-result similarity

---

### 4. RAG Orchestrator → Perplexity Agent

**Location**: `app/services/external_knowledge.py`

**Relationship Type**: External API Integration

**Decision Logic**:

The system queries Perplexity when **ALL** of the following conditions are met:

1. `request.use_external_kb == True` (user/client allows external KB)
2. **AND** one of:
   - `confidence_score < KB_CONFIDENCE_THRESHOLD` (default: 0.7)
   - `len(retrieval_results) == 0` (no internal results)

**Key Interactions**:

```python
# Perplexity Query Flow
RAGOrchestrator → PerplexityService.search(query, additional_context)
                → StockAnalysisDetector.is_stock_analysis_query()
                → PromptTemplates.format_stock_template() [if stock query]
                → Perplexity API (AsyncOpenAI client)
                → Returns: ExternalKnowledgeResult
```

**ExternalKnowledgeResult Structure**:
- `answer`: Generated answer from Perplexity
- `citations`: List of external citations (URLs, sources)
- `raw_response`: Full API response
- `query_time_ms`: Performance metrics

**Special Features**:

1. **Stock Analysis Detection**:
   - Automatically detects stock-related queries
   - Uses specialized prompt template for stock analysis
   - Extracts ticker, date, and user enquiry

2. **Context Enhancement**:
   - Passes internal KB context to Perplexity
   - Helps Perplexity provide more relevant answers
   - Format: "Additional context from internal knowledge base: ..."

3. **Error Handling**:
   - Gracefully falls back to internal KB if Perplexity fails
   - Logs errors but doesn't break the request
   - Continues with internal KB only

---

### 5. RAG Orchestrator → LLM Service

**Location**: `app/services/llm_service.py`

**Relationship Type**: Answer Generation

**Key Interactions**:

```python
# LLM Generation Flow
RAGOrchestrator → LLMService.generate_answer(
                    query,
                    context=retrieval_results,      # Internal KB
                    conversation_history,          # Session history
                    external_context=external_result # Perplexity result
                  )
                → Builds system prompt with RAG context
                → Detects stock analysis queries
                → Calls OpenRouter/DeepSeek API
                → Returns: Generated answer string
```

**Context Combination**:

The LLM receives:
1. **Internal KB Context**: Retrieved chunks from ChromaDB
2. **External KB Context**: Answer and citations from Perplexity
3. **Conversation History**: Previous messages in the session
4. **System Prompt**: Instructions for how to use the context

**Stock Analysis Special Handling**:
- Detects stock analysis queries
- Uses specialized prompt template
- Formats with ticker, current date, and user enquiry
- Appends RAG context to the template

---

### 6. Knowledge Base Self-Improvement (KB Curator)

**Location**: `app/services/kb_curator.py`

**Relationship Type**: Feedback Loop

**Key Interactions**:

When external KB (Perplexity) is used:
```python
RAGOrchestrator → KBCuratorService.generate_and_save_candidate(
                    query,
                    answer,
                    citations,
                    kb_id
                  )
                → Filters external citations
                → Creates KBCandidate object
                → Saves to database (kb_candidates table)
                → Returns: candidate_id
```

**Purpose**:
- Captures valuable external knowledge
- Creates candidate entries for review
- Enables knowledge base expansion
- Tracks which queries needed external help

**Candidate Structure**:
- `original_query`: User's question
- `answer`: Generated answer
- `external_urls`: Source URLs from Perplexity
- `suggested_kb_id`: Where to add this knowledge
- `status`: "pending" (awaiting review)

---

## Data Flow Diagram

### Complete Query Processing Flow

```
1. USER INPUT
   └─> Chat Interface (Vue.js)
       └─> POST /api/chat/query
           └─> ChatRequest {
                 query: "What is the current price of AAPL?",
                 session_id: "abc123",
                 use_external_kb: true,
                 conversation_history: [...]
               }

2. SESSION MANAGEMENT
   └─> RAGOrchestrator
       └─> SessionManager.get_history(session_id)
           └─> Returns: conversation_history

3. INTERNAL KB RETRIEVAL
   └─> RAGOrchestrator
       └─> RetrievalService.retrieve(query, "default_kb", top_k=5)
           └─> VectorStore.search()
               └─> ChromaDB similarity_search()
                   └─> Returns: [
                         RetrievalResult(chunk_id="...", content="...", score=0.85),
                         RetrievalResult(chunk_id="...", content="...", score=0.72),
                         ...
                       ]

4. CONFIDENCE CALCULATION
   └─> RAGOrchestrator
       └─> ConfidenceService.calculate_confidence(results, query)
           └─> Returns: confidence_score = 0.65

5. EXTERNAL KB DECISION
   └─> RAGOrchestrator
       └─> Decision: confidence_score (0.65) < threshold (0.7) → Query Perplexity
           └─> PerplexityService.search(query, additional_context)
               └─> StockAnalysisDetector.is_stock_analysis_query() → true
                   └─> PromptTemplates.format_stock_template(ticker="AAPL", ...)
                       └─> Perplexity API call
                           └─> Returns: ExternalKnowledgeResult {
                                 answer: "As of January 27, 2026, AAPL is trading at...",
                                 citations: [
                                   Citation(url="https://...", source="external"),
                                   ...
                                 ]
                               }

6. ANSWER GENERATION
   └─> RAGOrchestrator
       └─> LLMService.generate_answer(
             query,
             context=retrieval_results,      # Internal KB chunks
             conversation_history,            # Session history
             external_context=external_result # Perplexity result
           )
           └─> Builds system prompt with:
               - Internal KB context
               - External KB context
               - Stock analysis template (if applicable)
           └─> OpenRouter/DeepSeek API call
               └─> Returns: "Based on the internal knowledge base and current market data..."

7. CITATION EXTRACTION
   └─> RAGOrchestrator
       └─> _extract_citations(retrieval_results) → internal citations
       └─> external_result.citations → external citations
       └─> Combines: citations = [internal_citations..., external_citations...]

8. KB CANDIDATE GENERATION
   └─> RAGOrchestrator
       └─> KBCuratorService.generate_and_save_candidate(...)
           └─> Creates KBCandidate
           └─> Saves to database
           └─> Returns: candidate_id

9. RESPONSE BUILDING
   └─> RAGOrchestrator
       └─> ChatResponse {
             session_id: "abc123",
             query: "What is the current price of AAPL?",
             answer: "Based on the internal knowledge base...",
             sources: [internal_citations..., external_citations...],
             confidence_score: 0.65,
             used_internal_kb: true,
             used_external_kb: true,
             processing_time_ms: 1250
           }

10. RESPONSE TO USER
    └─> Chat API
        └─> Returns: ChatResponse (JSON)
            └─> Chat Interface
                └─> Updates UI with answer, citations, confidence score
```

---

## Key Design Patterns

### 1. **Hybrid RAG Architecture**
- **Internal KB First**: Always queries internal KB first
- **Confidence-Based Fallback**: Uses external KB when confidence is low
- **Context Combination**: Merges internal and external context for LLM

### 2. **Orchestration Pattern**
- **Single Coordinator**: RAGOrchestrator manages all services
- **Service Separation**: Each service has a single responsibility
- **Error Isolation**: Failures in one service don't break the pipeline

### 3. **Adaptive Knowledge Retrieval**
- **Confidence Threshold**: Configurable threshold (default: 0.7)
- **User Control**: `use_external_kb` flag allows user preference
- **Graceful Degradation**: Falls back to internal KB if external fails

### 4. **Self-Improving Knowledge Base**
- **Candidate Generation**: Captures external knowledge for review
- **Feedback Loop**: External queries become potential KB entries
- **Review Process**: Candidates await manual approval

### 5. **Specialized Query Handling**
- **Stock Analysis Detection**: Automatic detection of stock queries
- **Template System**: Specialized prompts for different query types
- **Context-Aware**: Adapts behavior based on query type

---

## Configuration & Settings

### Key Configuration Variables

**Location**: `app/config.py`

```python
# Knowledge Base Settings
KB_CONFIDENCE_THRESHOLD = 0.7  # Threshold for external KB query
RELEVANCE_SCORE_THRESHOLD = 0.5  # Minimum relevance for retrieval

# Perplexity Settings
PERPLEXITY_API_KEY = "..."
PERPLEXITY_MODEL = "sonar-pro"
PERPLEXITY_TIMEOUT = 30.0

# LLM Settings
LLM_MODEL = "deepseek/deepseek-v3.2"
LLM_TEMPERATURE = 0.7

# KB Update Settings
KB_UPDATE_ENABLED = True
KB_UPDATE_REVIEW_REQUIRED = True
```

---

## Performance Characteristics

### Query Processing Time Breakdown

1. **Internal KB Retrieval**: ~50-200ms
   - Embedding generation: ~20-50ms
   - Vector search: ~30-150ms

2. **Confidence Calculation**: ~1-5ms
   - Fast computation on retrieval results

3. **Perplexity Query** (if triggered): ~500-2000ms
   - API call overhead
   - Network latency
   - Response processing

4. **LLM Generation**: ~500-3000ms
   - Depends on answer length
   - Model response time

5. **Total Processing Time**: ~1000-5000ms
   - Typical: 1-2 seconds
   - With Perplexity: 2-5 seconds

### Optimization Strategies

1. **Caching**: Session history cached in memory
2. **Parallel Processing**: Could parallelize internal KB + Perplexity (future)
3. **Streaming**: Real-time answer streaming for better UX
4. **Connection Pooling**: Reused API connections

---

## Error Handling & Resilience

### Error Handling Strategy

1. **Internal KB Failure**:
   - Returns empty results
   - Triggers external KB query
   - System continues normally

2. **Perplexity API Failure**:
   - Logs warning
   - Continues with internal KB only
   - User still gets an answer

3. **LLM API Failure**:
   - Propagates error to API
   - Returns HTTP 500
   - User sees error message

4. **Vector Store Unavailable**:
   - Auto-initialization attempt
   - Falls back to external KB
   - System remains functional

---

## Future Enhancements

### Potential Improvements

1. **Parallel Querying**:
   - Query internal KB and Perplexity in parallel
   - Reduce total latency

2. **Smart Caching**:
   - Cache Perplexity responses
   - Reduce external API calls

3. **Multi-KB Support**:
   - Support multiple knowledge bases
   - KB selection based on query type

4. **Advanced Confidence Scoring**:
   - ML-based confidence models
   - Better external KB decision making

5. **Real-time KB Updates**:
   - Auto-approve high-confidence candidates
   - Continuous KB improvement

---

## Conclusion

The stock-analysis-ai system implements a sophisticated **hybrid RAG architecture** that:

1. **Prioritizes Internal Knowledge**: Uses internal KB as primary source
2. **Intelligently Augments**: Queries Perplexity when confidence is low
3. **Combines Contexts**: Merges internal and external knowledge for comprehensive answers
4. **Self-Improves**: Captures external knowledge for future use
5. **Handles Special Cases**: Specialized handling for stock analysis queries

The relationship between components is **hierarchical and orchestrated**, with the RAG Orchestrator serving as the central coordinator that manages the entire pipeline from user query to final answer.

---

## Related Documentation

- [Sequence Diagram](./SEQUENCE_DIAGRAM.md) - Detailed interaction flows
- [Session ID Usage](./SESSION_ID_USAGE.md) - Session management details
- [Agentic KB Implementation Guide](./agentic-kb-implementation-guide.md) - Implementation details
- [AIOPS Logging](./AIOPS-LOGGING.md) - Logging and observability
