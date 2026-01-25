import logging
import os
import json
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
    
    @abstractmethod
    async def get_stats(self) -> Dict[str, Any]:
        """Get vector store statistics"""
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
        
        # Ensure persist directory exists with proper permissions
        # Always use path relative to project root (where this file is located)
        logger.info(f"Initializing ChromaVectorStore with chroma_persist_dir from config: '{settings.chroma_persist_dir}'")
        
        # Determine project root: go up from app/db/vector_store.py to stock-analysis-ai
        # __file__ is this file: stock-analysis-ai/app/db/vector_store.py
        # Project root is: stock-analysis-ai/
        current_file = os.path.abspath(__file__)
        logger.info(f"Current file location: {current_file}")
        # Go up: app/db/vector_store.py -> app/db -> app -> stock-analysis-ai
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(current_file)))
        logger.info(f"Project root determined: {project_root}")
        
        # Always resolve relative to project root, regardless of config value
        # Extract the relative portion from config (e.g., "./data/chroma" or "data/chroma")
        config_path = settings.chroma_persist_dir
        
        # If config has absolute path, extract just the relative portion
        if os.path.isabs(config_path):
            # Check if it's a problematic system path (like Program Files/Git)
            if 'Program Files' in config_path or 'Program Files (x86)' in config_path:
                logger.warning(f"Config has absolute path pointing to system directory: '{config_path}'. Using default relative path instead.")
                config_path = "./data/chroma"
            else:
                # For other absolute paths, try to extract relative portion
                # If it ends with /data/chroma or data/chroma, use that
                if config_path.endswith('/data/chroma') or config_path.endswith('\\data\\chroma'):
                    config_path = "./data/chroma"
                else:
                    logger.warning(f"Config has absolute path: '{config_path}'. Using default relative path for portability.")
                    config_path = "./data/chroma"
        
        # Handle Unix-style absolute paths on Windows (starting with /)
        if config_path.startswith('/') and os.name == 'nt':  # Windows
            logger.warning(f"Config path '{config_path}' starts with '/', treating as relative to project root")
            # Remove leading slash and treat as relative
            config_path = config_path.lstrip('/')
            # Ensure it starts with ./ if it doesn't already
            if not config_path.startswith('./'):
                config_path = './' + config_path
        
        # Resolve relative to project root
        persist_dir = os.path.join(project_root, config_path)
        logger.info(f"Resolved chroma_persist_dir: '{settings.chroma_persist_dir}' -> '{persist_dir}' (project_root: {project_root})")
        
        # Normalize the path (resolve .. and .)
        persist_dir = os.path.normpath(persist_dir)
        logger.info(f"Final normalized persist_dir: {persist_dir}")
        
        try:
            os.makedirs(persist_dir, exist_ok=True)
            # On Windows, ensure directory is writable
            if os.name == 'nt':  # Windows
                # Test write permissions
                test_file = os.path.join(persist_dir, '.write_test')
                try:
                    with open(test_file, 'w') as f:
                        f.write('test')
                    os.remove(test_file)
                except (IOError, OSError) as e:
                    logger.warning(f"Cannot write to {persist_dir}: {e}. Trying alternative location.")
                    # Try using project root with a different subdirectory
                    # Re-determine project root (in case we're in a different context)
                    current_file = os.path.abspath(__file__)
                    project_root = os.path.dirname(os.path.dirname(os.path.dirname(current_file)))
                    fallback_dir = os.path.join(project_root, 'data', 'chroma')
                    logger.info(f"Trying fallback directory: {fallback_dir} (project_root: {project_root})")
                    try:
                        os.makedirs(fallback_dir, exist_ok=True)
                        # Test the fallback
                        test_file = os.path.join(fallback_dir, '.write_test')
                        with open(test_file, 'w') as f:
                            f.write('test')
                        os.remove(test_file)
                        persist_dir = fallback_dir
                        logger.info(f"Using fallback persist directory: {persist_dir}")
                    except (IOError, OSError) as fallback_error:
                        # Last resort: use temp directory
                        import tempfile
                        persist_dir = os.path.join(tempfile.gettempdir(), 'agentic_kb_chroma')
                        os.makedirs(persist_dir, exist_ok=True)
                        logger.info(f"Using temp directory as persist directory: {persist_dir}")
        except (OSError, PermissionError) as e:
            logger.error(f"Failed to create/access persist directory {persist_dir}: {e}")
            raise RuntimeError(f"Cannot access vector store directory: {e}") from e
        
        self.client = Chroma(
            collection_name="agentic_kb",
            embedding_function=self.embeddings,
            persist_directory=persist_dir
        )
        logger.info(f"Chroma collection initialized at {persist_dir}")
    
    async def add_chunks(self, chunks: List[Dict[str, Any]]) -> List[str]:
        """Add text chunks to vector store"""
        
        texts = [chunk["content"] for chunk in chunks]
        ids = [chunk["chunk_id"] for chunk in chunks]
        
        # Filter complex metadata (lists, dicts) to simple types only
        # ChromaDB only accepts str, int, float, bool, None, or SparseVector
        def filter_metadata(metadata: Dict[str, Any]) -> Dict[str, Any]:
            """Filter metadata to only include simple types"""
            filtered = {}
            for key, value in metadata.items():
                if value is None:
                    filtered[key] = None
                elif isinstance(value, (str, int, float, bool)):
                    filtered[key] = value
                elif isinstance(value, list):
                    # Convert lists to comma-separated strings
                    if len(value) > 0 and all(isinstance(item, str) for item in value):
                        filtered[key] = ", ".join(value)
                    elif len(value) > 0:
                        # For non-string lists, convert to JSON string
                        filtered[key] = json.dumps(value)
                    else:
                        # Empty list - skip or set to empty string
                        filtered[key] = ""
                elif isinstance(value, dict):
                    # Convert dicts to JSON strings
                    filtered[key] = json.dumps(value)
                else:
                    # Convert other types to strings
                    filtered[key] = str(value)
            return filtered
        
        metadatas = [filter_metadata(chunk["metadata"]) for chunk in chunks]
        
        self.client.add_texts(
            texts=texts,
            metadatas=metadatas,
            ids=ids
        )
        
        logger.info(f"Added {len(chunks)} chunks to Chroma")
        return ids
    
    async def search(self, query: str, top_k: int = 5, kb_id: Optional[str] = None) -> List[RetrievalResult]:
        """Execute semantic search by query string"""
        from app.config import settings
        
        # Log query and parameters
        logger.info(f"Vector store search: query='{query[:100]}...', top_k={top_k}, kb_id={kb_id}, relevance_threshold={settings.relevance_score_threshold}")
        
        # Generate query embedding for logging (if possible)
        try:
            query_embedding = self.embeddings.embed_query(query)
            logger.debug(f"Query embedding generated: shape={len(query_embedding)}, first_5_values={query_embedding[:5]}")
        except Exception as e:
            logger.debug(f"Could not generate query embedding for logging: {e}")
        
        # Use similarity_search_with_score to get relevance scores
        # Request more results to account for kb_id filtering
        search_k = top_k * 3 if kb_id else top_k  # Get more results if filtering by kb_id
        results = self.client.similarity_search_with_score(query, k=search_k)
        
        logger.info(f"Vector store returned {len(results)} raw results (before kb_id filter)")
        
        # Log top results with scores before filtering
        logger.info("Top results from vector store (before filtering):")
        for i, (doc, score) in enumerate(results[:10]):  # Log top 10
            metadata = doc.metadata
            chunk_id = metadata.get("chunk_id", "unknown")
            doc_id = metadata.get("doc_id", "unknown")
            result_kb_id = metadata.get("kb_id", "unknown")
            content_preview = doc.page_content[:100] if doc.page_content else ""
            
            # ChromaDB returns distance (lower is better)
            distance = float(score) if score else 1.0
            # Convert to similarity for display
            if distance <= 1.0:
                similarity_display = 1.0 - distance if distance < 1.0 else distance
            elif distance <= 2.0:
                similarity_display = 1.0 - (distance / 2.0)
            else:
                similarity_display = max(0.0, 1.0 / (1.0 + distance))
            
            logger.info(
                f"  [{i+1}] chunk_id={chunk_id}, doc_id={doc_id}, kb_id={result_kb_id}, "
                f"raw_distance={distance:.4f}, similarity={similarity_display:.4f}, "
                f"content_preview='{content_preview}...'"
            )
            
            # Check if it would pass threshold
            passes_threshold = similarity_display >= settings.relevance_score_threshold
            matches_kb_id = (kb_id is None) or (result_kb_id == kb_id)
            logger.info(
                f"    -> matches_kb_id={matches_kb_id}, "
                f"passes_threshold={passes_threshold} "
                f"(threshold={settings.relevance_score_threshold})"
            )
        
        retrieval_results = []
        filtered_count = 0
        threshold_filtered_count = 0
        
        for doc, score in results:
            metadata = doc.metadata
            result_kb_id = metadata.get("kb_id")
            
            # Filter by kb_id if provided
            if kb_id and result_kb_id != kb_id:
                filtered_count += 1
                logger.debug(f"Filtered out chunk (kb_id mismatch: {result_kb_id} != {kb_id})")
                continue
            
            # ChromaDB's similarity_search_with_score returns distance scores (lower = more similar)
            # For cosine similarity with normalized vectors: distance = 1 - similarity
            # So: similarity = 1 - distance
            # However, ChromaDB may use L2 distance or other metrics, so we need to handle both
            distance = float(score) if score else 1.0
            
            # Convert distance to similarity
            # If distance is in [0, 2] range (cosine distance), convert: similarity = 1 - distance
            # If distance is already similarity [0, 1], use as-is
            # For L2 distance, we'd need normalization, but for now assume cosine
            if distance <= 1.0:
                # Likely already similarity or very small distance
                similarity = 1.0 - distance if distance < 1.0 else distance
            elif distance <= 2.0:
                # Cosine distance: convert to similarity
                similarity = 1.0 - (distance / 2.0)
            else:
                # Large distance, low similarity
                similarity = max(0.0, 1.0 / (1.0 + distance))
            
            logger.debug(
                f"Processing result: chunk_id={metadata.get('chunk_id', 'unknown')}, "
                f"raw_score={distance:.4f}, converted_similarity={similarity:.4f}, "
                f"threshold={settings.relevance_score_threshold}"
            )
            
            # Store similarity as score (higher is better) for consistency with confidence service
            retrieval_results.append(
                RetrievalResult(
                    chunk_id=metadata.get("chunk_id", ""),
                    content=doc.page_content,
                    metadata=ChunkMetadata(**metadata),
                    score=similarity  # Store similarity (higher is better)
                )
            )
        
        logger.info(
            f"Retrieval summary: {len(retrieval_results)} results after filtering "
            f"(kb_id filtered: {filtered_count}, threshold: {settings.relevance_score_threshold} - not applied in filtering)"
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
    
    async def get_stats(self) -> Dict[str, Any]:
        """Get vector store statistics"""
        try:
            count = self.client._collection.count()
            return {
                "total_chunks": count,
                "collection_name": "agentic_kb",
                "persist_directory": self.client._persist_directory if hasattr(self.client, '_persist_directory') else None
            }
        except Exception as e:
            logger.error(f"Error getting Chroma stats: {e}")
            return {"error": str(e)}

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
        # Filter complex metadata (lists, dicts) to simple types only
        def filter_metadata(metadata: Dict[str, Any]) -> Dict[str, Any]:
            """Filter metadata to only include simple types"""
            filtered = {}
            for key, value in metadata.items():
                if value is None:
                    filtered[key] = None
                elif isinstance(value, (str, int, float, bool)):
                    filtered[key] = value
                elif isinstance(value, list):
                    # Convert lists to comma-separated strings
                    if len(value) > 0 and all(isinstance(item, str) for item in value):
                        filtered[key] = ", ".join(value)
                    elif len(value) > 0:
                        # For non-string lists, convert to JSON string
                        filtered[key] = json.dumps(value)
                    else:
                        # Empty list - skip or set to empty string
                        filtered[key] = ""
                elif isinstance(value, dict):
                    # Convert dicts to JSON strings
                    filtered[key] = json.dumps(value)
                else:
                    # Convert other types to strings
                    filtered[key] = str(value)
            return filtered
        
        ids = []
        for chunk in chunks:
            filtered_metadata = filter_metadata(chunk["metadata"])
            chunk_ids = self.vector_store.add_texts(
                texts=[chunk["content"]],
                metadatas=[filtered_metadata],
                ids=[chunk["chunk_id"]]
            )
            ids.extend(chunk_ids)
        
        logger.info(f"Added {len(chunks)} chunks to PGVector")
        return ids
    
    async def search(self, query: str, top_k: int = 5, kb_id: Optional[str] = None) -> List[RetrievalResult]:
        """Execute semantic search by query string"""
        from app.config import settings
        
        # Log query and parameters
        logger.info(f"PGVector search: query='{query[:100]}...', top_k={top_k}, kb_id={kb_id}, relevance_threshold={settings.relevance_score_threshold}")
        
        # Use similarity_search_with_score to get relevance scores
        search_k = top_k * 3 if kb_id else top_k  # Get more results if filtering by kb_id
        results = self.vector_store.similarity_search_with_score(query, k=search_k)
        
        logger.info(f"PGVector returned {len(results)} raw results (before filtering)")
        
        # Log top results with scores before filtering
        logger.info("Top results from PGVector (before filtering):")
        for i, (doc, score) in enumerate(results[:10]):  # Log top 10
            metadata = doc.metadata
            chunk_id = metadata.get("chunk_id", "unknown")
            doc_id = metadata.get("doc_id", "unknown")
            result_kb_id = metadata.get("kb_id", "unknown")
            content_preview = doc.page_content[:100] if doc.page_content else ""
            
            # PGVector typically returns similarity scores (higher is better)
            similarity = float(score) if score else 0.0
            
            logger.info(
                f"  [{i+1}] chunk_id={chunk_id}, doc_id={doc_id}, kb_id={result_kb_id}, "
                f"score={similarity:.4f}, content_preview='{content_preview}...'"
            )
            
            # Check if it would pass threshold
            passes_threshold = similarity >= settings.relevance_score_threshold
            matches_kb_id = (kb_id is None) or (result_kb_id == kb_id)
            logger.debug(
                f"    -> passes_threshold={passes_threshold} (threshold={settings.relevance_score_threshold}), "
                f"matches_kb_id={matches_kb_id}"
            )
        
        retrieval_results = []
        filtered_count = 0
        
        for doc, score in results:
            metadata = doc.metadata
            result_kb_id = metadata.get("kb_id")
            
            # Filter by kb_id if provided
            if kb_id and result_kb_id != kb_id:
                filtered_count += 1
                logger.debug(f"Filtered out chunk (kb_id mismatch: {result_kb_id} != {kb_id})")
                continue
            
            # PGVector typically returns similarity scores (higher is better)
            similarity = float(score) if score else 0.0
            
            logger.debug(
                f"Processing PGVector result: chunk_id={metadata.get('chunk_id', 'unknown')}, "
                f"similarity={similarity:.4f}, threshold={settings.relevance_score_threshold}"
            )
            
            # Store similarity as score (higher is better)
            retrieval_results.append(
                RetrievalResult(
                    chunk_id=metadata.get("chunk_id", ""),
                    content=doc.page_content,
                    metadata=ChunkMetadata(**metadata),
                    score=similarity
                )
            )
        
        logger.info(
            f"PGVector retrieval summary: {len(retrieval_results)} results after filtering "
            f"(kb_id filtered: {filtered_count}, threshold: {settings.relevance_score_threshold} - not applied in filtering)"
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
    
    async def get_stats(self) -> Dict[str, Any]:
        """Get vector store statistics"""
        try:
            # For PGVector, we'd need to query the database directly
            # For now, return basic info
            return {
                "total_chunks": "unknown",  # Would need DB query
                "collection_name": "agentic_kb",
                "type": "pgvector"
            }
        except Exception as e:
            logger.error(f"Error getting PGVector stats: {e}")
            return {"error": str(e)}

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
    """
    Get global vector store instance
    
    Auto-initializes if not already initialized.
    """
    global _vector_store
    if _vector_store is None:
        try:
            logger.info("Vector store not initialized, auto-initializing...")
            _vector_store = get_vector_store()
            logger.info("Vector store auto-initialized successfully")
        except Exception as e:
            logger.error(f"Failed to auto-initialize vector store: {e}", exc_info=True)
            raise RuntimeError(f"Vector store initialization failed: {e}") from e
    return _vector_store
