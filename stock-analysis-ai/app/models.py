"""Pydantic models for API requests and responses"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# ===== Chat Models =====

class ChatMessage(BaseModel):
    """Chat message"""
    role: str  # "user" or "assistant"
    content: str
    timestamp: Optional[str] = None

class ChatRequest(BaseModel):
    """Chat query request"""
    query: str = Field(..., min_length=1, max_length=5000)
    session_id: Optional[str] = None
    include_sources: bool = False
    use_external_kb: bool = True
    conversation_history: Optional[List[ChatMessage]] = None

class Citation(BaseModel):
    """Citation/source reference"""
    source: str  # "internal" or "external"
    document_id: Optional[str] = None
    document_title: Optional[str] = None
    section: Optional[str] = None
    url: Optional[str] = None
    relevance_score: Optional[float] = None
    snippet: Optional[str] = None

class ChatResponse(BaseModel):
    """Chat query response"""
    session_id: str
    query: str
    answer: str
    sources: List[Citation] = []
    confidence_score: float
    used_internal_kb: bool
    used_external_kb: bool
    processing_time_ms: int
    timestamp: str

# ===== KB Models =====

class KBUpdateRequest(BaseModel):
    """KB update request (for API)"""
    doc_id: Optional[str] = None
    kb_id: str
    title: str
    content: str
    doc_type: str
    tags: List[str] = []
    language: str = "en"
    source_type: Optional[str] = "manual"
    source_urls: List[str] = []

class KBDocument(BaseModel):
    """Knowledge base document"""
    doc_id: str
    kb_id: str
    title: str
    doc_type: str
    content: str
    version: str
    created_at: datetime
    updated_at: datetime
    created_by: str
    approved_by: Optional[str] = None
    language: str = "en"
    tags: List[str] = []
    status: str = "active"
    chunks: Optional[int] = None

class DocumentsListResponse(BaseModel):
    """Paginated documents list response"""
    items: List[KBDocument]
    total: Optional[int] = None
    limit: int
    offset: int

class KBCandidate(BaseModel):
    """Candidate entry (pending review)"""
    candidate_id: str
    original_query: str
    source_type: str
    title: str
    content: str
    suggested_kb_id: str
    suggested_category: Optional[str] = None
    external_urls: List[str] = []
    extracted_on: datetime
    status: str = "pending"
    reviewed_by: Optional[str] = None
    review_notes: Optional[str] = None
    hit_count: int = 0
    doc_id: Optional[str] = None  # Link to document if approved

class CandidateApproveRequest(BaseModel):
    """Request to approve a candidate"""
    reviewer: str
    notes: Optional[str] = None

class CandidateRejectRequest(BaseModel):
    """Request to reject a candidate"""
    reviewer: str
    notes: Optional[str] = None

class CandidateModifyRequest(BaseModel):
    """Request to modify and approve a candidate"""
    reviewer: str
    notes: Optional[str] = None
    document: KBUpdateRequest

# ===== Health & Metrics Models =====

class HealthStatus(BaseModel):
    """System health status"""
    status: str  # "healthy", "degraded", "unhealthy"
    timestamp: str
    components: Dict[str, str]
    version: str

class MetricsSummary(BaseModel):
    """Metrics summary"""
    enabled: bool
    counters: Optional[Dict[str, float]] = None
    histograms: Optional[Dict[str, Any]] = None
    gauges: Optional[Dict[str, float]] = None
    error: Optional[str] = None

# ===== Retrieval Models =====

class ChunkMetadata(BaseModel):
    """Metadata for a document chunk"""
    doc_id: str
    kb_id: str
    doc_type: Optional[str] = None
    version: Optional[str] = None
    chunk_index: Optional[int] = None
    chunk_size: Optional[int] = None
    section_title: Optional[str] = None
    section_path: Optional[str] = None
    language: Optional[str] = None
    tags: Optional[List[str]] = None
    source_type: Optional[str] = None
    source_urls: Optional[List[str]] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    created_by: Optional[str] = None

class RetrievalResult(BaseModel):
    """Result from vector store search"""
    chunk_id: str
    content: str
    metadata: ChunkMetadata
    score: float

class ExternalKnowledgeResult(BaseModel):
    """Result from external knowledge source (Perplexity)"""
    answer: str
    citations: List[Citation]
    raw_response: Optional[Dict[str, Any]] = None
    query_time_ms: float

# ===== Error Models =====

class ErrorResponse(BaseModel):
    """Error response"""
    detail: str
