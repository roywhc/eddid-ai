# Agentic AI Knowledge Base System - Complete Implementation Guide
## Single Container Deployment Version (Container-First Design)

**Version**: 1.0  
**Last Updated**: 2026-01-18  
**Target Deployment**: Single Docker Container + External Vector Store  
**Tech Stack**: FastAPI + LangChain v1 + Chroma / pgvector + Perplexity API

---

# Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Environment Setup](#2-environment-setup--dependencies)
3. [Step 1: Core Infrastructure (Foundation Layer)](#step-1-core-infrastructure-foundation-layer)
4. [Step 2: Internal Knowledge Base Setup](#step-2-internal-knowledge-base-setup)
5. [Step 3: Chat API and RAG Query](#step-3-chat-api-and-rag-query)
6. [Step 4: Perplexity Integration (External Knowledge)](#step-4-perplexity-integration-external-knowledge)
7. [Step 5: Knowledge Base Update Pipeline](#step-5-knowledge-base-update-pipeline)
8. [Step 6: Observability & Monitoring](#step-6-observability--monitoring)
9. [Step 7: Production Deployment and Containerization](#step-7-production-deployment-and-containerization)

---

## 1. Architecture Overview

### System Components

```
┌──────────────────────────────────────────────────┐
│         Single Docker Container                  │
├──────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────────┐   ┌──────────────┐            │
│  │  FastAPI     │   │  LangChain   │            │
│  │  Chat API    │   │  RAG Engine  │            │
│  └──────────────┘   └──────────────┘            │
│         │                  │                     │
│  ┌───────────────────────────────────┐           │
│  │   Orchestrator Service            │           │
│  │  - Query Router                   │           │
│  │  - KB Curator Agent               │           │
│  │  - Session Manager                │           │
│  └───────────────────────────────────┘           │
│         │              │              │          │
│         ▼              ▼              ▼          │
│  ┌────────────────────────────────────────┐     │
│  │  Service Layer                         │     │
│  │  - Retrieval Service                   │     │
│  │  - LLM Service                         │     │
│  │  - External Knowledge Service          │     │
│  │  - KB Management Service               │     │
│  └────────────────────────────────────────┘     │
│         │              │              │          │
└─────────┼──────────────┼──────────────┼──────────┘
          │              │              │
          ▼              ▼              ▼
    ┌──────────┐   ┌──────────┐   ┌──────────┐
    │ Chroma   │   │PostgreSQL│   │Perplexity│
    │Vector DB │   │Metadata  │   │Sonar API │
    └──────────┘   └──────────┘   └──────────┘
    (or pgvector)
```

### Data Flow

```
User Query
    │
    ▼
Chat API (FastAPI)
    │
    ▼
Orchestrator (Query Analysis)
    │
    ├─→ Internal KB Retrieval (Chroma/pgvector)
    │      │
    │      ▼
    │   Confidence Score >= Threshold?
    │      │
    │      No ──┐
    │          │
    │          ▼
    │    Perplexity Sonar API
    │          │
    │      ────┘
    │      │
    ▼      ▼
 Fusion (Combine Internal + External)
    │
    ▼
Knowledge Update Trigger
    │
    ├─→ Extract Candidate
    │
    ├─→ Human Review (UI)
    │
    └─→ Update Internal KB
```

---

## 2. Environment Setup & Dependencies

### 2.1 System Requirements

- Python 3.13+
- Docker & Docker Compose
- Git
- 4GB RAM (minimum)
- Internet connection (for Perplexity API and external knowledge sources)

### 2.2 Project Structure

```
agentic-kb-system/
├── app/
│   ├── __init__.py
│   ├── main.py                      # FastAPI application entry point
│   ├── config.py                    # Configuration and environment variables
│   ├── models.py                    # Pydantic model definitions
│   ├── api/
│   │   ├── __init__.py
│   │   ├── chat.py                  # Chat endpoints
│   │   ├── kb_management.py         # KB management endpoints
│   │   └── health.py                # Health check
│   ├── services/
│   │   ├── __init__.py
│   │   ├── retrieval.py             # Vector retrieval service
│   │   ├── llm.py                   # LLM wrapper service
│   │   ├── external_knowledge.py    # Perplexity integration
│   │   ├── kb_curator.py            # KB candidate generation
│   │   └── session.py               # Session management
│   ├── db/
│   │   ├── __init__.py
│   │   ├── vector_store.py          # Vector store initialization
│   │   ├── metadata_store.py        # Metadata DB
│   │   └── cache.py                 # Simple caching layer
│   └── utils/
│       ├── __init__.py
│       ├── logger.py                # Logging configuration
│       ├── validators.py            # Validation utilities
│       └── chunking.py              # Document chunking
│
├── tests/
│   ├── __init__.py
│   ├── test_retrieval.py            # Retrieval tests
│   ├── test_external_knowledge.py   # External knowledge tests
│   ├── test_kb_update.py            # KB update tests
│   └── fixtures/                    # Test data
│
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
│
├── docs/
│   ├── API.md                       # API documentation
│   ├── ARCHITECTURE.md              # Architecture documentation
│   └── DEPLOYMENT.md                # Deployment guide
│
├── requirements.txt
├── .env.example
├── README.md
└── pytest.ini
```

### 2.3 Dependencies List

**requirements.txt**

```
# Core Framework
fastapi==0.115.0
uvicorn[standard]==0.30.0
pydantic==2.8.0
pydantic-settings==2.3.0

# LLM & RAG (LangChain v1)
langchain==1.0.0
langchain-core==0.3.0
langchain-community==0.3.0
langchain-openai==0.2.0
langchain-chroma==0.2.0

# Vector Store & Embeddings
chromadb==0.5.0
sentence-transformers==3.0.0

# External Knowledge Integration
openai==1.40.0
instructor==1.4.0

# Database & Storage
sqlalchemy==2.1.0
psycopg2-binary==2.9.9

# Async & Concurrency
aiohttp==3.10.0
asyncio-contextmanager==1.0.0

# Utilities
python-dotenv==1.0.1
requests==2.32.0
httpx==0.27.0
tenacity==9.0.0

# Logging & Observability
python-json-logger==2.0.7
structlog==24.2.0

# Testing
pytest==8.2.0
pytest-asyncio==0.24.0
pytest-cov==5.0.0
pytest-mock==3.14.0

# Development
black==24.10.0
flake8==7.1.0
mypy==1.13.0
```

### 2.4 Environment Variables (.env)

**`.env.example`**

```bash
# ===== Core Config =====
ENV=development  # development, staging, production
DEBUG=true
LOG_LEVEL=INFO

# ===== API Server =====
API_HOST=0.0.0.0
API_PORT=8000
API_WORKERS=4

# ===== Vector Database =====
VECTOR_STORE_TYPE=chromadb  # chromadb or pgvector
CHROMA_PERSIST_DIR=/data/chroma

# If using pgvector:
# PGVECTOR_HOST=localhost
# PGVECTOR_PORT=5432
# PGVECTOR_USER=postgres
# PGVECTOR_PASSWORD=password
# PGVECTOR_DB=knowledge_base

# ===== Metadata Store =====
METADATA_DB_URL=sqlite:///./data/metadata.db
# OR: postgresql://user:password@localhost/kb_metadata

# ===== Embeddings =====
EMBEDDINGS_MODEL=sentence-transformers/all-MiniLM-L6-v2
OPENAI_API_KEY=your_openai_key_here

# ===== LLM =====
LLM_PROVIDER=openai
LLM_MODEL=gpt-4-turbo-preview
LLM_TEMPERATURE=0.7
OPENAI_API_KEY=your_openai_key

# ===== Perplexity API =====
PERPLEXITY_API_KEY=your_perplexity_key
PERPLEXITY_MODEL=sonar
PERPLEXITY_TIMEOUT=30

# ===== Confidence Thresholds =====
KB_CONFIDENCE_THRESHOLD=0.7
RELEVANCE_SCORE_THRESHOLD=0.5

# ===== KB Update Config =====
KB_UPDATE_ENABLED=true
KB_UPDATE_REVIEW_REQUIRED=true
KB_CANDIDATE_TTL=7

# ===== Security =====
SECRET_KEY=your_secret_key_here
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000

# ===== Session & Cache =====
SESSION_TTL=3600
CACHE_TTL=300
MAX_CACHE_SIZE=1000

# ===== Rate Limiting =====
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60

# ===== Data Retention =====
LOG_RETENTION_DAYS=30
CHAT_HISTORY_RETENTION_DAYS=90
```

---

# Step 1: Core Infrastructure (Foundation Layer)

## Objective

Establish the basic application framework, configuration management, database connections, and logging system.

## 1.1 Config Module

**`app/config.py`**

```python
from pydantic_settings import BaseSettings
from typing import Optional
from enum import Enum
import logging

class Environment(str, Enum):
    DEV = "development"
    STAGING = "staging"
    PROD = "production"

class VectorStoreType(Enum):
    CHROMADB = "chromadb"
    PGVECTOR = "pgvector"

class EmbeddingsType(Enum):
    SENTENCE_TRANSFORMERS = "sentence-transformers"
    OPENAI = "openai"

class Settings(BaseSettings):
    # Core
    env: Environment = Environment.DEV
    debug: bool = True
    log_level: str = "INFO"

    # API Server
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_workers: int = 4
    secret_key: str = "your-secret-key-change-in-prod"
    allowed_origins: list[str] = ["http://localhost:3000"]

    # Vector Store
    vector_store_type: VectorStoreType = VectorStoreType.CHROMADB
    chroma_persist_dir: str = "/tmp/chroma"
    
    # pgvector (if using)
    pgvector_host: Optional[str] = None
    pgvector_port: int = 5432
    pgvector_user: str = "postgres"
    pgvector_password: str = "password"
    pgvector_db: str = "knowledge_base"

    # Metadata DB
    metadata_db_url: str = "sqlite:///./data/metadata.db"

    # Embeddings
    embeddings_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    embeddings_type: EmbeddingsType = EmbeddingsType.SENTENCE_TRANSFORMERS

    # LLM
    llm_provider: str = "openai"
    llm_model: str = "gpt-4-turbo-preview"
    llm_temperature: float = 0.7
    openai_api_key: Optional[str] = None
    azure_openai_api_key: Optional[str] = None

    # Perplexity
    perplexity_api_key: Optional[str] = None
    perplexity_model: str = "sonar"
    perplexity_timeout: int = 30

    # Confidence & Thresholds
    kb_confidence_threshold: float = 0.7
    relevance_score_threshold: float = 0.5
    
    # KB Update
    kb_update_enabled: bool = True
    kb_update_review_required: bool = True
    kb_candidate_ttl: int = 7

    # Session & Cache
    session_ttl: int = 3600
    cache_ttl: int = 300
    max_cache_size: int = 1000

    # Rate Limiting
    rate_limit_enabled: bool = True
    rate_limit_requests: int = 100
    rate_limit_window: int = 60

    # Data Retention
    log_retention_days: int = 30
    chat_history_retention_days: int = 90

    class Config:
        env_file = ".env"
        case_sensitive = False

    @property
    def pgvector_url(self) -> str:
        if self.vector_store_type == VectorStoreType.PGVECTOR:
            return f"postgresql://{self.pgvector_user}:{self.pgvector_password}@{self.pgvector_host}:{self.pgvector_port}/{self.pgvector_db}"
        raise ValueError("pgvector_url only available when using pgvector")

settings = Settings()
logger = logging.getLogger(__name__)
```

## 1.2 Logger Module

**`app/utils/logger.py`**

```python
import logging
import logging.config
from pythonjsonlogger import jsonlogger
from app.config import settings
import sys

def setup_logging():
    """Initialize logging system"""
    
    log_level = getattr(logging, settings.log_level.upper())
    
    config = {
        'version': 1,
        'disable_existing_loggers': False,
        'formatters': {
            'standard': {
                'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            },
            'json': {
                '()': 'pythonjsonlogger.jsonlogger.JsonFormatter',
                'format': '%(asctime)s %(name)s %(levelname)s %(message)s'
            }
        },
        'handlers': {
            'console': {
                'class': 'logging.StreamHandler',
                'level': log_level,
                'formatter': 'json' if settings.env != 'development' else 'standard',
                'stream': sys.stdout
            },
            'file': {
                'class': 'logging.handlers.RotatingFileHandler',
                'level': log_level,
                'formatter': 'json',
                'filename': '/var/log/app/app.log',
                'maxBytes': 10485760,  # 10MB
                'backupCount': 5
            }
        },
        'root': {
            'level': log_level,
            'handlers': ['console', 'file'] if settings.env != 'development' else ['console']
        }
    }
    
    logging.config.dictConfig(config)
    return logging.getLogger(__name__)

logger = setup_logging()
```

## 1.3 Data Models

**`app/models.py`**

```python
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
```

## 1.4 Database Infrastructure

**`app/db/metadata_store.py`** - SQLAlchemy Setup

```python
from sqlalchemy import create_engine, Column, String, DateTime, Text, Integer, JSON
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.config import settings
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# Initialize SQLAlchemy
engine = create_engine(
    settings.metadata_db_url,
    echo=settings.debug,
    pool_pre_ping=True,
    pool_recycle=3600
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ===== ORM Models =====

class DocumentRecord(Base):
    """Document record"""
    __tablename__ = "documents"
    
    doc_id = Column(String, primary_key=True)
    kb_id = Column(String, index=True)
    title = Column(String)
    doc_type = Column(String)
    version = Column(String)
    status = Column(String, default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String)
    approved_by = Column(String, nullable=True)
    source_type = Column(String)
    source_urls = Column(JSON)
    tags = Column(JSON)
    chunk_ids = Column(JSON)

class ChunkRecord(Base):
    """Chunk record"""
    __tablename__ = "chunks"
    
    chunk_id = Column(String, primary_key=True)
    doc_id = Column(String, index=True)
    kb_id = Column(String, index=True)
    doc_type = Column(String)
    version = Column(String)
    section_title = Column(String, nullable=True)
    section_path = Column(String, nullable=True)
    language = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    owner = Column(String, nullable=True)
    tags = Column(JSON)
    source_type = Column(String)
    source_urls = Column(JSON)
    status = Column(String, default="active")

class KBCandidateRecord(Base):
    """KB candidate record"""
    __tablename__ = "kb_candidates"
    
    candidate_id = Column(String, primary_key=True)
    original_query = Column(String)
    source_type = Column(String)
    title = Column(String)
    content = Column(Text)
    suggested_kb_id = Column(String)
    suggested_category = Column(String, nullable=True)
    external_urls = Column(JSON)
    extracted_on = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="pending")
    reviewed_by = Column(String, nullable=True)
    review_notes = Column(Text, nullable=True)
    hit_count = Column(Integer, default=1)

class ChatHistoryRecord(Base):
    """Chat history record"""
    __tablename__ = "chat_history"
    
    message_id = Column(String, primary_key=True)
    session_id = Column(String, index=True)
    user_id = Column(String, nullable=True)
    role = Column(String)
    content = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)
    sources_used = Column(JSON, nullable=True)
    metadata = Column(JSON, nullable=True)

# ===== Database Helper =====

def init_db():
    """Initialize database"""
    logger.info(f"Initializing database: {settings.metadata_db_url}")
    Base.metadata.create_all(bind=engine)
    logger.info("Database initialized successfully")

def get_db() -> Session:
    """Dependency for DB session provider"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

## 1.5 Main FastAPI App

**`app/main.py`**

```python
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
from datetime import datetime

from app.config import settings
from app.utils.logger import setup_logging
from app.db.metadata_store import init_db
from app.api import chat, kb_management, health

logger = logging.getLogger(__name__)

# ===== Lifespan Events =====

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown"""
    
    # Startup
    logger.info("=== Starting Agentic KB System ===")
    logger.info(f"Environment: {settings.env}")
    logger.info(f"Debug: {settings.debug}")
    logger.info(f"Vector Store: {settings.vector_store_type}")
    
    try:
        init_db()
        logger.info("Database initialized")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("=== Shutting down Agentic KB System ===")

# ===== Create App =====

app = FastAPI(
    title="Agentic AI Knowledge Base System",
    description="AI-powered chat with internal KB and Perplexity integration",
    version="1.0.0",
    lifespan=lifespan
)

# ===== CORS Middleware =====

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== Global Exception Handler =====

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "timestamp": datetime.utcnow().isoformat()
        }
    )

# ===== Routes =====

app.include_router(health.router, prefix="/api/v1/health", tags=["health"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["chat"])
app.include_router(kb_management.router, prefix="/api/v1/kb", tags=["knowledge-base"])

# ===== Root Endpoint =====

@app.get("/")
async def root():
    return {
        "name": "Agentic AI Knowledge Base System",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.api_host,
        port=settings.api_port,
        workers=settings.api_workers,
        reload=settings.debug
    )
```

---

# Step 1 Validation Checklist and Test Cases

## Test Cases: TC-INFRA-001 to TC-INFRA-005

### TC-INFRA-001: Configuration Loads Correctly

**Steps**:
1. Create `.env` file with test values
2. Execute Python: `python -c "from app.config import settings; print(settings.env)"`

**Expected Result**: Correctly prints environment value, no errors

**Verification**:
```bash
python -m pytest tests/test_config.py -v
```

### TC-INFRA-002: Logging System Initialization

**Steps**:
1. Start application
2. Check log output

**Expected Result**: Logging correctly initialized, output to console and file

**Verification**:
```bash
python -c "from app.utils.logger import logger; logger.info('Test log'); import os; assert os.path.exists('/var/log/app/app.log')"
```

### TC-INFRA-003: Database Connection

**Steps**:
1. Execute `python -m pytest tests/test_db_connection.py -v`
2. Check if tables are created

**Expected Result**:
- SQLAlchemy connects successfully
- All tables created

**Verification**:
```python
# tests/test_db_connection.py
def test_database_connection():
    from app.db.metadata_store import get_db
    db = next(get_db())
    assert db is not None
    db.close()

def test_tables_created():
    from sqlalchemy import inspect
    from app.db.metadata_store import engine
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    assert "documents" in tables
    assert "chunks" in tables
    assert "kb_candidates" in tables
```

### TC-INFRA-004: FastAPI Application Startup

**Steps**:
1. Execute `uvicorn app.main:app --reload`
2. Visit `http://localhost:8000/`

**Expected Result**:
- Application starts successfully
- Returns JSON formatted response
- Swagger documentation available (`/docs`)

**Verification**:
```bash
curl http://localhost:8000/ | jq .
curl http://localhost:8000/docs  # Should return 200
```

### TC-INFRA-005: Health Check Endpoint

**Steps**:
1. Application running
2. Call `/api/v1/health`

**Expected Result**: Returns health status + timestamp

**Verification**:
```python
# tests/test_health.py
import httpx

def test_health_endpoint():
    client = httpx.Client()
    response = client.get("http://localhost:8000/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["status"] in ["healthy", "degraded", "unhealthy"]
```

---

# Step 2: Internal Knowledge Base Setup

## Objective

Implement vector store initialization, document chunking, embedding, and establish basic retrieval functionality.

## 2.1 Vector Store Initialization

**`app/db/vector_store.py`**

```python
import logging
from typing import Optional, List, Dict, Any
from abc import ABC, abstractmethod
from datetime import datetime

from app.config import settings, VectorStoreType
from app.models import RetrievalResult, ChunkMetadata

logger = logging.getLogger(__name__)

# ===== Abstract Vector Store =====

class VectorStoreBase(ABC):
    """Abstract base for vector store"""
    
    @abstractmethod
    async def add_chunks(self, chunks: List[Dict[str, Any]]) -> List[str]:
        """Add chunks, return chunk IDs"""
        pass
    
    @abstractmethod
    async def search(self, embedding: List[float], top_k: int = 5) -> List[RetrievalResult]:
        """Semantic search"""
        pass
    
    @abstractmethod
    async def delete_chunks(self, chunk_ids: List[str]) -> bool:
        """Delete chunks"""
        pass
    
    @abstractmethod
    async def health_check(self) -> bool:
        """Health check"""
        pass

# ===== Chroma Implementation =====

class ChromaVectorStore(VectorStoreBase):
    """Chroma vector store implementation"""
    
    def __init__(self):
        from langchain_chroma import Chroma
        from langchain_huggingface import HuggingFaceEmbeddings
        
        self.embeddings = HuggingFaceEmbeddings(model_name=settings.embeddings_model)
        self.client = Chroma(
            collection_name="agentic_kb",
            embedding_function=self.embeddings,
            persist_directory=settings.chroma_persist_dir
        )
        logger.info(f"Chroma collection initialized at {settings.chroma_persist_dir}")
    
    async def add_chunks(self, chunks: List[Dict[str, Any]]) -> List[str]:
        """Add text chunks to vector store"""
        
        texts = [chunk["content"] for chunk in chunks]
        metadatas = [chunk["metadata"] for chunk in chunks]
        ids = [chunk["chunk_id"] for chunk in chunks]
        
        self.client.add_texts(
            texts=texts,
            metadatas=metadatas,
            ids=ids
        )
        
        logger.info(f"Added {len(chunks)} chunks to Chroma")
        return ids
    
    async def search(self, embedding: List[float], top_k: int = 5, **filters) -> List[RetrievalResult]:
        """Execute semantic search"""
        results = self.client.similarity_search_by_vector(embedding, k=top_k)
        
        retrieval_results = []
        for result in results:
            retrieval_results.append(
                RetrievalResult(
                    chunk_id=result.metadata.get("chunk_id"),
                    content=result.page_content,
                    metadata=ChunkMetadata(**result.metadata),
                    score=0.0  # Will be set by caller if needed
                )
            )
        
        return retrieval_results
    
    async def delete_chunks(self, chunk_ids: List[str]) -> bool:
        """Delete chunks"""
        try:
            self.client.delete(ids=chunk_ids)
            logger.info(f"Deleted {len(chunk_ids)} chunks from Chroma")
            return True
        except Exception as e:
            logger.error(f"Error deleting chunks: {e}")
            return False
    
    async def health_check(self) -> bool:
        """Health check"""
        try:
            count = self.client._collection.count()
            logger.info(f"Chroma health check: {count} chunks in collection")
            return True
        except Exception as e:
            logger.error(f"Chroma health check failed: {e}")
            return False

# ===== PGVector Implementation =====

class PGVectorStore(VectorStoreBase):
    """PGVector vector store implementation"""
    
    def __init__(self):
        from langchain_postgres.vectorstores import PGVector
        from langchain_huggingface import HuggingFaceEmbeddings
        
        self.embeddings = HuggingFaceEmbeddings(model_name=settings.embeddings_model)
        self.vector_store = PGVector(
            connection_string=settings.pgvector_url,
            collection_name="agentic_kb",
            embedding_function=self.embeddings
        )
        logger.info("PGVector store initialized")
    
    async def add_chunks(self, chunks: List[Dict[str, Any]]) -> List[str]:
        """Add chunks"""
        ids = []
        for chunk in chunks:
            id = self.vector_store.add_texts(
                texts=[chunk["content"]],
                metadatas=[chunk["metadata"]]
            )
            ids.extend(id)
        
        logger.info(f"Added {len(chunks)} chunks to PGVector")
        return ids
    
    async def search(self, embedding: List[float], top_k: int = 5, **filters) -> List[RetrievalResult]:
        """Execute semantic search"""
        results = self.vector_store.similarity_search_by_vector(embedding, k=top_k)
        
        retrieval_results = []
        for result in results:
            retrieval_results.append(
                RetrievalResult(
                    chunk_id=result.metadata.get("chunk_id"),
                    content=result.page_content,
                    metadata=ChunkMetadata(**result.metadata),
                    score=0.0
                )
            )
        
        return retrieval_results
    
    async def delete_chunks(self, chunk_ids: List[str]) -> bool:
        """Delete chunks"""
        try:
            for chunk_id in chunk_ids:
                self.vector_store.delete(chunk_id)
            logger.info(f"Deleted {len(chunk_ids)} chunks from PGVector")
            return True
        except Exception as e:
            logger.error(f"Error deleting chunks: {e}")
            return False
    
    async def health_check(self) -> bool:
        """Health check"""
        try:
            results = self.vector_store.similarity_search_by_vector([0.0] * 384, k=1)
            logger.info("PGVector health check passed")
            return True
        except Exception as e:
            logger.error(f"PGVector health check failed: {e}")
            return False

# ===== Factory =====

def get_vector_store() -> VectorStoreBase:
    """Get vector store instance"""
    if settings.vector_store_type == VectorStoreType.CHROMADB:
        return ChromaVectorStore()
    elif settings.vector_store_type == VectorStoreType.PGVECTOR:
        return PGVectorStore()
    else:
        raise ValueError(f"Unknown vector store type: {settings.vector_store_type}")

# ===== Global Instance =====

_vector_store: Optional[VectorStoreBase] = None

async def init_vector_store():
    """Initialize global vector store"""
    global _vector_store
    _vector_store = get_vector_store()
    health = await _vector_store.health_check()
    if not health:
        logger.warning("Vector store health check failed")

def get_vector_store_instance() -> VectorStoreBase:
    """Get global vector store instance"""
    if _vector_store is None:
        raise RuntimeError("Vector store not initialized")
    return _vector_store
```

## 2.2 Document Chunking Tool

**`app/utils/chunking.py`**

```python
import logging
from typing import List, Dict, Any
from langchain_text_splitters import RecursiveCharacterTextSplitter
from datetime import datetime
import uuid

logger = logging.getLogger(__name__)

class DocumentChunker:
    """Document chunker"""
    
    def __init__(
        self,
        chunk_size: int = 512,
        chunk_overlap: int = 50,
        separators: List[str] | None = None
    ):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.separators = separators or ["\n\n", "\n", ". ", " ", ""]
        
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap,
            separators=self.separators
        )
    
    def chunk_document(
        self,
        content: str,
        doc_id: str,
        kb_id: str,
        metadata: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Split document into chunks
        
        Args:
            content: Document content
            doc_id: Document ID
            kb_id: Knowledge base ID
            metadata: Additional metadata
        
        Returns:
            List of chunks with metadata
        """
        
        splits = self.splitter.split_text(content)
        
        chunks = []
        for i, split_content in enumerate(splits):
            chunk = {
                "chunk_id": f"{doc_id}_{i:04d}_{uuid.uuid4().hex[:6]}",
                "doc_id": doc_id,
                "kb_id": kb_id,
                "content": split_content,
                "metadata": {
                    **metadata,
                    "chunk_index": i,
                    "chunk_size": len(split_content),
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                }
            }
            chunks.append(chunk)
        
        logger.info(f"Chunked document {doc_id} into {len(chunks)} chunks")
        return chunks
    
    def chunk_markdown(
        self,
        content: str,
        doc_id: str,
        kb_id: str,
        metadata: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Special chunking for Markdown documents"""
        
        markdown_splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap,
            separators=["# ", "## ", "### ", "\n\n", "\n", " ", ""]
        )
        
        splits = markdown_splitter.split_text(content)
        return self._create_chunks(splits, doc_id, kb_id, metadata)
    
    def _create_chunks(
        self,
        splits: List[str],
        doc_id: str,
        kb_id: str,
        metadata: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Internal method to create chunks"""
        chunks = []
        for i, split_content in enumerate(splits):
            chunk = {
                "chunk_id": f"{doc_id}_{i:04d}_{uuid.uuid4().hex[:6]}",
                "doc_id": doc_id,
                "kb_id": kb_id,
                "content": split_content,
                "metadata": {
                    **metadata,
                    "chunk_index": i,
                    "chunk_size": len(split_content),
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                }
            }
            chunks.append(chunk)
        return chunks
```

---

# Step 2 Validation Checklist and Test Cases

### TC-KB-001: Vector Store Connection

```python
# tests/test_vector_store.py
import pytest

@pytest.mark.asyncio
async def test_vector_store_initialization():
    from app.db.vector_store import get_vector_store_instance
    from app.db.vector_store import init_vector_store
    
    await init_vector_store()
    vector_store = get_vector_store_instance()
    assert vector_store is not None
    
    health = await vector_store.health_check()
    assert health is True
```

### TC-KB-002: Document Chunking

```python
def test_document_chunking():
    from app.utils.chunking import DocumentChunker
    
    chunker = DocumentChunker(chunk_size=256, chunk_overlap=25)
    content = "This is a test document. " * 50
    
    chunks = chunker.chunk_document(
        content=content,
        doc_id="test_doc_001",
        kb_id="kb_001",
        metadata={"doc_type": "test"}
    )
    
    assert len(chunks) > 1
    assert all("chunk_id" in c for c in chunks)
    assert all(len(c["content"]) <= 512 + 50 for c in chunks)
```

### TC-KB-003: Document Addition

```python
@pytest.mark.asyncio
async def test_add_document():
    from app.services.kb_manager import KBManager
    
    manager = KBManager()
    doc = await manager.add_document(
        kb_id="kb_001",
        title="Test Document",
        content="This is a test document.",
        doc_type="internal_policy",
        created_by="test_user",
        tags=["test", "example"]
    )
    
    assert doc.doc_id is not None
    assert doc.chunks > 0
    assert doc.status == "active"
```

---

# Step 3: Chat API and RAG Query

## 3.1 Retrieval Service

**`app/services/retrieval.py`**

```python
import logging
from typing import List
from langchain_huggingface import HuggingFaceEmbeddings
from app.db.vector_store import get_vector_store_instance
from app.models import RetrievalResult
from app.config import settings

logger = logging.getLogger(__name__)

class RetrievalService:
    """Retrieval service"""
    
    def __init__(self):
        self.embeddings = HuggingFaceEmbeddings(model_name=settings.embeddings_model)
        self.vector_store = get_vector_store_instance()
    
    async def retrieve(
        self,
        query: str,
        kb_id: str,
        top_k: int = 5
    ) -> List[RetrievalResult]:
        """Execute retrieval"""
        
        query_embedding = self.embeddings.embed_query(query)
        
        results = await self.vector_store.search(
            embedding=query_embedding,
            top_k=top_k,
            where={"kb_id": kb_id}
        )
        
        return results
```

## 3.2 Chat Endpoint

**`app/api/chat.py`**

```python
from fastapi import APIRouter
from app.models import ChatRequest, ChatResponse
from datetime import datetime
import time

router = APIRouter()

@router.post("/query")
async def chat_query(request: ChatRequest) -> ChatResponse:
    """User chat query endpoint"""
    
    start_time = time.time()
    
    # Implement RAG logic...
    # 1. Retrieve from internal KB
    # 2. Generate answer
    # 3. Check confidence
    # 4. Query Perplexity if needed
    
    processing_time = (time.time() - start_time) * 1000
    
    return ChatResponse(
        session_id=request.session_id or "new",
        query=request.query,
        answer="Answer from KB or Perplexity",
        sources=[],
        confidence_score=0.8,
        used_internal_kb=True,
        used_external_kb=False,
        processing_time_ms=processing_time,
        timestamp=datetime.utcnow()
    )
```

---

# Step 4: Perplexity Integration

## 4.1 External Knowledge Service

**`app/services/external_knowledge.py`**

```python
import logging
from typing import Optional
from openai import AsyncOpenAI
from app.config import settings
from app.models import ExternalKnowledgeResult

logger = logging.getLogger(__name__)

class PerplexityService:
    """Perplexity Sonar API integration"""
    
    def __init__(self):
        self.client = AsyncOpenAI(
            api_key=settings.perplexity_api_key,
            base_url="https://api.perplexity.ai"
        )
        self.model = settings.perplexity_model
    
    async def search(
        self,
        query: str,
        additional_context: Optional[str] = None
    ) -> ExternalKnowledgeResult:
        """Search using Perplexity Sonar API"""
        
        system_prompt = "You are a helpful assistant. Provide accurate, cited answers."
        
        user_message = query
        if additional_context:
            user_message = f"{query}\n\nContext: {additional_context}"
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                temperature=settings.llm_temperature,
                timeout=settings.perplexity_timeout
            )
            
            answer = response.choices[0].message.content
            citations = self._extract_citations(response)
            
            logger.info(f"Perplexity search completed for query: {query[:50]}")
            
            return ExternalKnowledgeResult(
                answer=answer,
                citations=citations,
                raw_response=response.model_dump()
            )
        
        except Exception as e:
            logger.error(f"Perplexity API error: {e}")
            raise
    
    def _extract_citations(self, response) -> list:
        """Extract citations from Perplexity response"""
        citations = []
        if hasattr(response, 'citations'):
            citations = response.citations
        return citations
```

---

# Step 5: Knowledge Base Update Pipeline

## 5.1 KB Curator Agent

**`app/services/kb_curator.py`**

```python
import logging
from typing import Optional, List
from datetime import datetime
import uuid

from app.models import KBCandidate
from app.db.metadata_store import SessionLocal, KBCandidateRecord

logger = logging.getLogger(__name__)

class KBCuratorAgent:
    """Knowledge base curator agent"""
    
    def __init__(self):
        self.db = SessionLocal()
    
    async def create_candidate(
        self,
        original_query: str,
        external_answer: str,
        external_urls: List[str],
        kb_id: str,
        source_type: str = "external_perplexity"
    ) -> str:
        """Create candidate entry from external answer"""
        
        candidate_id = f"candidate_{uuid.uuid4().hex[:12]}"
        title = self._generate_title(original_query)
        
        candidate = KBCandidateRecord(
            candidate_id=candidate_id,
            original_query=original_query,
            source_type=source_type,
            title=title,
            content=external_answer,
            suggested_kb_id=kb_id,
            external_urls=external_urls,
            extracted_on=datetime.utcnow(),
            status="pending",
            hit_count=1
        )
        
        self.db.add(candidate)
        self.db.commit()
        
        logger.info(f"Created KB candidate {candidate_id}")
        return candidate_id
    
    def _generate_title(self, query: str) -> str:
        """Generate concise title from query"""
        return query[:50] + ("..." if len(query) > 50 else "")
    
    async def get_pending_candidates(self, kb_id: str, limit: int = 10) -> List[KBCandidate]:
        """Get pending candidate entries"""
        records = self.db.query(KBCandidateRecord).filter(
            KBCandidateRecord.suggested_kb_id == kb_id,
            KBCandidateRecord.status == "pending"
        ).limit(limit).all()
        
        return [
            KBCandidate(
                candidate_id=r.candidate_id,
                original_query=r.original_query,
                source_type=r.source_type,
                title=r.title,
                content=r.content,
                suggested_kb_id=r.suggested_kb_id,
                external_urls=r.external_urls or [],
                extracted_on=r.extracted_on,
                status=r.status,
                hit_count=r.hit_count
            )
            for r in records
        ]
```

---

# Step 6: Observability & Monitoring

## 6.1 Health Check Endpoint

**`app/api/health.py`**

```python
from fastapi import APIRouter
from datetime import datetime
from app.models import HealthStatus
from app.db.vector_store import get_vector_store_instance
from app.db.metadata_store import SessionLocal

router = APIRouter()

@router.get("/")
async def health_check() -> HealthStatus:
    """Application health check"""
    
    components = {}
    
    # Check vector store
    try:
        vector_store = get_vector_store_instance()
        health = await vector_store.health_check()
        components["vector_db"] = "healthy" if health else "unhealthy"
    except Exception as e:
        components["vector_db"] = f"error: {str(e)}"
    
    # Check metadata DB
    try:
        db = SessionLocal()
        db.execute("SELECT 1")
        db.close()
        components["metadata_db"] = "healthy"
    except Exception as e:
        components["metadata_db"] = f"error: {str(e)}"
    
    status = "healthy"
    if any("error" in str(v) for v in components.values()):
        status = "degraded"
    
    return HealthStatus(
        status=status,
        timestamp=datetime.utcnow(),
        components=components,
        version="1.0.0"
    )
```

---

# Step 7: Production Deployment and Containerization

## 7.1 Dockerfile

**`docker/Dockerfile`**

```dockerfile
FROM python:3.13-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create log directory
RUN mkdir -p /var/log/app /data/chroma

# Create non-root user
RUN useradd -m appuser && chown -R appuser:appuser /app /var/log/app /data/chroma

USER appuser

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 7.2 Docker Compose

**`docker/docker-compose.yml`**

```yaml
version: '3.9'

services:
  
  # PostgreSQL (Optional, for pgvector and metadata)
  postgres:
    image: postgres:16-alpine
    container_name: kb-postgres
    environment:
      POSTGRES_USER: ${PGVECTOR_USER:-postgres}
      POSTGRES_PASSWORD: ${PGVECTOR_PASSWORD:-password}
      POSTGRES_DB: ${PGVECTOR_DB:-knowledge_base}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # FastAPI Application (Main Application)
  app:
    build:
      context: ..
      dockerfile: docker/Dockerfile
    container_name: kb-app
    environment:
      ENV: ${ENV:-development}
      DEBUG: ${DEBUG:-true}
      API_HOST: 0.0.0.0
      API_PORT: 8000
      VECTOR_STORE_TYPE: ${VECTOR_STORE_TYPE:-chromadb}
      CHROMA_PERSIST_DIR: /data/chroma
      PGVECTOR_HOST: postgres
      PGVECTOR_PORT: 5432
      PGVECTOR_USER: ${PGVECTOR_USER:-postgres}
      PGVECTOR_PASSWORD: ${PGVECTOR_PASSWORD:-password}
      PGVECTOR_DB: ${PGVECTOR_DB:-knowledge_base}
      METADATA_DB_URL: postgresql://${PGVECTOR_USER:-postgres}:${PGVECTOR_PASSWORD:-password}@postgres:5432/knowledge_base
      EMBEDDINGS_MODEL: sentence-transformers/all-MiniLM-L6-v2
      LLM_MODEL: gpt-4-turbo-preview
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      PERPLEXITY_API_KEY: ${PERPLEXITY_API_KEY}
      PERPLEXITY_MODEL: sonar
      KB_CONFIDENCE_THRESHOLD: 0.7
      ALLOWED_ORIGINS: http://localhost:3000,http://localhost:8000
    ports:
      - "8000:8000"
    volumes:
      - ./app:/app/app
      - chroma_data:/data/chroma
      - app_logs:/var/log/app
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:
  chroma_data:
  app_logs:

networks:
  default:
    name: kb-network
```

---

## Deployment Steps

```bash
# 1. Prepare environment
cp .env.example .env
# Edit .env, fill in API keys, etc.

# 2. Build and start
docker-compose up -d --build

# 3. Initialize database
docker-compose exec app python -c "from app.db.metadata_store import init_db; init_db()"

# 4. Check health status
curl http://localhost:8000/api/v1/health

# 5. Access Swagger documentation
# Navigate to http://localhost:8000/docs
```

---

## Complete Test Checklist

### Integration Tests

```bash
# Run all tests
pytest tests/ -v --cov=app --cov-report=html

# Run specific test suites
pytest tests/test_retrieval.py -v
pytest tests/test_external_knowledge.py -v
pytest tests/test_kb_update.py -v
```

### Performance Testing

```bash
# Install locust for load testing
pip install locust

# Run load test
locust -f locustfile.py --host=http://localhost:8000
```

---

## Next Steps

1. **Complete Step 3**: Implement full RAG logic, LLM calling, and confidence scoring
2. **Complete Step 4**: Implement Perplexity API integration, external knowledge retrieval, and candidate generation
3. **Complete Step 5**: Implement KB update pipeline, human review UI, and automated updates
4. **Complete Step 6**: Implement full logging, metrics, and observability
5. **Complete Step 7**: Containerization, performance optimization, and production deployment

---

## Support and Contact

- For issues, check `/docs/ARCHITECTURE.md` and `/docs/DEPLOYMENT.md`
- Code examples: Full test cases in `/tests/` directory
- API Documentation: Navigate to `http://localhost:8000/docs` when running

