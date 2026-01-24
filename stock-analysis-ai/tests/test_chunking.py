"""Test document chunking functionality"""
import pytest
from app.utils.chunking import DocumentChunker


def test_document_chunking():
    """Test basic document chunking"""
    chunker = DocumentChunker(chunk_size=256, chunk_overlap=25)
    content = "This is a test document. " * 50  # Create a long document
    
    chunks = chunker.chunk_document(
        content=content,
        doc_id="test_doc_001",
        kb_id="kb_001",
        metadata={"doc_type": "test"}
    )
    
    assert len(chunks) > 1
    assert all("chunk_id" in c for c in chunks)
    assert all("doc_id" in c for c in chunks)
    assert all("kb_id" in c for c in chunks)
    assert all("content" in c for c in chunks)
    assert all("metadata" in c for c in chunks)
    
    # Verify chunk sizes are reasonable
    for chunk in chunks:
        assert len(chunk["content"]) <= 256 + 50  # chunk_size + overlap


def test_markdown_chunking():
    """Test Markdown-specific chunking"""
    chunker = DocumentChunker(chunk_size=256, chunk_overlap=25)
    
    markdown_content = """# Title

## Section 1

This is section 1 content.

## Section 2

This is section 2 content.
"""
    
    chunks = chunker.chunk_markdown(
        content=markdown_content,
        doc_id="test_md_001",
        kb_id="kb_001",
        metadata={"doc_type": "markdown"}
    )
    
    assert len(chunks) > 0
    assert all("chunk_id" in c for c in chunks)
    assert all("metadata" in c for c in chunks)


def test_chunk_metadata():
    """Test that chunk metadata is properly set"""
    chunker = DocumentChunker()
    content = "Short test content"
    
    chunks = chunker.chunk_document(
        content=content,
        doc_id="test_doc_002",
        kb_id="kb_002",
        metadata={
            "doc_type": "test",
            "language": "en",
            "tags": ["test", "example"]
        }
    )
    
    assert len(chunks) > 0
    for chunk in chunks:
        metadata = chunk["metadata"]
        assert metadata["doc_type"] == "test"
        assert metadata["language"] == "en"
        assert "test" in metadata["tags"]
        assert "chunk_index" in metadata
        assert "chunk_size" in metadata
        assert "created_at" in metadata
        assert "updated_at" in metadata


def test_chunk_id_uniqueness():
    """Test that chunk IDs are unique"""
    chunker = DocumentChunker()
    content = "Test content. " * 100
    
    chunks = chunker.chunk_document(
        content=content,
        doc_id="test_doc_003",
        kb_id="kb_003",
        metadata={"doc_type": "test"}
    )
    
    chunk_ids = [c["chunk_id"] for c in chunks]
    assert len(chunk_ids) == len(set(chunk_ids)), "Chunk IDs must be unique"
