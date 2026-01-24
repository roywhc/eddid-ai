import logging
from typing import List, Dict, Any
from langchain_text_splitters import RecursiveCharacterTextSplitter
from datetime import datetime
import uuid

logger = logging.getLogger(__name__)

class DocumentChunker:
    """Document chunker"""
    
    def __init__(
        self,
        chunk_size: int = 512,
        chunk_overlap: int = 50,
        separators: List[str] | None = None
    ):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.separators = separators or ["\n\n", "\n", ". ", " ", ""]
        
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap,
            separators=self.separators
        )
    
    def chunk_document(
        self,
        content: str,
        doc_id: str,
        kb_id: str,
        metadata: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Split document into chunks
        
        Args:
            content: Document content
            doc_id: Document ID
            kb_id: Knowledge base ID
            metadata: Additional metadata
        
        Returns:
            List of chunks with metadata
        """
        
        splits = self.splitter.split_text(content)
        
        chunks = []
        for i, split_content in enumerate(splits):
            chunk = {
                "chunk_id": f"{doc_id}_{i:04d}_{uuid.uuid4().hex[:6]}",
                "doc_id": doc_id,
                "kb_id": kb_id,
                "content": split_content,
                "metadata": {
                    **metadata,
                    "chunk_index": i,
                    "chunk_size": len(split_content),
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                }
            }
            chunks.append(chunk)
        
        logger.info(f"Chunked document {doc_id} into {len(chunks)} chunks")
        return chunks
    
    def chunk_markdown(
        self,
        content: str,
        doc_id: str,
        kb_id: str,
        metadata: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Special chunking for Markdown documents"""
        
        markdown_splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap,
            separators=["# ", "## ", "### ", "\n\n", "\n", " ", ""]
        )
        
        splits = markdown_splitter.split_text(content)
        return self._create_chunks(splits, doc_id, kb_id, metadata)
    
    def _create_chunks(
        self,
        splits: List[str],
        doc_id: str,
        kb_id: str,
        metadata: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Internal method to create chunks"""
        chunks = []
        for i, split_content in enumerate(splits):
            chunk = {
                "chunk_id": f"{doc_id}_{i:04d}_{uuid.uuid4().hex[:6]}",
                "doc_id": doc_id,
                "kb_id": kb_id,
                "content": split_content,
                "metadata": {
                    **metadata,
                    "chunk_index": i,
                    "chunk_size": len(split_content),
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                }
            }
            chunks.append(chunk)
        return chunks
