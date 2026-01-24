# RAG System Sequence Diagram

This document illustrates the interaction flow between the Chat API, Knowledge Base (KB), and Perplexity services in the Agentic AI Knowledge Base System.

## Main Query Flow

```mermaid
sequenceDiagram
    participant User
    participant ChatAPI as Chat API<br/>(/api/chat/query)
    participant RAG as RAG Orchestrator
    participant SessionMgr as Session Manager
    participant Retrieval as Retrieval Service
    participant KB as Knowledge Base<br/>(ChromaDB)
    participant Confidence as Confidence Service
    participant Perplexity as Perplexity Service
    participant LLM as LLM Service<br/>(OpenRouter/DeepSeek)
    participant Curator as KB Curator

    User->>ChatAPI: POST /query<br/>{query, session_id?}
    
    ChatAPI->>RAG: process_query(request)
    
    Note over RAG,SessionMgr: Session Management
    alt session_id provided
        RAG->>SessionMgr: get_history(session_id)
        SessionMgr-->>RAG: conversation_history
    else no session_id
        RAG->>SessionMgr: create_session()
        SessionMgr-->>RAG: new_session_id
    end
    
    Note over RAG,KB: Internal KB Retrieval
    RAG->>Retrieval: retrieve(query, kb_id, top_k=5)
    Retrieval->>KB: similarity_search(query)
    KB-->>Retrieval: retrieval_results[]
    Retrieval-->>RAG: retrieval_results[]
    
    Note over RAG,Confidence: Confidence Calculation
    RAG->>Confidence: calculate_confidence(results, query)
    Confidence-->>RAG: confidence_score
    
    Note over RAG,Perplexity: External KB Decision
    alt confidence < threshold OR use_external_kb=true
        RAG->>Perplexity: search(query, additional_context?)
        Note over Perplexity: Detect stock analysis query<br/>Use stock template if applicable
        Perplexity->>Perplexity: StockAnalysisDetector.is_stock_analysis_query()
        alt stock analysis detected
            Perplexity->>Perplexity: PromptTemplates.format_stock_template()
        end
        Perplexity->>Perplexity: Call Perplexity API
        Perplexity-->>RAG: ExternalKnowledgeResult
    end
    
    Note over RAG,LLM: Answer Generation
    RAG->>LLM: generate_answer(query, context, history, external_context)
    LLM->>LLM: _build_rag_system_prompt(context, external_context, query)
    alt stock analysis query detected
        LLM->>LLM: Use stock analysis template
    else regular query
        LLM->>LLM: Use default RAG prompt
    end
    LLM->>LLM: Call OpenRouter/DeepSeek API
    LLM-->>RAG: answer (string)
    
    Note over RAG,SessionMgr: Store Messages
    RAG->>SessionMgr: add_message(session_id, user_message)
    RAG->>SessionMgr: add_message(session_id, assistant_message)
    
    Note over RAG,Curator: KB Candidate Generation
    alt external KB was used
        RAG->>Curator: generate_and_save_candidate(query, answer, citations)
        Curator->>Curator: Filter external citations
        Curator->>Curator: Generate KBCandidate
        Curator->>Curator: Save to database (kb_candidates table)
        Curator-->>RAG: candidate_id
    end
    
    Note over RAG,ChatAPI: Response Building
    RAG->>RAG: _extract_citations(retrieval_results)
    RAG->>RAG: Combine internal + external citations
    RAG->>RAG: Build ChatResponse
    RAG-->>ChatAPI: ChatResponse
    ChatAPI-->>User: JSON Response<br/>{session_id, answer, sources, confidence_score, ...}
```

## Detailed Component Interactions

### 1. Session Management Flow

