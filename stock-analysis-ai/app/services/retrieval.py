"""Retrieval service for semantic search in vector store"""
import logging
from typing import List, Optional
from langchain_huggingface import HuggingFaceEmbeddings
from app.db.vector_store import get_vector_store_instance
from app.models import RetrievalResult, ChunkMetadata
from app.config import settings

logger = logging.getLogger(__name__)


class RetrievalService:
    """Service for retrieving relevant chunks from vector store"""
    
    def __init__(self):
        """Initialize retrieval service with embeddings and vector store"""
        try:
            self.embeddings = HuggingFaceEmbeddings(model_name=settings.embeddings_model)
        except ImportError as e:
            error_msg = str(e)
            if "sentence_transformers" in error_msg.lower():
                raise ImportError(
                    "sentence-transformers is not installed. Install it with: pip install sentence-transformers==3.0.0"
                ) from e
            raise
        
        # Try to get vector store, but don't fail if it's not available
        try:
            self.vector_store = get_vector_store_instance()
            logger.info(f"RetrievalService initialized with embeddings model: {settings.embeddings_model}")
        except RuntimeError as e:
            logger.warning(f"Vector store not available: {e}. RetrievalService will return empty results.")
            self.vector_store = None
    
    async def retrieve(
        self,
        query: str,
        kb_id: str,
        top_k: int = 5
    ) -> List[RetrievalResult]:
        """
        Retrieve relevant chunks from vector store based on query
        
        Args:
            query: User query string
            kb_id: Knowledge base identifier to filter results
            top_k: Number of top results to return (default: 5)
        
        Returns:
            List of RetrievalResult objects with content, metadata, and relevance scores
        
        Note:
            Returns empty list if vector store is not available or if search fails.
            This allows the system to gracefully fall back to external KB.
        """
        if not query or not query.strip():
            logger.warning("Empty query provided to retrieve()")
            return []
        
        if not kb_id:
            logger.warning("Empty kb_id provided to retrieve()")
            return []
        
        # If vector store is not available, return empty results
        if self.vector_store is None:
            logger.debug("Vector store not available, returning empty results")
            return []
        
        try:
            logger.debug(f"Retrieving chunks for query: {query[:50]}... (kb_id: {kb_id}, top_k: {top_k})")
            
            # Search vector store with kb_id filter
            # Vector store already returns List[RetrievalResult]
            results = await self.vector_store.search(
                query=query,
                top_k=top_k,
                kb_id=kb_id
            )
            
            logger.info(f"Retrieved {len(results)} chunks for query (kb_id: {kb_id})")
            return results
        
        except Exception as e:
            logger.error(f"Error retrieving chunks for query '{query[:50]}...': {e}", exc_info=True)
            # Return empty list instead of raising to allow fallback to external KB
            return []
