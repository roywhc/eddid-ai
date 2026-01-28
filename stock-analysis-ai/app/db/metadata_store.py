from sqlalchemy import create_engine, Column, String, DateTime, Text, Integer, JSON, ForeignKey, CheckConstraint
from sqlalchemy.orm import declarative_base, sessionmaker, Session, relationship
from app.config import settings
from datetime import datetime
from typing import Optional
import logging
import uuid

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
    content = Column(Text, nullable=True)  # Store document content (nullable for existing records)
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
    doc_id = Column(String, nullable=True)  # Link to document if approved

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

class KeywordRecord(Base):
    """Keyword record for indexed keywords"""
    __tablename__ = "keywords"
    
    keyword_id = Column(String, primary_key=True)
    keyword_text = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    usage_count = Column(Integer, default=1, nullable=False)
    last_used_at = Column(DateTime, nullable=True)
    
    # Relationships
    associations = relationship("KeywordAssociationRecord", back_populates="keyword", cascade="all, delete-orphan")
    
    __table_args__ = (
        CheckConstraint('LENGTH(keyword_text) >= 2 AND LENGTH(keyword_text) <= 50', name='keyword_text_length'),
    )

class KeywordAssociationRecord(Base):
    """Association between keywords and queries/Perplexity results"""
    __tablename__ = "keyword_associations"
    
    association_id = Column(String, primary_key=True)
    keyword_id = Column(String, ForeignKey('keywords.keyword_id', ondelete='CASCADE'), nullable=False)
    query_id = Column(String(255), nullable=True)
    perplexity_result_id = Column(String(255), nullable=True)
    session_id = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    keyword = relationship("KeywordRecord", back_populates="associations")
    
    __table_args__ = (
        CheckConstraint('query_id IS NOT NULL OR perplexity_result_id IS NOT NULL', name='at_least_one_reference'),
    )

class ToolCallRecord(Base):
    """Tool call record for tracking tool invocations"""
    __tablename__ = "tool_calls"
    
    tool_call_id = Column(String, primary_key=True)
    query_id = Column(String(255), nullable=False, index=True)
    session_id = Column(String(255), nullable=True, index=True)
    tool_name = Column(String(100), nullable=False, index=True)
    parameters = Column(JSON, nullable=False)
    result = Column(JSON, nullable=True)
    status = Column(String(20), nullable=False, index=True)
    error_message = Column(Text, nullable=True)
    duration_ms = Column(Integer, nullable=False)
    retry_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    __table_args__ = (
        CheckConstraint("status IN ('success', 'failure', 'retry')", name='valid_status'),
        CheckConstraint('duration_ms >= 0', name='non_negative_duration'),
    )

# ===== Database Helper =====

def init_db():
    """Initialize database"""
    logger.info(f"Initializing database: {settings.metadata_db_url}")
    Base.metadata.create_all(bind=engine)
    
    # Migrate existing database: add content column if missing
    try:
        from sqlalchemy import inspect, text
        inspector = inspect(engine)
        
        # Add content column to documents table
        try:
            columns = [col['name'] for col in inspector.get_columns('documents')]
            if 'content' not in columns:
                logger.info("Adding content column to existing documents table...")
                with engine.connect() as conn:
                    conn.execute(text("ALTER TABLE documents ADD COLUMN content TEXT"))
                    conn.commit()
                logger.info("Migration completed: content column added to documents")
        except Exception as e:
            logger.debug(f"Documents table migration check: {e}")
        
        # Add doc_id column to kb_candidates table
        try:
            columns = [col['name'] for col in inspector.get_columns('kb_candidates')]
            if 'doc_id' not in columns:
                logger.info("Adding doc_id column to existing kb_candidates table...")
                with engine.connect() as conn:
                    conn.execute(text("ALTER TABLE kb_candidates ADD COLUMN doc_id TEXT"))
                    conn.commit()
                logger.info("Migration completed: doc_id column added to kb_candidates")
        except Exception as e:
            logger.debug(f"KB candidates table migration check: {e}")
    except Exception as e:
        # Migration might fail if table doesn't exist yet
        logger.debug(f"Migration check: {e}")
    
    logger.info("Database initialized successfully")