```mermaid
sequenceDiagram
    participant RAG as RAG Orchestrator
    participant SessionMgr as Session Manager
    participant Storage as In-Memory Storage

    RAG->>SessionMgr: get_history(session_id)
    alt session exists
        SessionMgr->>Storage: sessions[session_id]
        Storage-->>SessionMgr: List[ChatMessage]
        SessionMgr-->>RAG: conversation_history
    else session not found
        SessionMgr->>Storage: sessions[session_id] = []
        SessionMgr-->>RAG: [] (empty history)
    end
    
    Note over RAG,Storage: After query processing
    RAG->>SessionMgr: add_message(session_id, user_message)
    SessionMgr->>Storage: sessions[session_id].append(user_message)
    
    RAG->>SessionMgr: add_message(session_id, assistant_message)
    SessionMgr->>Storage: sessions[session_id].append(assistant_message)
```

### 2. Knowledge Base Retrieval Flow

```mermaid
sequenceDiagram
    participant RAG as RAG Orchestrator
    participant Retrieval as Retrieval Service
    participant VectorStore as Vector Store Interface
    participant ChromaDB as ChromaDB

    RAG->>Retrieval: retrieve(query, kb_id="default_kb", top_k=5)
    Retrieval->>VectorStore: get_vector_store(kb_id)
    VectorStore->>ChromaDB: similarity_search(query, n_results=5)
    ChromaDB-->>VectorStore: results with metadata
    VectorStore->>VectorStore: Convert to RetrievalResult[]
    VectorStore-->>Retrieval: List[RetrievalResult]
    Retrieval-->>RAG: retrieval_results[]
```

### 3. External Knowledge (Perplexity) Flow

```mermaid
sequenceDiagram
    participant RAG as RAG Orchestrator
    participant Perplexity as Perplexity Service
    participant Detector as Stock Analysis Detector
    participant Templates as Prompt Templates
    participant PerplexityAPI as Perplexity API

    RAG->>Perplexity: search(query, additional_context?)
    
    Perplexity->>Detector: is_stock_analysis_query(query)
    Detector-->>Perplexity: true/false
    
    Perplexity->>Detector: has_explicit_requirements(query)
    Detector-->>Perplexity: true/false
    
    alt stock analysis AND no explicit requirements
        Perplexity->>Detector: get_analysis_info(query)
        Detector-->>Perplexity: {ticker, current_date, user_enquiry}
        Perplexity->>Templates: format_stock_template(ticker, date, enquiry)
        Templates-->>Perplexity: formatted_template
        Perplexity->>Perplexity: system_prompt = formatted_template
    else regular query
        Perplexity->>Perplexity: system_prompt = default_prompt
    end
    
    Perplexity->>Perplexity: Build user_message<br/>(with additional_context if provided)
    Perplexity->>PerplexityAPI: POST /chat/completions<br/>{model, messages, temperature}
    PerplexityAPI-->>Perplexity: response with answer & citations
    Perplexity->>Perplexity: _extract_citations(response)
    Perplexity->>Perplexity: Convert to ExternalKnowledgeResult
    Perplexity-->>RAG: ExternalKnowledgeResult
```

### 4. LLM Answer Generation Flow

```mermaid
sequenceDiagram
    participant RAG as RAG Orchestrator
    participant LLM as LLM Service
    participant Detector as Stock Analysis Detector
    participant Templates as Prompt Templates
    participant OpenRouter as OpenRouter API<br/>(DeepSeek)

    RAG->>LLM: generate_answer(query, context, history, external_context)
    
    LLM->>LLM: _build_rag_system_prompt(context, external_context, query)
    
    LLM->>Detector: is_stock_analysis_query(query)
    Detector-->>LLM: true/false
    
    LLM->>Detector: has_explicit_requirements(query)
    Detector-->>LLM: true/false
    
    alt stock analysis AND no explicit requirements
        LLM->>Detector: get_analysis_info(query)
        Detector-->>LLM: {ticker, current_date, user_enquiry}
        LLM->>Templates: format_stock_template(ticker, date, enquiry)
        Templates-->>LLM: formatted_template
        LLM->>LLM: base_prompt = formatted_template
        LLM->>LLM: Append RAG context to template
    else regular query
        LLM->>LLM: Build default RAG prompt<br/>(with context sections)
    end
    
    LLM->>LLM: Build messages array:<br/>[system_prompt, history, current_query]
    LLM->>OpenRouter: POST /chat/completions<br/>{model: "deepseek/deepseek-v3.2", messages}
    OpenRouter-->>LLM: response with answer
    LLM->>LLM: Extract answer text
    LLM-->>RAG: answer (string)
```

