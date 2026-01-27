# Feature Specification: Tool-Based RAG Flow Refactoring

**Feature Branch**: `002-tool-based-rag-flow`  
**Created**: 2026-01-27  
**Status**: Draft  
**Input**: User description: "Please refactor the flow. Make both knowledge base and perplexity as tool. make it a flow: 1. Provide the prompt of target response and let LLM decide the tool call parameter. 2. The knowledge base tool usage is mandatory, advise the agent to tailor the query for knowledge base for optimium result. 3. Ask the model whether the info of knowledge base is sufficient, if not, advise the model to tailor a search for perplexity. 3a. If perplexity is called, advise LLM to create keyword for the perplexity result, the keywords will be indexed for future query. 4. The LLM need to use a tool call to generate a response to user instead returning directly the LLM response. Make this step mandatory, if model failed to call, repeat at most once."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Query Processing with Knowledge Base Tool (Priority: P1)

A user submits a query to the chat interface. The system processes the query using a tool-based agentic flow where the LLM makes decisions about which tools to use and how to use them.

**Why this priority**: This is the core functionality that enables the tool-based architecture. Without this, the system cannot function.

**Independent Test**: Can be fully tested by submitting a query and verifying that the LLM calls the knowledge base tool with appropriate parameters, receives results, and generates a response. This delivers the fundamental capability of tool-based query processing.

**Acceptance Scenarios**:

1. **Given** a user submits a query, **When** the system processes it, **Then** the LLM MUST call the knowledge base tool with tailored query parameters optimized for retrieval
2. **Given** the LLM receives knowledge base results, **When** evaluating sufficiency, **Then** the LLM MUST determine if additional information is needed
3. **Given** the LLM determines knowledge base results are sufficient, **When** generating a response, **Then** the LLM MUST use a tool call to generate and return the final response to the user
4. **Given** the LLM fails to call the response generation tool, **When** the system detects the failure, **Then** the system MUST retry the tool call once before reporting an error

---

### User Story 2 - Perplexity Tool Integration (Priority: P2)

When knowledge base results are insufficient, the LLM calls the Perplexity tool to retrieve external information, then creates keywords for indexing the results.

**Why this priority**: This extends the system's capability to handle queries that require external knowledge, significantly improving answer quality for topics not covered in the internal knowledge base.

**Independent Test**: Can be fully tested by submitting a query that requires external knowledge, verifying that the LLM calls Perplexity with a tailored search query, receives results, creates keywords for indexing, and incorporates the information into the final response. This delivers enhanced answer quality for complex queries.

**Acceptance Scenarios**:

1. **Given** the LLM determines knowledge base results are insufficient, **When** deciding to retrieve external information, **Then** the LLM MUST call the Perplexity tool with a tailored search query optimized for external knowledge retrieval
2. **Given** the LLM receives Perplexity results, **When** processing the external information, **Then** the LLM MUST create keywords that will be indexed for future queries
3. **Given** the LLM has both knowledge base and Perplexity results, **When** generating a response, **Then** the LLM MUST combine information from both sources and use a tool call to return the final response

---

### User Story 3 - Keyword Indexing for Future Queries (Priority: P3)

When Perplexity results are retrieved, the system indexes keywords from those results to improve future knowledge base retrieval.

**Why this priority**: This enables the system to learn and improve over time by making external knowledge more discoverable in future queries, creating a self-improving knowledge system.

**Independent Test**: Can be fully tested by submitting a query that triggers Perplexity, verifying that keywords are extracted and indexed, then submitting a related query and verifying that the indexed keywords help retrieve relevant information. This delivers continuous improvement of the knowledge base.

**Acceptance Scenarios**:

