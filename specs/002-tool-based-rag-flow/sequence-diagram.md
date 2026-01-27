# Tool-Based RAG Flow Sequence Diagram

This document illustrates the tool-based agentic flow where the LLM orchestrates tool calls to process user queries.

## Main Query Flow

```mermaid
sequenceDiagram
    participant User
    participant ChatAPI as Chat API<br/>(/api/chat/query)
    participant Agent as Agent Controller<br/>(Tool Orchestrator)
    participant LLM as LLM Service<br/>(with Tool Calling)
    participant KBTool as Knowledge Base Tool
    participant KB as Knowledge Base<br/>(ChromaDB)
    participant PerplexityTool as Perplexity Tool
    participant PerplexityAPI as Perplexity API
    participant KeywordIndex as Keyword Index
    participant ResponseTool as Response Generation Tool

    User->>ChatAPI: POST /query<br/>{query, session_id?}
    
    ChatAPI->>Agent: process_query(request)
    
    Note over Agent,LLM: Initialize Tool-Based Flow
    Agent->>LLM: Send system prompt with tool definitions<br/>+ user query + conversation history
    
    Note over LLM,KBTool: Step 1: Mandatory Knowledge Base Tool
    LLM->>LLM: Analyze query and tailor for KB retrieval
    LLM->>KBTool: call_tool("knowledge_base_search",<br/>{query: tailored_query, kb_id: "default_kb", top_k: 5})
    KBTool->>KB: similarity_search(tailored_query)
    KB-->>KBTool: retrieval_results[]
    KBTool-->>LLM: Tool Result: {chunks, scores, metadata}
    
    Note over LLM: Step 2: Evaluate KB Sufficiency
    LLM->>LLM: Evaluate if KB results are sufficient<br/>to answer user query
    
    alt KB Results Sufficient
        Note over LLM,ResponseTool: Step 3a: Generate Response (KB Only)
        LLM->>LLM: Prepare response from KB results
        LLM->>ResponseTool: call_tool("generate_response",<br/>{answer: response_text,<br/>sources: kb_citations,<br/>confidence: score})
        ResponseTool-->>LLM: Tool Result: {formatted_response}
        
    else KB Results Insufficient
        Note over LLM,PerplexityTool: Step 3b: Call Perplexity Tool
        LLM->>LLM: Tailor search query for Perplexity
        LLM->>PerplexityTool: call_tool("perplexity_search",<br/>{query: tailored_search,<br/>context: kb_results_summary})
        PerplexityTool->>PerplexityAPI: API call with tailored query
        PerplexityAPI-->>PerplexityTool: {answer, citations, metadata}
        PerplexityTool-->>LLM: Tool Result: {answer, citations}
        
        Note over LLM,KeywordIndex: Step 3c: Create Keywords
        LLM->>LLM: Extract keywords from Perplexity results
        LLM->>KeywordIndex: index_keywords({keywords: [...],<br/>query: original_query,<br/>perplexity_result_id: id})
        KeywordIndex-->>LLM: {indexed: true, keyword_count: N}
        
        Note over LLM,ResponseTool: Step 3d: Generate Response (KB + Perplexity)
        LLM->>LLM: Combine KB and Perplexity results
        LLM->>ResponseTool: call_tool("generate_response",<br/>{answer: combined_response,<br/>sources: [kb_citations, perplexity_citations],<br/>confidence: score})
        ResponseTool-->>LLM: Tool Result: {formatted_response}
    end
    
    Note over LLM,Agent: Step 4: Validate Response Tool Call
    alt Response Tool Call Successful
        LLM-->>Agent: Final response with citations
        Agent->>Agent: Store conversation history
        Agent-->>ChatAPI: ChatResponse
        ChatAPI-->>User: JSON Response<br/>{answer, sources, confidence_score, ...}
    else Response Tool Call Failed
        Note over Agent,LLM: Retry Logic (Once)
        Agent->>LLM: Provide feedback + retry request
        LLM->>ResponseTool: call_tool("generate_response", ...)
        alt Retry Successful
            ResponseTool-->>LLM: Tool Result: {formatted_response}
            LLM-->>Agent: Final response
            Agent-->>ChatAPI: ChatResponse
            ChatAPI-->>User: JSON Response
        else Retry Failed
            Agent-->>ChatAPI: Error Response
            ChatAPI-->>User: Error: Failed to generate response
        end
    end
```

## Tool Call Validation Flow

```mermaid
sequenceDiagram
    participant LLM
    participant Validator as Parameter Validator
    participant Tool as Tool (KB/Perplexity/Response)

    LLM->>Validator: Tool call request<br/>{tool_name, parameters}
    
    Validator->>Validator: Validate parameter types
    Validator->>Validator: Sanitize inputs
    Validator->>Validator: Check length limits
    Validator->>Validator: Detect malicious patterns
    
    alt Validation Passed
        Validator->>Tool: Execute tool with validated parameters
        Tool-->>Validator: Tool result
        Validator-->>LLM: Tool result
    else Validation Failed
        Validator-->>LLM: Error: Invalid parameters<br/>{reason, guidance}
        Note over LLM: LLM can retry with corrected parameters
    end
```

