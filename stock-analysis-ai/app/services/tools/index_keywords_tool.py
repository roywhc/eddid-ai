"""
Index Keywords Tool - Wraps KeywordIndexer as an LLM-callable tool
"""
import logging
from typing import Dict, Any, List, Optional
from app.services.keyword_indexer import KeywordIndexer

logger = logging.getLogger(__name__)


class IndexKeywordsTool:
    """Tool wrapper for keyword indexing"""
    
    def __init__(self):
        """Initialize index keywords tool"""
        self.keyword_indexer = KeywordIndexer()
        logger.info("IndexKeywordsTool initialized")
    
    def execute(
        self,
        keywords: List[str],
        query_id: str,
        perplexity_result_id: Optional[str] = None,
        session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Execute keyword indexing
        
        Args:
            keywords: List of keyword strings to index
            query_id: Query ID for association
            perplexity_result_id: Optional Perplexity result ID for association
            session_id: Optional session ID
        
        Returns:
            Dictionary with indexing results
        """
        try:
            logger.info(f"🔧 TOOL-BASED FLOW: 📝 IndexKeywordsTool.execute called")
            logger.info(f"🔧 TOOL-BASED FLOW:   keywords={len(keywords)}, query_id={query_id}")
            
            # Index keywords
            result = self.keyword_indexer.index_keywords(
                keywords=keywords,
                query_id=query_id,
                perplexity_result_id=perplexity_result_id,
                session_id=session_id
            )
            
            logger.info(
                f"🔧 TOOL-BASED FLOW: ✅ IndexKeywordsTool indexed {len(result.get('indexed_keywords', []))} keywords "
                f"(duplicates: {len(result.get('duplicate_keywords', []))}, invalid: {len(result.get('invalid_keywords', []))})"
            )
            
            return result
        
        except Exception as e:
            logger.error(f"Error in IndexKeywordsTool.execute: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "indexed_keywords": [],
                "invalid_keywords": [],
                "duplicate_keywords": []
            }