1. **Given** the LLM receives Perplexity results, **When** creating keywords for indexing, **Then** the system MUST extract and store keywords that represent the key concepts from the Perplexity response
2. **Given** keywords are indexed from Perplexity results, **When** a future query is processed, **Then** the knowledge base tool MUST be able to retrieve information using those indexed keywords
3. **Given** keywords are created from Perplexity results, **When** storing them, **Then** the system MUST associate keywords with the original query and Perplexity response for traceability

---

### Edge Cases

- What happens when the knowledge base tool returns no results? The LLM should still evaluate the empty results and decide whether to call Perplexity
- How does the system handle tool call failures? The system retries once for the response generation tool, but other tool failures should be handled gracefully with appropriate error messages
- What happens if the LLM refuses to call the mandatory knowledge base tool? The system detects the missing mandatory tool call, provides feedback to the LLM with a retry opportunity, and if the tool call is still missing after retry, returns an error to the user
- How does the system handle Perplexity API failures? The system should gracefully handle failures and allow the LLM to proceed with knowledge base results only
- What happens when the LLM generates keywords that are too generic or too specific? The system validates keyword quality (2-50 characters, non-empty) and provides guidance to the LLM for optimal keyword creation, including examples of good keywords and common pitfalls to avoid
- How does the system handle concurrent queries that might create duplicate keyword entries? The system detects duplicate keywords and merges them, associating each keyword with all related queries and Perplexity results. Concurrent indexing operations are handled safely to prevent data corruption
- What happens if the response generation tool call fails twice? The system should return an error response to the user indicating the failure

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a prompt to the LLM that describes the target response format and instructs the LLM to use tool calls for all operations
- **FR-002**: System MUST expose knowledge base retrieval as a tool that the LLM can call with query parameters. Tool call parameters MUST be validated (parameter types, input sanitization, length limits) and potentially malicious patterns MUST be rejected
- **FR-003**: System MUST make knowledge base tool usage mandatory for every query, with instructions to the LLM to tailor the query for optimal retrieval results. If the LLM fails to call the mandatory knowledge base tool, the system MUST detect the missing call, provide feedback to the LLM with a retry opportunity, and if still missing after retry, return an error to the user
- **FR-004**: System MUST instruct the LLM to evaluate whether knowledge base results are sufficient to answer the user's query
- **FR-005**: System MUST expose Perplexity search as a tool that the LLM can call with tailored search parameters. Tool call parameters MUST be validated (parameter types, input sanitization, length limits) and potentially malicious patterns MUST be rejected
- **FR-006**: System MUST instruct the LLM to call the Perplexity tool only when knowledge base results are determined to be insufficient
- **FR-007**: System MUST require the LLM to create keywords from Perplexity results when the Perplexity tool is called. Keywords MUST be validated (2-50 characters, non-empty) and the system MUST provide guidance to the LLM on optimal keyword creation
- **FR-008**: System MUST index keywords created from Perplexity results for use in future knowledge base queries. Keywords persist indefinitely but can be manually or automatically pruned based on usage/age. When duplicate keywords are detected during indexing, the system MUST merge them and associate the keyword with all related queries and Perplexity results
- **FR-009**: System MUST require the LLM to use a tool call to generate the final response to the user, rather than returning the response directly
- **FR-010**: System MUST retry the response generation tool call once if the initial call fails
- **FR-011**: System MUST handle tool call failures gracefully, providing appropriate error messages when tools fail after retries
- **FR-012**: System MUST maintain conversation history and session context throughout the tool-based flow
- **FR-013**: System MUST combine information from knowledge base and Perplexity results when both are used
- **FR-014**: System MUST preserve citations and source attribution from both knowledge base and Perplexity results in the final response

### Key Entities *(include if feature involves data)*

