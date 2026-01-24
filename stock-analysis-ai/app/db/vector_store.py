import logging
from typing import Optional, List, Dict, Any
from abc import ABC, abstractmethod
from datetime import datetime

from app.config import settings, VectorStoreType
from app.models import RetrievalResult, ChunkMetadata

logger = logging.getLogger(__name__)

# ===== Abstract Vector Store =====

class VectorStoreBase(ABC):
    """Abstract base for vector store"""
    
    @abstractmethod
    async def add_chunks(self, chunks: List[Dict[str, Any]]) -> List[str]:
        """Add chunks, return chunk IDs"""
        pass
    
    @abstractmethod
    async def search(self, query: str, top_k: int = 5, kb_id: Optional[str] = None) -> List[RetrievalResult]:
        """Semantic search by query string"""
        pass
    
    @abstractmethod
    async def delete_chunks(self, chunk_ids: List[str]) -> bool:
        """Delete chunks"""
        pass
    
    @abstractmethod
    async def health_check(self) -> bool:
        """Health check"""
        pass

# ===== Chroma Implementation =====

class ChromaVectorStore(VectorStoreBase):
    """Chroma vector store implementation"""
    
    def __init__(self):
        try:
            from langchain_chroma import Chroma
        except ImportError as e:
            raise ImportError(
                "langchain_chroma is not installed. Install it with: pip install langchain-chroma>=0.2.0"
            ) from e
        
        try:
            from langchain_huggingface import HuggingFaceEmbeddings
        except ImportError as e:
            raise ImportError(
                "langchain_huggingface is not installed. Install it with: pip install langchain-huggingface>=0.1.0"
            ) from e
        
        try:
            self.embeddings = HuggingFaceEmbeddings(model_name=settings.embeddings_model)
        except ImportError as e:
            error_msg = str(e)
            if "sentence_transformers" in error_msg.lower():
                raise ImportError(
                    "sentence-transformers is not installed. Install it with: pip install sentence-transformers==3.0.0"
                ) from e
            raise
        
        self.client = Chroma(
            collection_name="agentic_kb",
            embedding_function=self.embeddings,
            persist_directory=settings.chroma_persist_dir
        )
        logger.info(f"Chroma collection initialized at {settings.chroma_persist_dir}")
    
    async def add_chunks(self, chunks: List[Dict[str, Any]]) -> List[str]:
        """Add text chunks to vector store"""
        
        texts = [chunk["content"] for chunk in chunks]
        metadatas = [chunk["metadata"] for chunk in chunks]
        ids = [chunk["chunk_id"] for chunk in chunks]
        
        self.client.add_texts(
            texts=texts,
            metadatas=metadatas,
            ids=ids
        )
        
        logger.info(f"Added {len(chunks)} chunks to Chroma")
        return ids
    
    async def search(self, query: str, top_k: int = 5, kb_id: Optional[str] = None) -> List[RetrievalResult]:
        """Execute semantic search by query string"""
        # Use similarity_search_with_score to get relevance scores
        results = self.client.similarity_search_with_score(query, k=top_k)
        
        retrieval_results = []
        for doc, score in results:
            # Filter by kb_id if provided
            metadata = doc.metadata
            if kb_id and metadata.get("kb_id") != kb_id:
                continue
                
            retrieval_results.append(
                RetrievalResult(
                    chunk_id=metadata.get("chunk_id", ""),
                    content=doc.page_content,
                    metadata=ChunkMetadata(**metadata),
                    score=float(score) if score else 0.0
                )
            )
        
        return retrieval_results
    
    async def delete_chunks(self, chunk_ids: List[str]) -> bool:
        """Delete chunks"""
        try:
            self.client.delete(ids=chunk_ids)
            logger.info(f"Deleted {len(chunk_ids)} chunks from Chroma")
            return True
        except Exception as e:
            logger.error(f"Error deleting chunks: {e}")
            return False
    
    async def health_check(self) -> bool:
        """Health check"""
        try:
            count = self.client._collection.count()
            logger.info(f"Chroma health check: {count} chunks in collection")
            return True
        except Exception as e:
            logger.error(f"Chroma health check failed: {e}")
            return False

