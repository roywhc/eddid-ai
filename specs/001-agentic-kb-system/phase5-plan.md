# Phase 5 Implementation Plan: Knowledge Base Management

**Feature**: Agentic AI Knowledge Base System  
**Phase**: Phase 5 - Knowledge Base Management  
**Date**: 2026-01-25  
**Status**: Planning  
**Prerequisites**: Phase 1 ✅ Complete, Phase 2 ✅ Complete, Phase 3 ✅ Complete, Phase 4 ✅ Complete

## Summary

Phase 5 implements the complete knowledge base management system, enabling administrators to add, update, and delete documents, as well as review and approve candidate entries generated from external knowledge. This phase transforms the system from read-only to a fully manageable knowledge base.

**Primary Requirement**: System provides APIs for document management (CRUD operations) and candidate review/approval workflow, with automatic chunking, embedding, and vector storage.

**Technical Approach**: 
- Implement DocumentService for document lifecycle management
- Implement candidate review/approval workflow
- Integrate chunking and embedding into document creation/update
- Add document versioning and status management
- Complete KB management API endpoints
- Add proper error handling and validation

## Technical Context

**Language/Version**: Python 3.11+  
**Primary Dependencies**: 
- FastAPI 0.115.0 (already in use)
- SQLAlchemy (for metadata storage - already in use)
- LangChain (for chunking and embeddings - already in use)
- ChromaDB (for vector storage - already in use)
- Existing: DocumentChunker, VectorStore, RetrievalService

**Storage**: 
- Metadata DB: SQLite/PostgreSQL (documents, chunks, candidates)
- Vector DB: ChromaDB (chunk embeddings)

**Testing**: pytest 8.2.0, pytest-asyncio 0.24.0, httpx for API testing  
**Target Platform**: Linux/Windows/Mac (containerized deployment)  
**Project Type**: Single backend API project  

**Performance Goals**:
- Document creation: < 5 seconds for typical document (including chunking and embedding)
- Document update: < 3 seconds (re-chunking and re-embedding)
- Candidate approval: < 2 seconds (conversion to document)
- Batch operations: Support up to 100 documents at once

**Constraints**:
- Must maintain document version history (FR-013)
- Must handle concurrent document operations safely
- Must validate document content before processing
- Must gracefully handle large documents (chunking required)

## Constitution Check

✅ **API-First Architecture**: All operations exposed via REST API  
✅ **Service Layer Abstraction**: DocumentService abstracts business logic  
✅ **Data Source Abstraction**: Vector store abstraction already exists  
✅ **Test-First Development**: Tests will be written before implementation  
✅ **Observability & Monitoring**: Logging and error handling included  
✅ **Security & Compliance**: Input validation and error handling  

## Implementation Components

### 1. DocumentService (`app/services/document_service.py`)

**Purpose**: Manages document lifecycle (create, read, update, delete)

**Key Methods**:
- `create_document(request: KBUpdateRequest) -> KBDocument`
  - Generate doc_id
  - Chunk document using DocumentChunker
  - Generate embeddings and store in vector DB
  - Save document metadata to database
  - Return KBDocument with chunk count
- `get_document(doc_id: str) -> KBDocument`
  - Retrieve from database
  - Return KBDocument
- `update_document(doc_id: str, request: KBUpdateRequest) -> KBDocument`
  - Increment version
  - Delete old chunks from vector DB
  - Re-chunk and re-embed
  - Update database record
  - Maintain version history
- `delete_document(doc_id: str) -> bool`
  - Mark as deleted (soft delete)
  - Delete chunks from vector DB
  - Update database status
- `list_documents(kb_id: Optional[str], status: Optional[str], limit: int, offset: int) -> List[KBDocument]`
  - Query database with filters
  - Return paginated list

**Dependencies**:
- DocumentChunker (chunking)
- VectorStore (embedding and storage)
- SessionLocal (database access)
- DocumentRecord, ChunkRecord (ORM models)

### 2. CandidateReviewService (`app/services/candidate_review_service.py`)

**Purpose**: Manages candidate review and approval workflow

**Key Methods**:
- `get_candidates(kb_id: Optional[str], status: Optional[str], limit: int, offset: int) -> List[KBCandidate]`
  - Query kb_candidates table
  - Filter by kb_id and status
  - Return paginated list
- `approve_candidate(candidate_id: str, reviewer: str, notes: Optional[str]) -> KBDocument`
  - Load candidate from database
  - Convert to KBUpdateRequest
  - Call DocumentService.create_document()
  - Update candidate status to "approved"
  - Set reviewed_by and review_notes
  - Return created KBDocument
- `reject_candidate(candidate_id: str, reviewer: str, notes: Optional[str]) -> bool`
  - Update candidate status to "rejected"
  - Set reviewed_by and review_notes
  - Return success
- `modify_candidate(candidate_id: str, request: KBUpdateRequest, reviewer: str, notes: Optional[str]) -> KBDocument`
  - Update candidate content with modifications
  - Approve modified candidate
  - Return created KBDocument

**Dependencies**:
- DocumentService (for creating documents from candidates)
- SessionLocal (database access)
- KBCandidateRecord (ORM model)

### 3. KB Management API (`app/api/kb_management.py`)

**Purpose**: REST API endpoints for KB management

