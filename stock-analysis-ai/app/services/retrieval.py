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
        # The vector store will auto-initialize on first access
        self.vector_store = None
        try:
            self.vector_store = get_vector_store_instance()
            logger.info(f"RetrievalService initialized with embeddings model: {settings.embeddings_model}")
        except Exception as e:
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
        
        # If vector store is not available, try to initialize it
        if self.vector_store is None:
            try:
                self.vector_store = get_vector_store_instance()
                logger.info("Vector store auto-initialized in retrieve()")
            except Exception as e:
                logger.debug(f"Vector store not available: {e}, returning empty results")
                return []
        
        try:
            from app.config import settings
            
            logger.info(f"RetrievalService.retrieve() called: query='{query}', kb_id={kb_id}, top_k={top_k}")
            logger.info(f"Relevance threshold: {settings.relevance_score_threshold}")
            
            # Generate and log query embedding
            try:
                query_embedding = self.embeddings.embed_query(query)
                logger.info(f"Query embedding generated: dimension={len(query_embedding)}, norm={sum(x*x for x in query_embedding)**0.5:.4f}")
                logger.debug(f"Query embedding (first 10 values): {query_embedding[:10]}")
            except Exception as e:
                logger.warning(f"Could not generate query embedding for logging: {e}")
            
            # Search vector store with kb_id filter
            # Vector store already returns List[RetrievalResult]
            results = await self.vector_store.search(
                query=query,
                top_k=top_k,
                kb_id=kb_id
            )
            
            # Log detailed results
            logger.info(f"Retrieved {len(results)} chunks for query (kb_id: {kb_id})")
            if len(results) > 0:
                logger.info("Retrieved results:")
                for i, result in enumerate(results):
                    logger.info(
                        f"  [{i+1}] chunk_id={result.chunk_id}, doc_id={result.metadata.doc_id}, "
                        f"score={result.score:.4f}, content_preview='{result.content[:80]}...'"
                    )
            else:
                logger.warning(f"No results retrieved for query '{query}' (kb_id: {kb_id})")
                logger.warning("Possible reasons:")
                logger.warning(f"  - No documents indexed with kb_id='{kb_id}'")
                logger.warning(f"  - All results below relevance threshold ({settings.relevance_score_threshold})")
                logger.warning(f"  - Vector store may be empty or not properly initialized")
            
            return results
        
        except Exception as e:
            logger.error(f"Error retrieving chunks for query '{query[:50]}...': {e}", exc_info=True)
            # Return empty list instead of raising to allow fallback to external KB
            return []