## Mandatory Tool Call Enforcement Flow

```mermaid
sequenceDiagram
    participant Agent
    participant LLM
    participant KBTool as Knowledge Base Tool

    Agent->>LLM: Initial request with mandatory KB tool instruction
    
    LLM-->>Agent: Response (check for KB tool call)
    
    alt KB Tool Call Present
        Agent->>KBTool: Execute KB tool call
        KBTool-->>Agent: Results
        Agent->>Agent: Continue flow
    else KB Tool Call Missing
        Note over Agent,LLM: Detection & Retry
        Agent->>Agent: Detect missing mandatory tool call
        Agent->>LLM: Feedback: "You must call knowledge_base_search tool"<br/>+ Retry request
        LLM-->>Agent: Response (check again for KB tool call)
        alt KB Tool Call Present After Retry
            Agent->>KBTool: Execute KB tool call
            KBTool-->>Agent: Results
            Agent->>Agent: Continue flow
        else KB Tool Call Still Missing
            Agent->>Agent: Return error to user
            Agent-->>User: Error: Mandatory tool call failed
        end
    end
```

## Keyword Indexing Flow

```mermaid
sequenceDiagram
    participant LLM
    participant KeywordIndex as Keyword Index
    participant KB as Knowledge Base

    Note over LLM: After Perplexity Tool Call
    LLM->>LLM: Extract keywords from Perplexity results<br/>(2-50 chars, non-empty, guided by system)
    
    LLM->>KeywordIndex: index_keywords({keywords, query_id, perplexity_result_id})
    
    KeywordIndex->>KeywordIndex: Validate keywords (length, format)
    KeywordIndex->>KeywordIndex: Check for duplicates
    
    alt Duplicate Keywords Found
        KeywordIndex->>KeywordIndex: Merge duplicates<br/>Associate with all related queries/results
        KeywordIndex-->>LLM: {indexed: true, merged: true, keyword_count: N}
    else New Keywords
        KeywordIndex->>KeywordIndex: Store new keywords<br/>Associate with query and Perplexity result
        KeywordIndex-->>LLM: {indexed: true, keyword_count: N}
    end
    
    Note over KB: Future Queries
    KB->>KeywordIndex: Query by keywords
    KeywordIndex-->>KB: Related queries and results
```

---

## System Prompts

### Main System Prompt

```
You are an intelligent assistant that helps users by retrieving information from knowledge bases and external sources. You MUST use tool calls for all operations - never return responses directly.

WORKFLOW:
1. MANDATORY: You MUST call the knowledge_base_search tool for EVERY query. Tailor the user's query to optimize retrieval results (e.g., extract key concepts, use synonyms, focus on specific aspects).

2. EVALUATE: After receiving knowledge base results, evaluate whether they are sufficient to answer the user's query completely and accurately.

3. CONDITIONAL: If knowledge base results are insufficient:
   - Call the perplexity_search tool with a tailored search query optimized for external knowledge retrieval
   - After receiving Perplexity results, extract 3-10 keywords (2-50 characters each, non-empty) that represent key concepts
   - Call the index_keywords tool to store these keywords for future queries
   - Keywords should be specific enough to be useful but general enough to match related queries

4. MANDATORY: You MUST call the generate_response tool to return your final answer. Never return the answer directly in your message.

TOOL CALLS:
- All tool parameters will be validated. Ensure parameters are properly formatted and within length limits.
- If a tool call fails, you will receive an error message. Retry with corrected parameters if possible.

RESPONSE FORMAT:
- Combine information from knowledge base and Perplexity (if used) into a coherent answer
- Preserve all citations and source attribution
- Be clear about which information comes from which source
```

### Knowledge Base Tool Prompt (Embedded in Tool Definition)

```
Tool: knowledge_base_search

Description: Search the internal knowledge base for relevant information. This tool is MANDATORY for every query.

Parameters:
- query (string, required): Tailored search query optimized for retrieval. Extract key concepts, use domain-specific terminology, focus on specific aspects of the user's question.
- kb_id (string, default: "default_kb"): Knowledge base identifier
- top_k (integer, default: 5): Number of results to return

Returns:
- chunks: List of relevant text chunks with content and metadata
- scores: Relevance scores for each chunk
- metadata: Document IDs, titles, sections, etc.

IMPORTANT: Always tailor the query to maximize retrieval quality. Consider:
- Extracting core concepts from the user's question
- Using synonyms or related terms
- Focusing on specific aspects if the query is broad
- Using domain-specific terminology when appropriate
```

### Perplexity Tool Prompt (Embedded in Tool Definition)

