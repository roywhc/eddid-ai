"""Test retrieval service functionality"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.services.retrieval import RetrievalService
from app.models import RetrievalResult, ChunkMetadata
from datetime import datetime


@pytest.fixture
def mock_vector_store():
    """Create a mock vector store instance"""
    mock_store = MagicMock()
    mock_store.search = AsyncMock()
    return mock_store


@pytest.mark.asyncio
async def test_retrieve_with_results(mock_vector_store):
    """Test retrieval with successful results"""
    mock_results = [
        RetrievalResult(
            chunk_id="chunk_001",
            content="Test content about AI",
            metadata=ChunkMetadata(
                kb_id="kb_001",
                doc_id="doc_001",
                doc_type="test",
                version="1.0.0",
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
                source_type="test",
                source_urls=[],
                status="active"
            ),
            score=0.85
        )
    ]
    
    with patch('app.services.retrieval.get_vector_store_instance', return_value=mock_vector_store):
        service = RetrievalService()
        mock_vector_store.search.return_value = mock_results
        
        results = await service.retrieve("test query", "kb_001", top_k=5)
        
        assert len(results) == 1
        assert results[0].chunk_id == "chunk_001"
        assert results[0].score == 0.85
        mock_vector_store.search.assert_called_once()


@pytest.mark.asyncio
async def test_retrieve_empty_results(mock_vector_store):
    """Test retrieval with no matching results"""
    with patch('app.services.retrieval.get_vector_store_instance', return_value=mock_vector_store):
        service = RetrievalService()
        mock_vector_store.search.return_value = []
        
        results = await service.retrieve("nonexistent query", "kb_001", top_k=5)
        
        assert len(results) == 0
        mock_vector_store.search.assert_called_once()


@pytest.mark.asyncio
async def test_retrieve_with_kb_filter(mock_vector_store):
    """Test retrieval respects kb_id filter"""
    mock_results = [
        RetrievalResult(
            chunk_id="chunk_001",
            content="Test content",
            metadata=ChunkMetadata(
                kb_id="kb_001",
                doc_id="doc_001",
                doc_type="test",
                version="1.0.0",
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
                source_type="test",
                source_urls=[],
                status="active"
            ),
            score=0.8
        )
    ]
    
    with patch('app.services.retrieval.get_vector_store_instance', return_value=mock_vector_store):
        service = RetrievalService()
        mock_vector_store.search.return_value = mock_results
        
        results = await service.retrieve("test", "kb_001", top_k=5)
        
        # Verify kb_id was used in search
        call_args = mock_vector_store.search.call_args
        assert call_args is not None
        assert len(results) > 0
        # All results should be from kb_001
        assert all(r.metadata.kb_id == "kb_001" for r in results)


@pytest.mark.asyncio
async def test_retrieve_error_handling(mock_vector_store):
    """Test retrieval handles vector store errors gracefully"""
    with patch('app.services.retrieval.get_vector_store_instance', return_value=mock_vector_store):
        service = RetrievalService()
        mock_vector_store.search.side_effect = Exception("Vector store error")
        
        with pytest.raises(Exception):
            await service.retrieve("test query", "kb_001", top_k=5)


@pytest.mark.asyncio
async def test_retrieve_top_k_parameter(mock_vector_store):
    """Test retrieval respects top_k parameter"""
    # Create multiple mock results
    all_results = [
        RetrievalResult(
            chunk_id=f"chunk_{i:03d}",
            content=f"Content {i}",
            metadata=ChunkMetadata(
                kb_id="kb_001",
                doc_id="doc_001",
                doc_type="test",
                version="1.0.0",
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
                source_type="test",
                source_urls=[],
                status="active"
            ),
            score=0.9 - (i * 0.1)
        )
        for i in range(10)
    ]
    
    async def mock_search_side_effect(query, top_k, kb_id):
        # Return only top_k results
        return all_results[:top_k]
    
    with patch('app.services.retrieval.get_vector_store_instance', return_value=mock_vector_store):
        service = RetrievalService()
        mock_vector_store.search.side_effect = mock_search_side_effect
        
        results = await service.retrieve("test", "kb_001", top_k=3)
        
        # Should return top 3 results
        assert len(results) == 3
        mock_vector_store.search.assert_called_once()
        # Verify top_k was passed correctly
        call_args = mock_vector_store.search.call_args
        assert call_args.kwargs.get('top_k') == 3
