from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

# ===== API Models =====

class ChatMessage(BaseModel):
    role: str = Field(..., description="'user' or 'assistant'")
    content: str = Field(..., min_length=1)
    timestamp: Optional[datetime] = None

class ChatRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=5000)
    session_id: Optional[str] = None
    include_sources: bool = True
    use_external_kb: bool = True
    conversation_history: List[ChatMessage] = []

class Citation(BaseModel):
    """Citation source"""
    source: str  # "internal" or "external"
    document_id: Optional[str] = None
    document_title: Optional[str] = None
    section: Optional[str] = None
    url: Optional[str] = None
    relevance_score: Optional[float] = None
    snippet: Optional[str] = None

class ChatResponse(BaseModel):
    session_id: str
    query: str
    answer: str
    sources: List[Citation] = []
    confidence_score: float = Field(..., ge=0, le=1)
    used_internal_kb: bool
    used_external_kb: bool
    processing_time_ms: float
    timestamp: datetime

# ===== Knowledge Base Models =====

class ChunkMetadata(BaseModel):
    """Chunk metadata"""
    kb_id: str
    doc_id: str
    doc_type: str
    version: str
    section_title: Optional[str] = None
    section_path: Optional[str] = None
    language: str = "en"
    created_at: datetime
    updated_at: datetime
    owner: Optional[str] = None
    tags: List[str] = []
    source_type: str
    source_urls: List[str] = []
    status: str = "active"

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

class KBUpdateRequest(BaseModel):
    """KB update request (for API)"""
    doc_id: Optional[str] = None
    kb_id: str
    title: str
    content: str
    doc_type: str
    tags: List[str] = []
    language: str = "en"
    source_urls: List[str] = []

# ===== Internal Models =====

class RetrievalResult(BaseModel):
    """Retrieval result"""
    chunk_id: str
    content: str
    metadata: ChunkMetadata
    score: float

class ExternalKnowledgeResult(BaseModel):
    """External knowledge result"""
    answer: str
    citations: List[Dict[str, str]]
    raw_response: Dict[str, Any]

class KBUpdatableContent(BaseModel):
    """Content updatable in KB"""
    title: str
    summary: str
    detailed_content: str
    source_type: str
    source_urls: List[str]
    extracted_on: datetime
    applicable_scope: Optional[Dict[str, Any]] = None

# ===== Health Check =====

class HealthStatus(BaseModel):
    status: str
    timestamp: datetime
    components: Dict[str, str]
    version: str

