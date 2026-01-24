"""
Document Service - Manages document lifecycle in knowledge base
"""
import logging
import uuid
from typing import Optional, List
from datetime import datetime
from sqlalchemy.orm import Session

from app.models import KBDocument, KBUpdateRequest
from app.db.metadata_store import SessionLocal, DocumentRecord, ChunkRecord
from app.utils.chunking import DocumentChunker
from app.db.vector_store import get_vector_store_instance
from app.config import settings
from app.services.metrics_service import get_metrics_service

logger = logging.getLogger(__name__)


class DocumentService:
    """Service for managing knowledge base documents"""
    
    def __init__(self):
        """Initialize document service"""
        self.chunker = DocumentChunker(
            chunk_size=settings.chunk_size,
            chunk_overlap=settings.chunk_overlap
        )
        self.vector_store = None  # Will be initialized on first use
        self.metrics = get_metrics_service()
        logger.info("DocumentService initialized")
    
    def _get_vector_store(self):
        """Get or initialize vector store"""
        if self.vector_store is None:
            self.vector_store = get_vector_store_instance()
        return self.vector_store
    
    def _generate_doc_id(self) -> str:
        """Generate unique document ID"""
        return f"doc_{uuid.uuid4().hex[:12]}"
    
    def _increment_version(self, current_version: Optional[str]) -> str:
        """
        Increment document version
        
        Args:
            current_version: Current version string (e.g., "1.0.0")
        
        Returns:
            New version string
        """
        if not current_version:
            return "1.0.0"
        
        try:
            parts = current_version.split(".")
            if len(parts) == 3:
                major, minor, patch = map(int, parts)
                patch += 1
                return f"{major}.{minor}.{patch}"
            else:
                # Invalid format, start fresh
                return "1.0.0"
        except (ValueError, AttributeError):
            # Invalid format, start fresh
            return "1.0.0"
    
    async def create_document(self, request: KBUpdateRequest, created_by: str = "system") -> KBDocument:
        """
        Create a new document in the knowledge base
        
        Args:
            request: KBUpdateRequest with document details
            created_by: User who created the document
        
        Returns:
            KBDocument with generated doc_id and chunk count
        
        Raises:
            ValueError: If validation fails
            Exception: If vector store or database operations fail
        """
        # Validate input
        if not request.title or not request.title.strip():
            raise ValueError("Document title cannot be empty")
        if not request.content or not request.content.strip():
            raise ValueError("Document content cannot be empty")
        if len(request.content) > 10 * 1024 * 1024:  # 10MB limit
            raise ValueError("Document content exceeds 10MB limit")
        
        doc_id = self._generate_doc_id()
        version = "1.0.0"
        
        logger.info(f"Creating document: {doc_id} (kb_id: {request.kb_id})")
        
        # Chunk document
        metadata = {
            "doc_type": request.doc_type,
            "version": version,
            "language": request.language,
            "tags": request.tags or [],
            "source_type": request.source_type if request.source_type else "manual",
            "source_urls": request.source_urls or [],
            "created_by": created_by,
            "status": "active"
        }
        
        chunks = self.chunker.chunk_document(
            content=request.content,
            doc_id=doc_id,
            kb_id=request.kb_id,
            metadata=metadata
        )
        
        logger.info(f"Chunked document into {len(chunks)} chunks")
        
        # Generate embeddings and store in vector DB
        vector_store = self._get_vector_store()
        chunk_ids = await vector_store.add_chunks(chunks)
        logger.info(f"Added {len(chunk_ids)} chunks to vector store")
        
        # Save document metadata to database
        db = SessionLocal()
        try:
            # Create document record
            doc_record = DocumentRecord(
                doc_id=doc_id,
                kb_id=request.kb_id,
                title=request.title,
                doc_type=request.doc_type,
                version=version,
                status="active",
                created_by=created_by,
                source_type=request.source_type or "manual",
                source_urls=request.source_urls or [],
                tags=request.tags or [],
                chunk_ids=chunk_ids
            )
            db.add(doc_record)
            
            # Create chunk records
            for chunk, chunk_id in zip(chunks, chunk_ids):
                chunk_metadata = chunk["metadata"]
                chunk_record = ChunkRecord(
                    chunk_id=chunk_id,
                    doc_id=doc_id,
                    kb_id=request.kb_id,
                    doc_type=request.doc_type,
                    version=version,
                    section_title=chunk_metadata.get("section_title"),
                    section_path=chunk_metadata.get("section_path"),
                    language=request.language,
                    owner=created_by,
                    tags=request.tags or [],
                    source_type=request.source_type or "manual",
                    source_urls=request.source_urls or [],
                    status="active"
                )
                db.add(chunk_record)
            
            db.commit()
            logger.info(f"Document {doc_id} created successfully")
            
            # Record metrics
            self.metrics.increment_counter("documents_created_total", labels={"kb_id": request.kb_id, "doc_type": request.doc_type})
            
            # Return KBDocument
            return KBDocument(
                doc_id=doc_id,
                kb_id=request.kb_id,
                title=request.title,
                doc_type=request.doc_type,
                content=request.content,
                version=version,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
                created_by=created_by,
                approved_by=None,
                language=request.language,
                tags=request.tags or [],
                status="active",
                chunks=len(chunks)
            )
        
        except Exception as e:
            db.rollback()
            logger.error(f"Error creating document: {e}", exc_info=True)
            # Attempt to clean up vector store chunks
            try:
                await vector_store.delete_chunks(chunk_ids)
            except Exception as cleanup_error:
                logger.error(f"Error cleaning up vector store chunks: {cleanup_error}")
            raise
        
        finally:
            db.close()
    
    def get_document(self, doc_id: str) -> KBDocument:
        """
        Get document by ID
        
        Args:
            doc_id: Document ID
        
        Returns:
            KBDocument
        
        Raises:
            ValueError: If document not found
        """
        db = SessionLocal()
        try:
            doc_record = db.query(DocumentRecord).filter(
                DocumentRecord.doc_id == doc_id,
                DocumentRecord.status != "deleted"
            ).first()
            
            if not doc_record:
                raise ValueError(f"Document not found: {doc_id}")
            
            # Get chunk count
            chunk_count = db.query(ChunkRecord).filter(
                ChunkRecord.doc_id == doc_id,
                ChunkRecord.status == "active"
            ).count()
            
            # Note: We don't return full content from metadata DB for performance
            # Content should be stored separately or retrieved from source
            # For now, we'll return empty content (can be enhanced later)
            return KBDocument(
                doc_id=doc_record.doc_id,
                kb_id=doc_record.kb_id,
                title=doc_record.title,
                doc_type=doc_record.doc_type,
                content="",  # Content not stored in metadata DB
                version=doc_record.version,
                created_at=doc_record.created_at,
                updated_at=doc_record.updated_at,
                created_by=doc_record.created_by,
                approved_by=doc_record.approved_by,
                language="en",  # Default, can be enhanced
                tags=doc_record.tags or [],
                status=doc_record.status,
                chunks=chunk_count
            )
        
        finally:
            db.close()
    
    async def update_document(
        self,
        doc_id: str,
        request: KBUpdateRequest,
        updated_by: str = "system"
    ) -> KBDocument:
        """
        Update existing document
        
        Args:
            doc_id: Document ID
            request: KBUpdateRequest with updated content
            updated_by: User who updated the document
        
        Returns:
            Updated KBDocument
        
        Raises:
            ValueError: If document not found or validation fails
        """
        # Validate input
        if not request.title or not request.title.strip():
            raise ValueError("Document title cannot be empty")
        if not request.content or not request.content.strip():
            raise ValueError("Document content cannot be empty")
        
        db = SessionLocal()
        try:
            # Get existing document
            doc_record = db.query(DocumentRecord).filter(
                DocumentRecord.doc_id == doc_id,
                DocumentRecord.status != "deleted"
            ).first()
            
            if not doc_record:
                raise ValueError(f"Document not found: {doc_id}")
            
            # Increment version
            new_version = self._increment_version(doc_record.version)
            
            logger.info(f"Updating document: {doc_id} (version: {doc_record.version} -> {new_version})")
            
            # Get existing chunk IDs
            old_chunk_ids = doc_record.chunk_ids or []
            
            # Delete old chunks from vector store
            if old_chunk_ids:
                vector_store = self._get_vector_store()
                await vector_store.delete_chunks(old_chunk_ids)
                logger.info(f"Deleted {len(old_chunk_ids)} old chunks from vector store")
            
            # Mark old chunks as deleted in database
            db.query(ChunkRecord).filter(
                ChunkRecord.doc_id == doc_id
            ).update({"status": "deleted"})
            
            # Re-chunk document
            metadata = {
                "doc_type": request.doc_type,
                "version": new_version,
                "language": request.language,
                "tags": request.tags or [],
                "source_type": request.source_type or doc_record.source_type,
                "source_urls": request.source_urls or doc_record.source_urls or [],
                "created_by": doc_record.created_by,
                "updated_by": updated_by,
                "status": "active"
            }
            
            chunks = self.chunker.chunk_document(
                content=request.content,
                doc_id=doc_id,
                kb_id=request.kb_id,
                metadata=metadata
            )
            
            logger.info(f"Re-chunked document into {len(chunks)} chunks")
            
            # Generate embeddings and store in vector DB
            vector_store = self._get_vector_store()
            chunk_ids = await vector_store.add_chunks(chunks)
            logger.info(f"Added {len(chunk_ids)} new chunks to vector store")
            
            # Update document record
            doc_record.title = request.title
            doc_record.doc_type = request.doc_type
            doc_record.version = new_version
            doc_record.updated_at = datetime.utcnow()
            doc_record.tags = request.tags or []
            doc_record.source_type = request.source_type or doc_record.source_type
            doc_record.source_urls = request.source_urls or doc_record.source_urls or []
            doc_record.chunk_ids = chunk_ids
            
            # Create new chunk records
            for chunk, chunk_id in zip(chunks, chunk_ids):
                chunk_metadata = chunk["metadata"]
                chunk_record = ChunkRecord(
                    chunk_id=chunk_id,
                    doc_id=doc_id,
                    kb_id=request.kb_id,
                    doc_type=request.doc_type,
                    version=new_version,
                    section_title=chunk_metadata.get("section_title"),
                    section_path=chunk_metadata.get("section_path"),
                    language=request.language,
                    owner=doc_record.created_by,
                    tags=request.tags or [],
                    source_type=request.source_type or doc_record.source_type,
                    source_urls=request.source_urls or doc_record.source_urls or [],
                    status="active"
                )
                db.add(chunk_record)
            
            db.commit()
            logger.info(f"Document {doc_id} updated successfully (version: {new_version})")
            
            # Record metrics
            self.metrics.increment_counter("documents_updated_total", labels={"kb_id": request.kb_id, "doc_type": request.doc_type})
            
            # Return updated KBDocument
            return KBDocument(
                doc_id=doc_record.doc_id,
                kb_id=doc_record.kb_id,
                title=doc_record.title,
                doc_type=doc_record.doc_type,
                content=request.content,
                version=new_version,
                created_at=doc_record.created_at,
                updated_at=doc_record.updated_at,
                created_by=doc_record.created_by,
                approved_by=doc_record.approved_by,
                language=request.language,
                tags=doc_record.tags or [],
                status=doc_record.status,
                chunks=len(chunks)
            )
        
        except Exception as e:
            db.rollback()
            logger.error(f"Error updating document: {e}", exc_info=True)
            raise
        
        finally:
            db.close()
    
    async def delete_document(self, doc_id: str) -> bool:
        """
        Delete document (soft delete)
        
        Args:
            doc_id: Document ID
        
        Returns:
            True if deleted successfully
        
        Raises:
            ValueError: If document not found
        """
        db = SessionLocal()
        try:
            doc_record = db.query(DocumentRecord).filter(
                DocumentRecord.doc_id == doc_id,
                DocumentRecord.status != "deleted"
            ).first()
            
            if not doc_record:
                raise ValueError(f"Document not found: {doc_id}")
            
            logger.info(f"Deleting document: {doc_id}")
            
            # Get chunk IDs
            chunk_ids = doc_record.chunk_ids or []
            
            # Delete chunks from vector store
            if chunk_ids:
                vector_store = self._get_vector_store()
                await vector_store.delete_chunks(chunk_ids)
                logger.info(f"Deleted {len(chunk_ids)} chunks from vector store")
            
            # Mark document and chunks as deleted
            doc_record.status = "deleted"
            doc_record.updated_at = datetime.utcnow()
            
            db.query(ChunkRecord).filter(
                ChunkRecord.doc_id == doc_id
            ).update({"status": "deleted"})
            
            db.commit()
            logger.info(f"Document {doc_id} deleted successfully")
            
            # Record metrics
            self.metrics.increment_counter("documents_deleted_total")
            
            return True
        
        except Exception as e:
            db.rollback()
            logger.error(f"Error deleting document: {e}", exc_info=True)
            raise
        
        finally:
            db.close()
    
    def list_documents(
        self,
        kb_id: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[KBDocument]:
        """
        List documents with filters
        
        Args:
            kb_id: Filter by knowledge base ID
            status: Filter by status (default: "active")
            limit: Maximum number of results
            offset: Offset for pagination
        
        Returns:
            List of KBDocument
        """
        db = SessionLocal()
        try:
            query = db.query(DocumentRecord)
            
            # Apply filters
            if kb_id:
                query = query.filter(DocumentRecord.kb_id == kb_id)
            if status:
                query = query.filter(DocumentRecord.status == status)
            else:
                # Default: exclude deleted
                query = query.filter(DocumentRecord.status != "deleted")
            
            # Order by created_at descending
            query = query.order_by(DocumentRecord.created_at.desc())
            
            # Pagination
            records = query.offset(offset).limit(limit).all()
            
            # Convert to KBDocument
            documents = []
            for record in records:
                chunk_count = db.query(ChunkRecord).filter(
                    ChunkRecord.doc_id == record.doc_id,
                    ChunkRecord.status == "active"
                ).count()
                
                documents.append(KBDocument(
                    doc_id=record.doc_id,
                    kb_id=record.kb_id,
                    title=record.title,
                    doc_type=record.doc_type,
                    content="",  # Content not stored in metadata DB
                    version=record.version,
                    created_at=record.created_at,
                    updated_at=record.updated_at,
                    created_by=record.created_by,
                    approved_by=record.approved_by,
                    language="en",  # Default
                    tags=record.tags or [],
                    status=record.status,
                    chunks=chunk_count
                ))
            
            return documents
        
        finally:
            db.close()
