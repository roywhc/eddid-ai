"""
Candidate Review Service - Manages candidate review and approval workflow
"""
import logging
from typing import Optional, List
from sqlalchemy.orm import Session

from app.models import KBCandidate, KBUpdateRequest, KBDocument
from app.db.metadata_store import SessionLocal, KBCandidateRecord
from app.services.document_service import DocumentService
from app.services.metrics_service import get_metrics_service

logger = logging.getLogger(__name__)


class CandidateReviewService:
    """Service for managing candidate review and approval"""
    
    def __init__(self):
        """Initialize candidate review service"""
        self.document_service = DocumentService()
        self.metrics = get_metrics_service()
        logger.info("CandidateReviewService initialized")
    
    def get_candidates(
        self,
        kb_id: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[KBCandidate]:
        """
        Get candidates with filters
        
        Args:
            kb_id: Filter by knowledge base ID
            status: Filter by status (default: "pending")
            limit: Maximum number of results
            offset: Offset for pagination
        
        Returns:
            List of KBCandidate
        """
        db = SessionLocal()
        try:
            query = db.query(KBCandidateRecord)
            
            # Apply filters
            if kb_id:
                query = query.filter(KBCandidateRecord.suggested_kb_id == kb_id)
            if status:
                query = query.filter(KBCandidateRecord.status == status)
            else:
                # Default: show pending
                query = query.filter(KBCandidateRecord.status == "pending")
            
            # Order by hit_count descending (most popular first)
            query = query.order_by(KBCandidateRecord.hit_count.desc())
            
            # Pagination
            records = query.offset(offset).limit(limit).all()
            
            # Convert to KBCandidate
            candidates = []
            for record in records:
                candidates.append(KBCandidate(
                    candidate_id=record.candidate_id,
                    original_query=record.original_query,
                    source_type=record.source_type,
                    title=record.title,
                    content=record.content,
                    suggested_kb_id=record.suggested_kb_id,
                    suggested_category=record.suggested_category,
                    external_urls=record.external_urls or [],
                    extracted_on=record.extracted_on,
                    status=record.status,
                    reviewed_by=record.reviewed_by,
                    review_notes=record.review_notes,
                    hit_count=record.hit_count,
                    doc_id=record.doc_id  # Include linked document ID
                ))
            
            return candidates
        
        finally:
            db.close()
    
    async def reimport_candidate(
        self,
        candidate_id: str,
        reviewer: str,
        notes: Optional[str] = None
    ) -> KBDocument:
        """
        Re-import an approved candidate (re-approve to create a new document)
        
        Args:
            candidate_id: Candidate ID
            reviewer: User who is re-importing
            notes: Optional notes
        
        Returns:
            Newly created KBDocument
        
        Raises:
            ValueError: If candidate not found
        """
        db = SessionLocal()
        try:
            # Get candidate
            candidate_record = db.query(KBCandidateRecord).filter(
                KBCandidateRecord.candidate_id == candidate_id
            ).first()
            
            if not candidate_record:
                raise ValueError(f"Candidate not found: {candidate_id}")
            
            logger.info(f"Re-importing candidate: {candidate_id} by {reviewer}")
            
            # Convert to KBUpdateRequest
            request = KBUpdateRequest(
                kb_id=candidate_record.suggested_kb_id,
                title=candidate_record.title,
                content=candidate_record.content,
                doc_type=candidate_record.suggested_category or "external_perplexity",
                tags=[],
                language="en",
                source_type="external_perplexity",
                source_urls=candidate_record.external_urls or []
            )
            
            # Create new document
            document = await self.document_service.create_document(
                request=request,
                created_by=reviewer
            )
            
            # Update candidate to link to new document
            candidate_record.doc_id = document.doc_id
            candidate_record.reviewed_by = reviewer
            if notes:
                candidate_record.review_notes = notes
            
            db.commit()
            logger.info(f"Candidate {candidate_id} re-imported, created document {document.doc_id}")
            
            # Record metrics
            self.metrics.increment_counter("candidates_reimported_total")
            
            return document
        
        except Exception as e:
            db.rollback()
            logger.error(f"Error re-importing candidate: {e}", exc_info=True)
            raise
        
        finally:
            db.close()
    
    async def approve_candidate(
        self,
        candidate_id: str,
        reviewer: str,
        notes: Optional[str] = None
    ) -> KBDocument:
        """
        Approve candidate and convert to document
        
        Args:
            candidate_id: Candidate ID
            reviewer: User who approved the candidate
            notes: Optional review notes
        
        Returns:
            Created KBDocument
        
        Raises:
            ValueError: If candidate not found or already reviewed
        """
        db = SessionLocal()
        try:
            # Get candidate
            candidate_record = db.query(KBCandidateRecord).filter(
                KBCandidateRecord.candidate_id == candidate_id
            ).first()
            
            if not candidate_record:
                raise ValueError(f"Candidate not found: {candidate_id}")
            
            if candidate_record.status != "pending":
                raise ValueError(f"Candidate already reviewed (status: {candidate_record.status})")
            
            logger.info(f"Approving candidate: {candidate_id} by {reviewer}")
            
            # Convert to KBUpdateRequest
            request = KBUpdateRequest(
                kb_id=candidate_record.suggested_kb_id,
                title=candidate_record.title,
                content=candidate_record.content,
                doc_type=candidate_record.suggested_category or "external_perplexity",
                tags=[],
                language="en",
                source_type="external_perplexity",
                source_urls=candidate_record.external_urls or []
            )
            
            # Create document
            document = await self.document_service.create_document(
                request=request,
                created_by=reviewer
            )
            
            # Update candidate status and link to document
            candidate_record.status = "approved"
            candidate_record.reviewed_by = reviewer
            candidate_record.review_notes = notes
            candidate_record.doc_id = document.doc_id  # Link candidate to document
            
            db.commit()
            logger.info(f"Candidate {candidate_id} approved and converted to document {document.doc_id}")
            
            # Record metrics
            self.metrics.increment_counter("candidates_approved_total")
            
            return document
        
        except Exception as e:
            db.rollback()
            logger.error(f"Error approving candidate: {e}", exc_info=True)
            raise
        
        finally:
            db.close()
    
    def reject_candidate(
        self,
        candidate_id: str,
        reviewer: str,
        notes: Optional[str] = None
    ) -> bool:
        """
        Reject candidate
        
        Args:
            candidate_id: Candidate ID
            reviewer: User who rejected the candidate
            notes: Optional rejection notes
        
        Returns:
            True if rejected successfully
        
        Raises:
            ValueError: If candidate not found or already reviewed
        """
        db = SessionLocal()
        try:
            # Get candidate
            candidate_record = db.query(KBCandidateRecord).filter(
                KBCandidateRecord.candidate_id == candidate_id
            ).first()
            
            if not candidate_record:
                raise ValueError(f"Candidate not found: {candidate_id}")
            
            if candidate_record.status != "pending":
                raise ValueError(f"Candidate already reviewed (status: {candidate_record.status})")
            
            logger.info(f"Rejecting candidate: {candidate_id} by {reviewer}")
            
            # Update candidate status
            candidate_record.status = "rejected"
            candidate_record.reviewed_by = reviewer
            candidate_record.review_notes = notes
            
            db.commit()
            logger.info(f"Candidate {candidate_id} rejected")
            
            # Record metrics
            self.metrics.increment_counter("candidates_rejected_total")
            
            return True
        
        except Exception as e:
            db.rollback()
            logger.error(f"Error rejecting candidate: {e}", exc_info=True)
            raise
        
        finally:
            db.close()
    
    async def modify_candidate(
        self,
        candidate_id: str,
        request: KBUpdateRequest,
        reviewer: str,
        notes: Optional[str] = None
    ) -> KBDocument:
        """
        Modify candidate and approve it
        
        Args:
            candidate_id: Candidate ID
            request: Modified KBUpdateRequest
            reviewer: User who modified and approved
            notes: Optional review notes
        
        Returns:
            Created KBDocument
        
        Raises:
            ValueError: If candidate not found or already reviewed
        """
        db = SessionLocal()
        try:
            # Get candidate
            candidate_record = db.query(KBCandidateRecord).filter(
                KBCandidateRecord.candidate_id == candidate_id
            ).first()
            
            if not candidate_record:
                raise ValueError(f"Candidate not found: {candidate_id}")
            
            if candidate_record.status != "pending":
                raise ValueError(f"Candidate already reviewed (status: {candidate_record.status})")
            
            logger.info(f"Modifying and approving candidate: {candidate_id} by {reviewer}")
            
            # Create document with modified content
            document = await self.document_service.create_document(
                request=request,
                created_by=reviewer
            )
            
            # Update candidate status and link to document
            candidate_record.status = "modified"
            candidate_record.reviewed_by = reviewer
            candidate_record.review_notes = notes
            candidate_record.doc_id = document.doc_id  # Link candidate to document
            
            db.commit()
            logger.info(f"Candidate {candidate_id} modified and converted to document {document.doc_id}")
            
            # Record metrics (counts as approved)
            self.metrics.increment_counter("candidates_approved_total", labels={"modified": "true"})
            
            return document
        
        except Exception as e:
            db.rollback()
            logger.error(f"Error modifying candidate: {e}", exc_info=True)
            raise
        
        finally:
            db.close()
