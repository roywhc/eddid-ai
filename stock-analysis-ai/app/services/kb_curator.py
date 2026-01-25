"""
KB Curator Service - Candidate Generation for Knowledge Base Updates
"""
import logging
from typing import List, Optional
from datetime import datetime
from uuid import uuid4
from app.models import KBCandidate, Citation, ExternalKnowledgeResult
from app.db.metadata_store import SessionLocal, KBCandidateRecord
from app.config import settings

logger = logging.getLogger(__name__)


class KBCuratorService:
    """Service for generating and managing KB candidate entries"""
    
    def __init__(self):
        """Initialize KB curator service"""
        self.update_enabled = settings.kb_update_enabled
        self.review_required = settings.kb_update_review_required
        logger.info(f"KBCuratorService initialized (enabled: {self.update_enabled}, review_required: {self.review_required})")
    
    def generate_candidate(
        self,
        query: str,
        answer: str,
        citations: List[Citation],
        kb_id: str = "default_kb"
    ) -> Optional[KBCandidate]:
        """
        Generate a candidate entry from external knowledge usage
        
        Args:
            query: Original user query
            answer: Generated answer
            citations: List of citations (should include external citations)
            kb_id: Target knowledge base ID
        
        Returns:
            KBCandidate object or None if generation disabled
        """
        if not self.update_enabled:
            logger.debug("KB update disabled, skipping candidate generation")
            return None
        
        # Filter external citations
        external_citations = [c for c in citations if c.source == "external"]
        
        if not external_citations:
            logger.debug("No external citations, skipping candidate generation")
            return None
        
        # Extract URLs from external citations
        external_urls = [c.url for c in external_citations if c.url]
        
        # Generate title from query (simplified - can be enhanced with LLM)
        title = query[:100] if len(query) <= 100 else query[:97] + "..."
        
        # Create candidate entry
        candidate = KBCandidate(
            candidate_id=str(uuid4()),
            original_query=query,
            source_type="external_perplexity",
            title=title,
            content=answer,
            suggested_kb_id=kb_id,
            suggested_category=None,  # Can be enhanced with classification
            external_urls=external_urls,
            extracted_on=datetime.utcnow(),
            status="pending",
            reviewed_by=None,
            review_notes=None,
            hit_count=1
        )
        
        logger.info(f"Generated candidate entry: {candidate.candidate_id}")
        return candidate
    
    def save_candidate(self, candidate: KBCandidate) -> str:
        """
        Save candidate entry to database
        
        Args:
            candidate: KBCandidate object
        
        Returns:
            Candidate ID
        """
        try:
            session = SessionLocal()
            try:
                # Check if candidate already exists (by query similarity)
                # For Phase 4, we'll do a simple check
                existing = session.query(KBCandidateRecord).filter(
                    KBCandidateRecord.original_query == candidate.original_query,
                    KBCandidateRecord.status == "pending"
                ).first()
                
                if existing:
                    # Update hit count
                    existing.hit_count += 1
                    candidate_id = existing.candidate_id  # Store before closing session
                    logger.debug(f"Updated existing candidate {candidate_id} (hit_count: {existing.hit_count})")
                    session.commit()
                    session.close()
                    return candidate_id
                
                # Create new candidate entry
                db_candidate = KBCandidateRecord(
                    candidate_id=candidate.candidate_id,
                    original_query=candidate.original_query,
                    source_type=candidate.source_type,
                    title=candidate.title,
                    content=candidate.content,
                    suggested_kb_id=candidate.suggested_kb_id,
                    suggested_category=candidate.suggested_category,
                    external_urls=candidate.external_urls,
                    extracted_on=candidate.extracted_on,
                    status=candidate.status,
                    reviewed_by=candidate.reviewed_by,
                    review_notes=candidate.review_notes,
                    hit_count=candidate.hit_count
                )
                
                session.add(db_candidate)
                session.commit()
                logger.info(f"Saved candidate entry: {candidate.candidate_id}")
                return candidate.candidate_id
            finally:
                session.close()
        
        except Exception as e:
            logger.error(f"Error saving candidate: {e}", exc_info=True)
            raise
    
    def generate_and_save_candidate(
        self,
        query: str,
        answer: str,
        citations: List[Citation],
        kb_id: str = "default_kb"
    ) -> Optional[str]:
        """
        Generate and save candidate entry in one step
        
        Args:
            query: Original user query
            answer: Generated answer
            citations: List of citations
            kb_id: Target knowledge base ID
        
        Returns:
            Candidate ID or None
        """
        candidate = self.generate_candidate(query, answer, citations, kb_id)
        if candidate:
            return self.save_candidate(candidate)
        return None
