"""
Perplexity Tool - Wraps PerplexityService as an LLM-callable tool
"""
import logging
from typing import Dict, Any, Optional
from app.services.external_knowledge import PerplexityService
from app.models import Citation

logger = logging.getLogger(__name__)


class PerplexityTool:
    """Tool wrapper for Perplexity external knowledge search"""
    
    def __init__(self):
        """Initialize Perplexity tool"""
        self.perplexity_service = PerplexityService()
        logger.info("PerplexityTool initialized")
    
    async def execute(
        self,
        query: str,
        additional_context: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Execute Perplexity search
        
        Args:
            query: Search query optimized for external knowledge retrieval
            additional_context: Optional context from internal KB to improve search
        
        Returns:
            Dictionary with results and metadata
        """
        try:
            logger.info(f"🔧 TOOL-BASED FLOW: 🔍 PerplexityTool.execute called")
            logger.info(f"🔧 TOOL-BASED FLOW:   query='{query[:100]}...', has_context={additional_context is not None}")
            
            # Call Perplexity service
            result = await self.perplexity_service.search(
                query=query,
                additional_context=additional_context
            )
            
            logger.info(f"🔧 TOOL-BASED FLOW:   PerplexityService returned answer (length={len(result.answer)}, citations={len(result.citations)})")
            
            # Format result for tool response
            return {
                "success": True,
                "answer": result.answer,
                "citations": [c.dict() for c in result.citations],
                "citation_count": len(result.citations),
                "query_time_ms": result.query_time_ms,
                "query": query
            }
        
        except Exception as e:
            logger.error(f"Error in PerplexityTool.execute: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "answer": "",
                "citations": [],
                "citation_count": 0,
                "query_time_ms": 0,
                "query": query
            }