def get_db():
    """Dependency for DB session provider"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ===== Keyword Storage Methods =====

def create_keyword(db: Session, keyword_text: str) -> KeywordRecord:
    """
    Create a new keyword record
    
    Args:
        db: Database session
        keyword_text: Keyword text (validated: 2-50 chars)
    
    Returns:
        KeywordRecord instance
    """
    keyword_id = str(uuid.uuid4())
    keyword = KeywordRecord(
        keyword_id=keyword_id,
        keyword_text=keyword_text.strip(),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        usage_count=1
    )
    db.add(keyword)
    return keyword

def get_keyword_by_text(db: Session, keyword_text: str) -> KeywordRecord:
    """
    Get keyword by text (case-insensitive)
    
    Args:
        db: Database session
        keyword_text: Keyword text to search for
    
    Returns:
        KeywordRecord if found, None otherwise
    """
    from sqlalchemy import func
    return db.query(KeywordRecord).filter(
        func.lower(KeywordRecord.keyword_text) == keyword_text.lower().strip()
    ).first()

def update_keyword_usage(db: Session, keyword: KeywordRecord) -> KeywordRecord:
    """
    Update keyword usage count and last_used_at
    
    Args:
        db: Database session
        keyword: KeywordRecord to update
    
    Returns:
        Updated KeywordRecord
    """
    keyword.usage_count += 1
    keyword.last_used_at = datetime.utcnow()
    keyword.updated_at = datetime.utcnow()
    return keyword

def create_keyword_association(
    db: Session,
    keyword_id: str,
    query_id: Optional[str] = None,
    perplexity_result_id: Optional[str] = None,
    session_id: Optional[str] = None
) -> KeywordAssociationRecord:
    """
    Create a keyword association record
    
    Args:
        db: Database session
        keyword_id: Keyword ID
        query_id: Optional query ID
        perplexity_result_id: Optional Perplexity result ID
        session_id: Optional session ID
    
    Returns:
        KeywordAssociationRecord instance
    """
    if not query_id and not perplexity_result_id:
        raise ValueError("At least one of query_id or perplexity_result_id must be provided")
    
    association_id = str(uuid.uuid4())
    association = KeywordAssociationRecord(
        association_id=association_id,
        keyword_id=keyword_id,
        query_id=query_id,
        perplexity_result_id=perplexity_result_id,
        session_id=session_id,
        created_at=datetime.utcnow()
    )
    db.add(association)
    return association

def create_tool_call(
    db: Session,
    query_id: str,
    tool_name: str,
    parameters: dict,
    session_id: Optional[str] = None
) -> ToolCallRecord:
    """
    Create a tool call record
    
    Args:
        db: Database session
        query_id: Query ID for correlation
        tool_name: Name of the tool
        parameters: Tool call parameters (will be stored as JSON)
        session_id: Optional session ID
    
    Returns:
        ToolCallRecord instance
    """
    tool_call_id = str(uuid.uuid4())
    tool_call = ToolCallRecord(
        tool_call_id=tool_call_id,
        query_id=query_id,
        session_id=session_id,
        tool_name=tool_name,
        parameters=parameters,
        status="success",  # Will be updated after execution
        duration_ms=0,  # Will be updated after execution
        created_at=datetime.utcnow()
    )
    db.add(tool_call)
    return tool_call

def update_tool_call_result(
    db: Session,
    tool_call: ToolCallRecord,
    result: Optional[dict] = None,
    status: str = "success",
    error_message: Optional[str] = None,
    duration_ms: int = 0,
    retry_count: int = 0
) -> ToolCallRecord:
    """
    Update tool call with execution result
    
    Args:
        db: Database session
        tool_call: ToolCallRecord to update
        result: Optional result dictionary
        status: Execution status ("success", "failure", "retry")
        error_message: Optional error message
        duration_ms: Execution duration in milliseconds
        retry_count: Number of retries
    
    Returns:
        Updated ToolCallRecord
    """
    tool_call.result = result
    tool_call.status = status
    tool_call.error_message = error_message
    tool_call.duration_ms = duration_ms
    tool_call.retry_count = retry_count
    return tool_call
