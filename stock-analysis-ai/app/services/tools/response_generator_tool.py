"""
Response Generator Tool - Formats and returns final response to user
This tool must be called to return the final response (mandatory)
"""
import logging
from typing import Dict, Any, List, Optional
from app.models import Citation

logger = logging.getLogger(__name__)


class ResponseGeneratorTool:
    """Tool for generating final response to user"""
    
    def __init__(self):
        """Initialize response generator tool"""
        logger.info("ResponseGeneratorTool initialized")
    
    def execute(
        self,
        response: str,
        sources: Optional[List[Dict[str, Any]]] = None,
        confidence_score: float = 0.8,
        kb_results: Optional[Dict[str, Any]] = None,
        perplexity_results: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Execute response generation
        
        Args:
            response: The final answer text
            sources: Optional list of source citations (from LLM tool call)
            confidence_score: Confidence score (0-1)
            kb_results: Optional KB search results for citation extraction
            perplexity_results: Optional Perplexity search results for citation extraction
        
        Returns:
            Dictionary with formatted response
        """
        try:
            logger.info(f"🔧 TOOL-BASED FLOW: ResponseGeneratorTool.execute: response_length={len(response)}, sources_count={len(sources) if sources else 0}")
            
            # Parse sources into Citation objects if provided
            citations = []
            if sources:
                for source_dict in sources:
                    try:
                        citation = Citation(**source_dict)
                        citations.append(citation)
                    except Exception as e:
                        logger.warning(f"Failed to parse citation: {e}")
            
            # Also extract citations from KB and Perplexity results if provided
            # (This ensures all citations are included even if LLM doesn't pass them in sources)
            if kb_results and kb_results.get("citations"):
                for cit_dict in kb_results["citations"]:
                    try:
                        citation = Citation(**cit_dict)
                        # Avoid duplicates
                        if not any(c.source == citation.source and c.document_id == citation.document_id for c in citations):
                            citations.append(citation)
                    except Exception as e:
                        logger.warning(f"Failed to parse KB citation: {e}")
            
            if perplexity_results and perplexity_results.get("citations"):
                for cit_dict in perplexity_results["citations"]:
                    try:
                        citation = Citation(**cit_dict)
                        # Avoid duplicates
                        if not any(c.source == citation.source and c.url == citation.url for c in citations):
                            citations.append(citation)
                    except Exception as e:
                        logger.warning(f"Failed to parse Perplexity citation: {e}")
            
            logger.info(f"🔧 TOOL-BASED FLOW: ResponseGeneratorTool combined {len(citations)} total citations")
            
            return {
                "success": True,
                "response": response,
                "citations": [c.dict() for c in citations],
                "confidence_score": confidence_score,
                "response_length": len(response)
            }
        
        except Exception as e:
            logger.error(f"Error in ResponseGeneratorTool.execute: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "response": response,
                "citations": [],
                "confidence_score": confidence_score
            }
