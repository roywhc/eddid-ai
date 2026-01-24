# Research: Agentic AI Knowledge Base System

**Date**: 2026-01-24  
**Feature**: Agentic AI Knowledge Base System  
**Status**: Complete

## Overview

Research phase is minimal as comprehensive implementation guide exists at `stock-analysis-ai/docs/agentic-kb-implementation-guide.md`. This document consolidates key technical decisions and alternatives.

## Technology Decisions

### Decision: FastAPI Framework
**Rationale**: 
- Modern async Python framework with automatic OpenAPI documentation
- Excellent performance for API endpoints
- Strong type validation with Pydantic integration
- Active community and ecosystem

**Alternatives Considered**:
- Flask: Synchronous, requires more boilerplate for async operations
- Django REST Framework: Heavier framework, more opinionated structure
- FastAPI chosen for async-first design and automatic API documentation

### Decision: LangChain v1 for RAG
**Rationale**:
- Comprehensive RAG framework with vector store integrations
- Supports multiple embedding models and LLM providers
- Well-documented patterns for retrieval and generation
- Active development and community support

**Alternatives Considered**:
- Custom RAG implementation: More control but significant development overhead
- LlamaIndex: Alternative RAG framework, LangChain chosen for broader ecosystem
- LangChain chosen for proven patterns and flexibility

### Decision: ChromaDB as Default Vector Store
**Rationale**:
- Embedded vector database, no separate service required
- Simple deployment for development and small-scale production
- Good performance for up to 10,000+ chunks
- Easy to switch to pgvector for production scale

**Alternatives Considered**:
- PostgreSQL with pgvector: Better for production scale but requires separate database
- Pinecone: Managed service, adds external dependency and cost
- ChromaDB chosen for simplicity and embedded deployment

### Decision: Sentence Transformers for Embeddings
**Rationale**:
- Local embeddings, no API costs
- Good quality for semantic search
- Fast inference
- Model: `all-MiniLM-L6-v2` provides good balance of quality and speed

**Alternatives Considered**:
- OpenAI embeddings: Higher quality but API costs and latency
- Other sentence-transformers models: Chosen model provides best quality/speed tradeoff
- Sentence transformers chosen for cost-effectiveness and performance

### Decision: OpenRouter for LLM Provider
**Rationale**:
- Access to 300+ models from multiple providers
- Unified API interface
- Cost-effective routing
- Fallback options if primary model unavailable

**Alternatives Considered**:
- Direct OpenAI API: Single provider, higher cost
- Anthropic Claude API: Good quality but single provider
- OpenRouter chosen for flexibility and cost optimization

### Decision: Perplexity for External Knowledge
**Rationale**:
- Real-time web search with citations
- High-quality, fact-based responses
- Built-in citation extraction
- Good API reliability

**Alternatives Considered**:
- Custom web scraping: Complex, maintenance overhead, legal concerns
- Other search APIs: Perplexity provides best citation quality
- Perplexity chosen for citation quality and reliability

## Architecture Patterns

### Pattern: Service Layer Abstraction
**Decision**: Abstract all external dependencies (vector store, LLM, external knowledge) behind service interfaces

**Rationale**: Enables swapping implementations without changing business logic. Supports testing with mocks.

### Pattern: Confidence-Based Routing
**Decision**: Use confidence scores to determine when to query external knowledge

**Rationale**: Reduces API costs while ensuring comprehensive answers. Threshold-based approach provides clear decision criteria.

### Pattern: Candidate Generation Pipeline
**Decision**: Automatically generate KB candidates from external knowledge for human review

**Rationale**: Enables knowledge base to grow organically from user queries. Human review ensures quality.

## Implementation Status

### Phase 1: Core Infrastructure ✅
- Configuration management: Complete
- Logging system: Complete
- Data models: Complete
- Database infrastructure: Complete
- FastAPI application: Complete
- Health check endpoint: Complete

**Testing Status**: Tests exist but need validation and completion

### Remaining Phases
- Phase 2: Vector store setup (ChromaDB/pgvector)
- Phase 3: RAG implementation and chat API
- Phase 4: External knowledge integration (Perplexity)
- Phase 5: KB update pipeline
- Phase 6: Observability and monitoring
- Phase 7: Containerization and deployment

## Key Considerations

### Performance
- Embedding generation: Local models preferred to avoid API latency
- Vector search: ChromaDB sufficient for initial scale, pgvector for production
- Caching: Implement caching layer for frequent queries

### Security
- Authentication: Needs implementation (OAuth2 or API keys)
- Rate limiting: Configuration exists, implementation needed
- Input validation: Pydantic provides validation, additional sanitization may be needed

### Scalability
- Vector store: ChromaDB for development, pgvector for production scale
- Session management: In-memory initially, database-backed for production
- Caching: Redis recommended for production

## References

- Implementation Guide: `stock-analysis-ai/docs/agentic-kb-implementation-guide.md`
- LangChain Documentation: https://python.langchain.com/
- FastAPI Documentation: https://fastapi.tiangolo.com/
- ChromaDB Documentation: https://docs.trychroma.com/
- Perplexity API Documentation: https://docs.perplexity.ai/
