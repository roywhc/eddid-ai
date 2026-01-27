"""
Knowledge Base Tool - Wraps RetrievalService as an LLM-callable tool
"""
import logging
from typing import Dict, Any, List, Optional
from app.services.retrieval import RetrievalService
from app.models import RetrievalResult, Citation

logger = logging.getLogger(__name__)


class KnowledgeBaseTool:
    """Tool wrapper for knowledge base search"""
    
    def __init__(self):
        """Initialize knowledge base tool"""
        self.retrieval_service = RetrievalService()
        logger.info("KnowledgeBaseTool initialized")
    
    async def execute(
        self,
        query: str,
        kb_id: str = "default",
        top_k: int = 5
    ) -> Dict[str, Any]:
        """
        Execute knowledge base search
        
        Args:
            query: Search query
            kb_id: Knowledge base identifier
            top_k: Number of top results to retrieve
        
        Returns:
            Dictionary with results and metadata
        """
        try:
            logger.info(f"🔧 TOOL-BASED FLOW: 🔍 KnowledgeBaseTool.execute called")
            logger.info(f"🔧 TOOL-BASED FLOW:   query='{query[:100]}...', kb_id={kb_id}, top_k={top_k}")
            
            # Call retrieval service
            logger.info(f"🔧 TOOL-BASED FLOW:   Calling RetrievalService.retrieve() (this is from tool call, NOT old flow)")
            results: List[RetrievalResult] = await self.retrieval_service.retrieve(
                query=query,
                kb_id=kb_id,
                top_k=top_k
            )
            logger.info(f"🔧 TOOL-BASED FLOW:   RetrievalService returned {len(results)} results")
            
            # Format results for tool response
            formatted_results = []
            citations = []
            
            for result in results:
                formatted_results.append({
                    "chunk_id": result.chunk_id,
                    "content": result.content,
                    "score": result.score,
                    "metadata": {
                        "doc_id": result.metadata.doc_id,
                        "kb_id": result.metadata.kb_id,
                        "doc_type": result.metadata.doc_type,
                        "section_title": result.metadata.section_title,
                        "section_path": result.metadata.section_path,
                    }
                })
                
                # Create citation
                citation = Citation(
                    source="internal",
                    document_id=result.metadata.doc_id,
                    document_title=result.metadata.section_title or result.metadata.doc_type,
                    section=result.metadata.section_path,
                    relevance_score=result.score
                )
                citations.append(citation)
            
            return {
                "success": True,
                "results": formatted_results,
                "result_count": len(results),
                "citations": [c.dict() for c in citations],
                "query": query,
                "kb_id": kb_id
            }
        
        except Exception as e:
            logger.error(f"Error in KnowledgeBaseTool.execute: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "results": [],
                "result_count": 0,
                "citations": [],
                "query": query,
                "kb_id": kb_id
            }
