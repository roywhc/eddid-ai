"""Test vector store functionality"""
import pytest
from app.db.vector_store import get_vector_store, init_vector_store, get_vector_store_instance, ChromaVectorStore
from app.config import settings, VectorStoreType


@pytest.mark.asyncio
async def test_vector_store_initialization():
    """Test vector store initialization"""
    await init_vector_store()
    vector_store = get_vector_store_instance()
    assert vector_store is not None
    
    health = await vector_store.health_check()
    assert health is True


@pytest.mark.asyncio
async def test_vector_store_factory():
    """Test vector store factory function"""
    vector_store = get_vector_store()
    assert vector_store is not None
    
    if settings.vector_store_type == VectorStoreType.CHROMADB:
        assert isinstance(vector_store, ChromaVectorStore)


@pytest.mark.asyncio
async def test_add_and_search_chunks():
    """Test adding chunks and searching"""
    await init_vector_store()
    vector_store = get_vector_store_instance()
    
    # Create test chunks
    test_chunks = [
        {
            "chunk_id": "test_chunk_001",
            "content": "This is a test document about artificial intelligence and machine learning.",
            "metadata": {
                "doc_id": "test_doc_001",
                "kb_id": "kb_001",
                "doc_type": "test",
                "version": "1.0.0",
                "created_at": "2026-01-25T00:00:00Z",
                "updated_at": "2026-01-25T00:00:00Z",
                "source_type": "test",
                "status": "active"
            }
        },
        {
            "chunk_id": "test_chunk_002",
            "content": "Machine learning algorithms can process large amounts of data efficiently.",
            "metadata": {
                "doc_id": "test_doc_001",
                "kb_id": "kb_001",
                "doc_type": "test",
                "version": "1.0.0",
                "created_at": "2026-01-25T00:00:00Z",
                "updated_at": "2026-01-25T00:00:00Z",
                "source_type": "test",
                "status": "active"
            }
        }
    ]
    
    # Add chunks
    chunk_ids = await vector_store.add_chunks(test_chunks)
    assert len(chunk_ids) == 2
    assert "test_chunk_001" in chunk_ids
    assert "test_chunk_002" in chunk_ids
    
    # Search for chunks
    results = await vector_store.search("artificial intelligence", top_k=2)
    assert len(results) > 0
    assert results[0].content is not None
    assert results[0].chunk_id is not None


@pytest.mark.asyncio
async def test_delete_chunks():
    """Test deleting chunks"""
    await init_vector_store()
    vector_store = get_vector_store_instance()
    
    # Add a test chunk
    test_chunks = [
        {
            "chunk_id": "test_chunk_delete_001",
            "content": "This chunk will be deleted.",
            "metadata": {
                "doc_id": "test_doc_delete",
                "kb_id": "kb_001",
                "doc_type": "test",
                "version": "1.0.0",
                "created_at": "2026-01-25T00:00:00Z",
                "updated_at": "2026-01-25T00:00:00Z",
                "source_type": "test",
                "status": "active"
            }
        }
    ]
    
    await vector_store.add_chunks(test_chunks)
    
    # Delete the chunk
    result = await vector_store.delete_chunks(["test_chunk_delete_001"])
    assert result is True


@pytest.mark.asyncio
async def test_search_with_kb_filter():
    """Test searching with kb_id filter"""
    await init_vector_store()
    vector_store = get_vector_store_instance()
    
    # Search with kb_id filter
    results = await vector_store.search("test", top_k=5, kb_id="kb_001")
    # Results should only include chunks from kb_001
    for result in results:
        assert result.metadata.kb_id == "kb_001"