# ===== PGVector Implementation =====

class PGVectorStore(VectorStoreBase):
    """PGVector vector store implementation"""
    
    def __init__(self):
        try:
            from langchain_postgres.vectorstores import PGVector
        except ImportError as e:
            raise ImportError(
                "langchain_postgres is not installed. Install it with: pip install langchain-postgres"
            ) from e
        
        try:
            from langchain_huggingface import HuggingFaceEmbeddings
        except ImportError as e:
            raise ImportError(
                "langchain_huggingface is not installed. Install it with: pip install langchain-huggingface>=0.1.0"
            ) from e
        
        try:
            self.embeddings = HuggingFaceEmbeddings(model_name=settings.embeddings_model)
        except ImportError as e:
            error_msg = str(e)
            if "sentence_transformers" in error_msg.lower():
                raise ImportError(
                    "sentence-transformers is not installed. Install it with: pip install sentence-transformers==3.0.0"
                ) from e
            raise
        
        self.vector_store = PGVector(
            connection_string=settings.pgvector_url,
            collection_name="agentic_kb",
            embedding_function=self.embeddings
        )
        logger.info("PGVector store initialized")
    
    async def add_chunks(self, chunks: List[Dict[str, Any]]) -> List[str]:
        """Add chunks"""
        ids = []
        for chunk in chunks:
            chunk_ids = self.vector_store.add_texts(
                texts=[chunk["content"]],
                metadatas=[chunk["metadata"]],
                ids=[chunk["chunk_id"]]
            )
            ids.extend(chunk_ids)
        
        logger.info(f"Added {len(chunks)} chunks to PGVector")
        return ids
    
    async def search(self, query: str, top_k: int = 5, kb_id: Optional[str] = None) -> List[RetrievalResult]:
        """Execute semantic search by query string"""
        # Use similarity_search_with_score to get relevance scores
        results = self.vector_store.similarity_search_with_score(query, k=top_k)
        
        retrieval_results = []
        for doc, score in results:
            # Filter by kb_id if provided
            metadata = doc.metadata
            if kb_id and metadata.get("kb_id") != kb_id:
                continue
                
            retrieval_results.append(
                RetrievalResult(
                    chunk_id=metadata.get("chunk_id", ""),
                    content=doc.page_content,
                    metadata=ChunkMetadata(**metadata),
                    score=float(score) if score else 0.0
                )
            )
        
        return retrieval_results
    
    async def delete_chunks(self, chunk_ids: List[str]) -> bool:
        """Delete chunks"""
        try:
            for chunk_id in chunk_ids:
                self.vector_store.delete([chunk_id])
            logger.info(f"Deleted {len(chunk_ids)} chunks from PGVector")
            return True
        except Exception as e:
            logger.error(f"Error deleting chunks: {e}")
            return False
    
    async def health_check(self) -> bool:
        """Health check"""
        try:
            # Try a simple search to verify connection
            results = self.vector_store.similarity_search("test", k=1)
            logger.info("PGVector health check passed")
            return True
        except Exception as e:
            logger.error(f"PGVector health check failed: {e}")
            return False

# ===== Factory =====

def get_vector_store() -> VectorStoreBase:
    """Get vector store instance"""
    if settings.vector_store_type == VectorStoreType.CHROMADB:
        return ChromaVectorStore()
    elif settings.vector_store_type == VectorStoreType.PGVECTOR:
        return PGVectorStore()
    else:
        raise ValueError(f"Unknown vector store type: {settings.vector_store_type}")

# ===== Global Instance =====

_vector_store: Optional[VectorStoreBase] = None

async def init_vector_store():
    """Initialize global vector store"""
    global _vector_store
    _vector_store = get_vector_store()
    health = await _vector_store.health_check()
    if not health:
        logger.warning("Vector store health check failed")
    else:
        logger.info("Vector store initialized successfully")

def get_vector_store_instance() -> VectorStoreBase:
    """Get global vector store instance"""
    if _vector_store is None:
        raise RuntimeError("Vector store not initialized. Call init_vector_store() first.")
    return _vector_store