- **Tool Call**: Represents a request from the LLM to execute a specific tool (knowledge base, Perplexity, or response generation) with parameters
- **Knowledge Base Tool Result**: Contains retrieved chunks from the internal knowledge base with relevance scores and metadata
- **Perplexity Tool Result**: Contains external knowledge answer, citations, and metadata from Perplexity API
- **Indexed Keywords**: Keywords extracted from Perplexity results that are stored and associated with the original query and results for future retrieval. Keywords must be 2-50 characters and non-empty. Keywords persist indefinitely but can be manually or automatically pruned based on usage/age. The system provides guidance to the LLM on optimal keyword creation. When duplicate keywords are detected, the system merges them and associates the keyword with all related queries and Perplexity results
- **Response Generation Tool**: A tool that the LLM must call to format and return the final response to the user, ensuring structured output
- **Tool Call History**: Tracks all tool calls made during query processing for debugging, logging, and analysis

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of queries MUST result in the knowledge base tool being called (mandatory requirement)
- **SC-002**: The LLM MUST successfully call the response generation tool in at least 95% of queries on the first attempt
- **SC-003**: When Perplexity is called, keywords MUST be created and indexed in 100% of cases
- **SC-004**: Users receive complete answers that combine knowledge base and external information when needed, with 90% of users reporting satisfaction with answer quality
- **SC-005**: The system processes queries end-to-end (from user input to final response) in under 10 seconds for 95% of queries
- **SC-006**: Indexed keywords from Perplexity results improve future query retrieval, with at least 20% of subsequent related queries finding relevant information through indexed keywords
- **SC-007**: Tool call failures are handled gracefully, with retry mechanism successfully recovering from failures in at least 80% of retry attempts
- **SC-008**: The system maintains conversation context across tool calls, with 100% of multi-turn conversations preserving context correctly

## Assumptions

- The LLM supports function/tool calling capabilities (e.g., OpenAI function calling, Anthropic tool use, or similar)
- The LLM can be instructed through prompts to use tools in a specific sequence
- Tool call parameters can be validated and sanitized before execution. The system validates parameter types, sanitizes inputs, enforces length limits, and rejects potentially malicious patterns
- The knowledge base tool can accept query parameters tailored by the LLM
- The Perplexity API supports search queries tailored by the LLM
- Keyword indexing infrastructure exists or will be created to store and retrieve keywords
- Tool call failures can be detected and distinguished from successful calls
- The system can retry tool calls with the same parameters
- Conversation history can be maintained across multiple tool calls within a single query processing flow

## Dependencies

- Existing knowledge base retrieval service must be accessible as a tool
- Existing Perplexity service must be accessible as a tool
- LLM service must support tool/function calling
- Keyword indexing system must be available for storing and retrieving keywords
- Session management system must maintain context across tool calls
- Logging and monitoring systems must track tool call execution

## Clarifications

### Session 2026-01-27

- Q: How should indexed keywords be managed over time? → A: Keywords persist indefinitely but can be manually or automatically pruned based on usage/age
- Q: What validation and security measures should be applied to tool call parameters? → A: Validate parameter types, sanitize inputs, enforce length limits, and reject potentially malicious patterns
- Q: What defines acceptable keyword quality, and what validation should be applied? → A: Keywords must be 2-50 characters, non-empty, and system provides guidance to LLM on optimal keyword creation
- Q: How should the system enforce mandatory tool calls when the LLM refuses or fails to call them? → A: System detects missing mandatory tool calls, provides feedback to LLM with retry, and if still missing after retry, returns error to user
- Q: How should the system handle duplicate keywords when multiple queries create the same keywords? → A: System detects duplicates and merges them, associating the keyword with all related queries and Perplexity results

## Out of Scope

- Implementation of the underlying LLM tool calling mechanism (assumed to be available)
- Creation of new knowledge base or Perplexity services (existing services will be wrapped as tools)
- Design of keyword indexing schema (assumed to be handled by existing or new indexing system)
- User interface changes (frontend remains unchanged, only backend flow changes)
- Migration of existing queries to the new tool-based flow (new flow applies to all new queries)
- Performance optimization beyond basic retry mechanism
- Advanced error recovery beyond single retry for response generation tool
