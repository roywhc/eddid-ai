"""
Keyword Indexer Service
Handles keyword extraction, validation, and indexing from Perplexity results
"""
import logging
from typing import List, Dict, Any, Optional, Tuple
from contextlib import contextmanager
from app.services.tool_validator import ToolValidator
from app.db.metadata_store import (
    SessionLocal,
    create_keyword,
    get_keyword_by_text,
    update_keyword_usage,
    create_keyword_association
)
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


@contextmanager
def get_db_session():
    """Get database session context manager"""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


class KeywordIndexer:
    """Service for indexing keywords from Perplexity results"""
    
    def __init__(self):
        """Initialize keyword indexer"""
        self.validator = ToolValidator()
        logger.info("KeywordIndexer initialized")
    
    def validate_keyword(self, keyword: str) -> Tuple[bool, Optional[str]]:
        """
        Validate a keyword
        
        Args:
            keyword: Keyword string to validate
        
        Returns:
            Tuple of (is_valid, error_message)
        """
        return self.validator.validate_keyword(keyword)
    
    def index_keywords(
        self,
        keywords: List[str],
        query_id: Optional[str] = None,
        perplexity_result_id: Optional[str] = None,
        session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Index keywords from Perplexity results
        
        Args:
            keywords: List of keyword strings to index
            query_id: Optional query ID for association
            perplexity_result_id: Optional Perplexity result ID for association
            session_id: Optional session ID
        
        Returns:
            Dictionary with indexing results
        """
        if not keywords:
            return {
                "success": True,
                "indexed_keywords": [],
                "invalid_keywords": [],
                "duplicate_keywords": []
            }
        
        indexed_keywords = []
        invalid_keywords = []
        duplicate_keywords = []
        
        try:
            with get_db_session() as db:
                for keyword in keywords:
                    # Validate keyword
                    is_valid, error = self.validate_keyword(keyword)
                    if not is_valid:
                        logger.debug(f"Invalid keyword rejected: {keyword} - {error}")
                        invalid_keywords.append({"keyword": keyword, "error": error})
                        continue
                    
                    keyword_text = keyword.strip()
                    
                    # Check if keyword already exists (case-insensitive)
                    existing_keyword = get_keyword_by_text(db, keyword_text)
                    
                    if existing_keyword:
                        # Update usage count
                        updated_keyword = update_keyword_usage(db, existing_keyword)
                        keyword_id = updated_keyword.keyword_id
                        duplicate_keywords.append(keyword_text)
                        logger.debug(f"Updated existing keyword: {keyword_text} (usage_count={updated_keyword.usage_count})")
                    else:
                        # Create new keyword
                        new_keyword = create_keyword(db, keyword_text)
                        keyword_id = new_keyword.keyword_id
                        logger.debug(f"Created new keyword: {keyword_text}")
                    
                    # Create association
                    try:
                        create_keyword_association(
                            db=db,
                            keyword_id=keyword_id,
                            query_id=query_id,
                            perplexity_result_id=perplexity_result_id,
                            session_id=session_id
                        )
                        indexed_keywords.append(keyword_text)
                    except Exception as e:
                        logger.error(f"Failed to create keyword association for {keyword_text}: {e}", exc_info=True)
                        # Continue with other keywords even if association fails
                
                logger.info(
                    f"Keyword indexing completed: "
                    f"{len(indexed_keywords)} indexed, "
                    f"{len(duplicate_keywords)} duplicates, "
                    f"{len(invalid_keywords)} invalid"
                )
                
                return {
                    "success": True,
                    "indexed_keywords": indexed_keywords,
                    "invalid_keywords": invalid_keywords,
                    "duplicate_keywords": duplicate_keywords,
                    "total_processed": len(keywords)
                }
        
        except Exception as e:
            logger.error(f"Error indexing keywords: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "indexed_keywords": indexed_keywords,
                "invalid_keywords": invalid_keywords,
                "duplicate_keywords": duplicate_keywords,
                "total_processed": len(keywords)
            }
    
    def get_keywords_for_query(self, query: str, limit: int = 10) -> List[str]:
        """
        Retrieve relevant keywords for a query to enhance KB search
        
        Args:
            query: User query string
            limit: Maximum number of keywords to return
        
        Returns:
            List of keyword strings
        """
        # Extract key terms from query (simple implementation)
        # In future, could use NLP to extract entities/concepts
        query_terms = query.lower().split()
        
        # Filter out generic words
        from app.services.tool_validator import GENERIC_WORDS
        key_terms = [term for term in query_terms if term not in GENERIC_WORDS and len(term) >= 2]
        
        try:
            with get_db_session() as db:
                from sqlalchemy import func
                from app.db.metadata_store import KeywordRecord
                
                # Search for keywords matching query terms (case-insensitive, partial match)
                matching_keywords = []
                for term in key_terms[:5]:  # Limit to first 5 terms
                    keywords = db.query(KeywordRecord).filter(
                        func.lower(KeywordRecord.keyword_text).contains(term.lower())
                    ).order_by(
                        KeywordRecord.usage_count.desc(),
                        KeywordRecord.last_used_at.desc()
                    ).limit(limit).all()
                    
                    for kw in keywords:
                        if kw.keyword_text not in matching_keywords:
                            matching_keywords.append(kw.keyword_text)
                
                logger.debug(f"Retrieved {len(matching_keywords)} keywords for query: {query[:50]}")
                return matching_keywords[:limit]
        
        except Exception as e:
            logger.error(f"Error retrieving keywords for query: {e}", exc_info=True)
            return []
