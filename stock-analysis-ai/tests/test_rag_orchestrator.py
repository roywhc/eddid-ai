"""Test RAG orchestrator functionality"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.services.rag_orchestrator import RAGOrchestrator
from app.models import ChatRequest, ChatMessage, RetrievalResult, ChunkMetadata
from datetime import datetime


@pytest.fixture
def mock_vector_store():
    """Create a mock vector store instance"""
    mock_store = MagicMock()
    mock_store.search = AsyncMock()
    return mock_store


@pytest.mark.asyncio
async def test_process_query_with_results(mock_vector_store):
    """Test full RAG flow with successful retrieval"""
    with patch('app.services.retrieval.get_vector_store_instance', return_value=mock_vector_store):
        orchestrator = RAGOrchestrator()
    
    request = ChatRequest(
        query="What is AI?",
        session_id="test_session",
        include_sources=True
    )
    
    # Mock retrieval results
    mock_results = [
        RetrievalResult(
            chunk_id="chunk_001",
            content="AI is artificial intelligence",
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
            score=0.9
        )
    ]
    
    with patch.object(orchestrator.retrieval_service, 'retrieve', new_callable=AsyncMock) as mock_retrieve, \
         patch.object(orchestrator.confidence_service, 'calculate_confidence', return_value=0.85), \
         patch.object(orchestrator.llm_service, 'generate_answer', new_callable=AsyncMock) as mock_llm, \
         patch.object(orchestrator.session_manager, 'get_history', return_value=[]), \
         patch.object(orchestrator.session_manager, 'add_message') as mock_add_msg:
        
        mock_retrieve.return_value = mock_results
        mock_llm.return_value = "AI stands for Artificial Intelligence, which is..."
        
        response = await orchestrator.process_query(request)
        
        assert response.session_id == "test_session"
        assert response.query == "What is AI?"
        assert len(response.answer) > 0
        assert response.confidence_score == 0.85
        assert response.used_internal_kb is True
        assert response.used_external_kb is False
        assert len(response.sources) > 0  # Should have citations
        mock_retrieve.assert_called_once()
        mock_llm.assert_called_once()
        mock_add_msg.assert_called()


@pytest.mark.asyncio
async def test_process_query_empty_results(mock_vector_store):
    """Test RAG flow with no retrieval results"""
    with patch('app.services.retrieval.get_vector_store_instance', return_value=mock_vector_store):
        orchestrator = RAGOrchestrator()
    
    request = ChatRequest(
        query="Nonexistent topic",
        session_id="test_session"
    )
    
    with patch.object(orchestrator.retrieval_service, 'retrieve', new_callable=AsyncMock) as mock_retrieve, \
         patch.object(orchestrator.confidence_service, 'calculate_confidence', return_value=0.2), \
         patch.object(orchestrator.llm_service, 'generate_answer', new_callable=AsyncMock) as mock_llm, \
         patch.object(orchestrator.session_manager, 'get_history', return_value=[]):
        
        mock_retrieve.return_value = []
        mock_llm.return_value = "I don't have specific information about that."
        
        response = await orchestrator.process_query(request)
        
        assert response.confidence_score == 0.2
        assert response.used_internal_kb is True
        assert len(response.sources) == 0  # No citations when no results


@pytest.mark.asyncio
async def test_process_query_with_conversation_history(mock_vector_store):
    """Test RAG flow uses conversation history"""
    with patch('app.services.retrieval.get_vector_store_instance', return_value=mock_vector_store):
        orchestrator = RAGOrchestrator()
    
    history = [
        ChatMessage(role="user", content="What is ML?"),
        ChatMessage(role="assistant", content="Machine learning is...")
    ]
    
    request = ChatRequest(
        query="Tell me more",
        session_id="test_session",
        conversation_history=history
    )
    
    with patch.object(orchestrator.retrieval_service, 'retrieve', new_callable=AsyncMock) as mock_retrieve, \
         patch.object(orchestrator.confidence_service, 'calculate_confidence', return_value=0.8), \
         patch.object(orchestrator.llm_service, 'generate_answer', new_callable=AsyncMock) as mock_llm, \
         patch.object(orchestrator.session_manager, 'get_history', return_value=history):
        
        mock_retrieve.return_value = []
        mock_llm.return_value = "Based on our previous conversation..."
        
        response = await orchestrator.process_query(request)
        
        # Verify conversation history was passed to LLM
        call_args = mock_llm.call_args
        assert call_args is not None
        assert len(call_args.kwargs.get('conversation_history', [])) > 0


@pytest.mark.asyncio
async def test_process_query_citation_extraction(mock_vector_store):
    """Test that citations are extracted from retrieval results"""
    with patch('app.services.retrieval.get_vector_store_instance', return_value=mock_vector_store):
        orchestrator = RAGOrchestrator()
    
    request = ChatRequest(
        query="Test query",
        session_id="test_session"
    )
    
    mock_results = [
        RetrievalResult(
            chunk_id="chunk_001",
            content="Content 1",
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
            score=0.9
        ),
        RetrievalResult(
            chunk_id="chunk_002",
            content="Content 2",
            metadata=ChunkMetadata(
                kb_id="kb_001",
                doc_id="doc_002",
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
    
    with patch.object(orchestrator.retrieval_service, 'retrieve', new_callable=AsyncMock) as mock_retrieve, \
         patch.object(orchestrator.confidence_service, 'calculate_confidence', return_value=0.8), \
         patch.object(orchestrator.llm_service, 'generate_answer', new_callable=AsyncMock) as mock_llm, \
         patch.object(orchestrator.session_manager, 'get_history', return_value=[]):
        
        mock_retrieve.return_value = mock_results
        mock_llm.return_value = "Answer"
        
        response = await orchestrator.process_query(request)
        
        # Should have citations for each result
        assert len(response.sources) == 2
        assert all(c.source == "internal" for c in response.sources)
        assert any(c.document_id == "doc_001" for c in response.sources)
        assert any(c.document_id == "doc_002" for c in response.sources)


@pytest.mark.asyncio
async def test_process_query_error_handling(mock_vector_store):
    """Test error handling in RAG orchestrator"""
    with patch('app.services.retrieval.get_vector_store_instance', return_value=mock_vector_store):
        orchestrator = RAGOrchestrator()
    
    request = ChatRequest(
        query="Test query",
        session_id="test_session"
    )
    
    with patch.object(orchestrator.retrieval_service, 'retrieve', new_callable=AsyncMock) as mock_retrieve:
        mock_retrieve.side_effect = Exception("Retrieval error")
        
        with pytest.raises(Exception):
            await orchestrator.process_query(request)