```
Tool: perplexity_search

Description: Search external knowledge sources via Perplexity API. Only call this tool when knowledge base results are insufficient to answer the user's query completely.

Parameters:
- query (string, required): Tailored search query optimized for external knowledge retrieval. This should be different from the knowledge base query - focus on current information, recent events, or topics not covered in internal KB.
- context (string, optional): Summary of knowledge base results to provide context

Returns:
- answer: Comprehensive answer from external sources
- citations: List of source URLs and references
- metadata: Query time, model used, etc.

IMPORTANT: 
- Only call this tool if knowledge base results are truly insufficient
- Tailor the search query specifically for external knowledge (current events, recent data, etc.)
- After receiving results, you MUST extract keywords for indexing
```

### Keyword Extraction Guidance (Embedded in System Prompt)

```
KEYWORD EXTRACTION GUIDELINES:

When extracting keywords from Perplexity results:
- Extract 3-10 keywords that represent the core concepts
- Keywords should be 2-50 characters, non-empty
- Avoid generic words (e.g., "the", "and", "is")
- Prefer specific, meaningful terms
- Include both broad concepts and specific details
- Examples of good keywords:
  * "AAPL stock price" (specific)
  * "quantum computing applications" (concept + domain)
  * "2026 market trends" (temporal + domain)
- Examples of poor keywords:
  * "the" (too generic)
  * "information" (too vague)
  * "a" (too short, generic)

The system will validate keywords and provide feedback if they don't meet quality standards.
```

### Response Generation Tool Prompt (Embedded in Tool Definition)

```
Tool: generate_response

Description: Generate and format the final response to the user. This tool is MANDATORY - you MUST use it to return your answer, never return the answer directly.

Parameters:
- answer (string, required): The complete answer combining information from all sources
- sources (array, required): List of citations from knowledge base and/or Perplexity
- confidence_score (float, optional): Confidence in the answer quality (0.0-1.0)
- used_internal_kb (boolean, required): Whether knowledge base was used
- used_external_kb (boolean, required): Whether Perplexity was used

Returns:
- formatted_response: The final response formatted for the user
- metadata: Processing information

IMPORTANT: 
- This tool call is MANDATORY for every query
- If this tool call fails, the system will retry once
- Never return the answer directly in your message - always use this tool
```

### Mandatory Tool Call Enforcement Prompt (Used When Tool Call Missing)

```
ERROR: You did not call the required tool.

You MUST call the [tool_name] tool before proceeding. This is a mandatory step in the workflow.

Please retry your response and include the required tool call with appropriate parameters.

Current workflow step: [current_step]
Expected tool: [tool_name]
```

---

## Error Handling Flows

### Tool Call Failure Handling

```mermaid
sequenceDiagram
    participant LLM
    participant Tool
    participant Agent

    LLM->>Tool: Tool call request
    Tool->>Tool: Execute tool
    
    alt Tool Execution Success
        Tool-->>LLM: Tool result
        LLM->>LLM: Process result and continue
    else Tool Execution Failure
        Tool-->>LLM: Error message with details
        alt Retryable Error
            LLM->>LLM: Analyze error
            LLM->>Tool: Retry with corrected parameters
            Tool-->>LLM: Result or error
        else Non-Retryable Error
            LLM->>Agent: Report error
            Agent->>Agent: Handle gracefully
            Note over Agent: Continue with available information<br/>or return error to user
        end
    end
```

### Response Generation Tool Retry Flow

```mermaid
sequenceDiagram
    participant LLM
    participant ResponseTool
    participant Agent

    LLM->>ResponseTool: call_tool("generate_response", params)
    
    alt First Attempt Success
        ResponseTool-->>LLM: {formatted_response}
        LLM-->>Agent: Final response
    else First Attempt Failed
        ResponseTool-->>LLM: Error: Tool call failed
        Agent->>Agent: Detect missing response tool call
        Agent->>LLM: Feedback: "You must call generate_response tool"<br/>+ Retry request
        LLM->>ResponseTool: call_tool("generate_response", params)
        alt Retry Success
            ResponseTool-->>LLM: {formatted_response}
            LLM-->>Agent: Final response
        else Retry Failed
            Agent->>Agent: Return error to user
            Agent-->>User: Error: Failed to generate response after retry
        end
    end
```

---

## Notes

- **Tool Call Validation**: All tool call parameters are validated for type, length, and security before execution
- **Mandatory Tools**: Knowledge base tool and response generation tool are mandatory and enforced with detection and retry logic
- **Keyword Quality**: Keywords are validated (2-50 chars, non-empty) and the LLM receives guidance on optimal keyword creation
- **Duplicate Handling**: Duplicate keywords are automatically merged and associated with all related queries and results
- **Error Recovery**: System gracefully handles tool failures with retry mechanisms and fallback behaviors
- **Conversation Context**: Session history is maintained across all tool calls within a single query processing flow
