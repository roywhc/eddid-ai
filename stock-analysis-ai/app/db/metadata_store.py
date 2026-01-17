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
    message_metadata = Column(JSON, nullable=True)  # Renamed from 'metadata' (SQLAlchemy reserved)

# ===== Database Helper =====

def init_db():
    """Initialize database"""
    logger.info(f"Initializing database: {settings.metadata_db_url}")
    Base.metadata.create_all(bind=engine)
    logger.info("Database initialized successfully")

def get_db():
    """Dependency for DB session provider"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