**Endpoints to Implement**:
- `POST /api/kb/documents` - Create document
- `GET /api/kb/documents/{doc_id}` - Get document
- `PUT /api/kb/documents/{doc_id}` - Update document
- `DELETE /api/kb/documents/{doc_id}` - Delete document
- `GET /api/kb/documents` - List documents (with filters)
- `GET /api/kb/candidates` - List candidates
- `POST /api/kb/candidates/{candidate_id}/approve` - Approve candidate
- `POST /api/kb/candidates/{candidate_id}/reject` - Reject candidate
- `POST /api/kb/candidates/{candidate_id}/modify` - Modify and approve candidate

**Request/Response Models**:
- Use existing: KBUpdateRequest, KBDocument, KBCandidate
- Add: CandidateApproveRequest, CandidateRejectRequest, CandidateModifyRequest

### 4. Version Management

**Purpose**: Track document versions and maintain history

**Implementation**:
- Use semantic versioning (MAJOR.MINOR.PATCH)
- Increment version on updates
- Store version in DocumentRecord
- Version history can be queried (future enhancement)

### 5. Error Handling & Validation

**Validation Rules**:
- Document title: non-empty, max 500 chars
- Document content: non-empty, max 10MB
- Document type: must be valid type
- KB ID: must exist (validation)
- Version: must follow semantic versioning

**Error Handling**:
- Invalid input: 400 Bad Request
- Document not found: 404 Not Found
- Vector store errors: 500 Internal Server Error with graceful fallback
- Concurrent updates: Handle with optimistic locking

## Implementation Order

1. **DocumentService** (Core business logic)
   - Create document with chunking and embedding
   - Read document
   - Update document with versioning
   - Delete document (soft delete)
   - List documents

2. **CandidateReviewService** (Review workflow)
   - Get candidates
   - Approve candidate (convert to document)
   - Reject candidate
   - Modify candidate

3. **KB Management API** (REST endpoints)
   - Document CRUD endpoints
   - Candidate review endpoints
   - Error handling and validation

4. **Tests** (Test-first approach)
   - Unit tests for DocumentService
   - Unit tests for CandidateReviewService
   - Integration tests for API endpoints
   - Test chunking and embedding integration

## Test Strategy

### Unit Tests

**DocumentService Tests** (`tests/test_document_service.py`):
- Create document successfully
- Create document with chunking and embedding
- Get document by ID
- Update document (version increment, re-chunking)
- Delete document (soft delete, chunk removal)
- List documents with filters
- Handle invalid input
- Handle document not found
- Handle vector store errors

**CandidateReviewService Tests** (`tests/test_candidate_review_service.py`):
- Get candidates with filters
- Approve candidate (converts to document)
- Reject candidate
- Modify candidate
- Handle candidate not found
- Handle invalid status transitions

### Integration Tests

**KB Management API Tests** (`tests/test_kb_management_api.py`):
- POST /api/kb/documents - create document
- GET /api/kb/documents/{doc_id} - get document
- PUT /api/kb/documents/{doc_id} - update document
- DELETE /api/kb/documents/{doc_id} - delete document
- GET /api/kb/documents - list documents
- GET /api/kb/candidates - list candidates
- POST /api/kb/candidates/{candidate_id}/approve - approve candidate
- POST /api/kb/candidates/{candidate_id}/reject - reject candidate
- POST /api/kb/candidates/{candidate_id}/modify - modify candidate
- Error handling (400, 404, 500)
- Validation errors

### Test Coverage Goals

- **Unit Tests**: 90%+ coverage for service layer
- **Integration Tests**: All API endpoints covered
- **Edge Cases**: Invalid input, not found, concurrent operations

## Success Criteria

- ✅ Documents can be created through API
- ✅ Documents are automatically chunked and embedded
- ✅ Documents can be updated with version tracking
- ✅ Documents can be deleted (soft delete)
- ✅ Documents can be listed with filters
- ✅ Candidates can be listed with filters
- ✅ Candidates can be approved (converted to documents)
- ✅ Candidates can be rejected
- ✅ Candidates can be modified before approval
- ✅ All tests pass (90%+ coverage)
- ✅ API response times meet performance goals

## Risks and Mitigations

**Risk**: Large documents may cause timeouts  
**Mitigation**: Implement async processing, add progress tracking, enforce size limits

**Risk**: Concurrent updates may cause conflicts  
**Mitigation**: Use optimistic locking, handle conflicts gracefully

**Risk**: Vector store operations may fail  
**Mitigation**: Implement retry logic, graceful error handling, transaction rollback

**Risk**: Embedding generation may be slow  
**Mitigation**: Use async operations, consider caching, batch processing

## Dependencies

**Runtime Dependencies**:
- DocumentChunker (already implemented)
- VectorStore (already implemented)
- Database (SQLite/PostgreSQL)
- Embedding model (HuggingFace)

**Testing Dependencies**:
- pytest, pytest-asyncio
- Mock libraries for vector store and database
- httpx for API testing

## Next Steps After Phase 5

**Phase 6**: Observability and Monitoring
- Metrics collection
- Performance monitoring
- Health checks enhancement
- Logging improvements

**Phase 7**: Containerization and Deployment
- Docker containerization
- Docker Compose setup
- Deployment documentation
- Production configuration

---

**Status**: Ready for Implementation  
**Next Action**: Begin with DocumentService implementation