### 5. KB Candidate Generation Flow

```mermaid
sequenceDiagram
    participant RAG as RAG Orchestrator
    participant Curator as KB Curator Service
    participant DB as PostgreSQL<br/>(kb_candidates table)

    alt external KB was used
        RAG->>Curator: generate_and_save_candidate(query, answer, citations, kb_id)
        
        Curator->>Curator: Filter external citations<br/>(source == "external")
        
        alt external citations found
            Curator->>Curator: generate_candidate()<br/>Create KBCandidate object
            Curator->>Curator: Extract external URLs
            Curator->>Curator: Generate title from query
            
            Curator->>Curator: save_candidate(candidate)
            Curator->>DB: Check for existing candidate<br/>(same query, status="pending")
            
            alt candidate exists
                DB-->>Curator: existing_candidate
                Curator->>DB: UPDATE hit_count += 1
                DB-->>Curator: existing_candidate_id
            else new candidate
                Curator->>DB: INSERT new candidate
                DB-->>Curator: new_candidate_id
            end
            
            Curator-->>RAG: candidate_id
        else no external citations
            Curator-->>RAG: None (skip)
        end
    end
```

## Key Decision Points

### Decision 1: External KB Query

```mermaid
flowchart TD
    A[Query Received] --> B{use_external_kb?}
    B -->|false| C[Skip External KB]
    B -->|true| D{confidence < threshold?}
    D -->|yes| E[Query Perplexity]
    D -->|no| F{retrieval_results empty?}
    F -->|yes| E
    F -->|no| C
    E --> G[External KB Result]
    C --> H[Continue with Internal KB Only]
    G --> H
```

### Decision 2: Stock Analysis Template

```mermaid
flowchart TD
    A[Query Received] --> B{Stock Analysis Query?}
    B -->|no| C[Use Default RAG Prompt]
    B -->|yes| D{Explicit Requirements?}
    D -->|yes| C
    D -->|no| E[Use Stock Analysis Template]
    E --> F[Format with TICKER, DATE, ENQUIRY]
    F --> G[Append RAG Context]
    C --> H[Generate Answer]
    G --> H
```

## Error Handling Flow

```mermaid
sequenceDiagram
    participant RAG as RAG Orchestrator
    participant Perplexity as Perplexity Service
    participant LLM as LLM Service

    RAG->>Perplexity: search(query)
    alt Perplexity API Error
        Perplexity-->>RAG: Exception
        Note over RAG: Log warning<br/>Continue with internal KB only
        RAG->>RAG: used_external_kb = False
    end
    
    RAG->>LLM: generate_answer(...)
    alt LLM API Error
        LLM-->>RAG: Exception
        Note over RAG: Log error<br/>Propagate exception
        RAG-->>RAG: Raise exception to API
    end
```

## Data Flow Summary

1. **User Query** → Chat API
2. **Session Management** → Retrieve/Create session, get history
3. **Internal KB Retrieval** → ChromaDB similarity search
4. **Confidence Calculation** → Based on retrieval results
5. **External KB Decision** → Query Perplexity if needed
6. **Stock Analysis Detection** → Apply template if applicable
7. **LLM Generation** → Generate answer with context
8. **Citation Extraction** → Combine internal + external citations
9. **Session Update** → Store user & assistant messages
10. **Candidate Generation** → Create KB candidate if external KB used
11. **Response Building** → Return ChatResponse with all metadata

## Notes

- **Session ID**: Maintains conversation context across queries
- **Confidence Threshold**: Configurable via `KB_CONFIDENCE_THRESHOLD` setting
- **Stock Analysis**: Automatically detected and uses professional template
- **Citations**: Separated from answer text (sources in response, not in answer)
- **Error Handling**: Graceful fallback to internal KB if external fails
- **KB Candidates**: Automatically generated when external knowledge is used
