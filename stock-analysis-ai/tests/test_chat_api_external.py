"""Test chat API with external knowledge integration"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient
from app.models import ChatRequest, ChatResponse, ExternalKnowledgeResult
from datetime import datetime


@pytest.fixture
def mock_vector_store():
    """Create a mock vector store instance"""
    mock_store = MagicMock()
    mock_store.search = AsyncMock()
    return mock_store


@pytest.fixture
def client(mock_vector_store):
    """Create test client with mocked vector store"""
    with patch('app.db.vector_store.get_vector_store_instance', return_value=mock_vector_store), \
         patch('app.services.retrieval.get_vector_store_instance', return_value=mock_vector_store):
        from app.main import app
        return TestClient(app)


@pytest.fixture
def mock_orchestrator():
    """Create a mock orchestrator"""
    mock_orch = MagicMock()
    mock_orch.process_query = AsyncMock()
    return mock_orch


def test_chat_query_with_external_kb_enabled(client, mock_orchestrator):
    """Test chat query with external KB enabled"""
    request_data = {
        "query": "What is quantum computing?",
        "session_id": "test_session",
        "use_external_kb": True,
        "include_sources": True
    }
    
    response_data = ChatResponse(
        session_id="test_session",
        query="What is quantum computing?",
        answer="Quantum computing uses quantum mechanics...",
        sources=[],
        confidence_score=0.5,  # Low confidence
        used_internal_kb=True,
        used_external_kb=True,  # External KB was used
        processing_time_ms=2500.0,
        timestamp=datetime.utcnow()
    )
    
    with patch('app.api.chat.get_orchestrator', return_value=mock_orchestrator):
        mock_orchestrator.process_query.return_value = response_data
        
        response = client.post("/api/v1/chat/query", json=request_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["used_external_kb"] is True
        assert data["used_internal_kb"] is True
        assert data["confidence_score"] == 0.5


def test_chat_query_with_external_kb_disabled(client, mock_orchestrator):
    """Test chat query with external KB disabled"""
    request_data = {
        "query": "What is AI?",
        "session_id": "test_session",
        "use_external_kb": False,
        "include_sources": True
    }
    
    response_data = ChatResponse(
        session_id="test_session",
        query="What is AI?",
        answer="AI stands for Artificial Intelligence...",
        sources=[],
        confidence_score=0.85,
        used_internal_kb=True,
        used_external_kb=False,
        processing_time_ms=1200.0,
        timestamp=datetime.utcnow()
    )
    
    with patch('app.api.chat.get_orchestrator', return_value=mock_orchestrator):
        mock_orchestrator.process_query.return_value = response_data
        
        response = client.post("/api/v1/chat/query", json=request_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["used_external_kb"] is False
        assert data["used_internal_kb"] is True


def test_chat_query_external_sources_included(client, mock_orchestrator):
    """Test that external sources are included in response"""
    from app.models import Citation
    
    request_data = {
        "query": "What is blockchain?",
        "session_id": "test_session",
        "use_external_kb": True,
        "include_sources": True
    }
    
    response_data = ChatResponse(
        session_id="test_session",
        query="What is blockchain?",
        answer="Blockchain is a distributed ledger...",
        sources=[
            Citation(
                source="internal",
                document_id="doc_001",
                document_title="Internal Doc",
                relevance_score=0.6
            ),
            Citation(
                source="external",
                document_title="Blockchain Guide",
                url="https://example.com/blockchain",
                relevance_score=None
            )
        ],
        confidence_score=0.4,
        used_internal_kb=True,
        used_external_kb=True,
        processing_time_ms=3000.0,
        timestamp=datetime.utcnow()
    )
    
    with patch('app.api.chat.get_orchestrator', return_value=mock_orchestrator):
        mock_orchestrator.process_query.return_value = response_data
        
        response = client.post("/api/v1/chat/query", json=request_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "sources" in data
        assert len(data["sources"]) == 2
        
        # Check for external citation
        external_sources = [s for s in data["sources"] if s["source"] == "external"]
        assert len(external_sources) > 0
        assert external_sources[0]["url"] == "https://example.com/blockchain"


def test_chat_query_external_only_response(client, mock_orchestrator):
    """Test response when only external KB is used (no internal matches)"""
    from app.models import Citation
    
    request_data = {
        "query": "What is a very specific topic?",
        "session_id": "test_session",
        "use_external_kb": True,
        "include_sources": True
    }
    
    response_data = ChatResponse(
        session_id="test_session",
        query="What is a very specific topic?",
        answer="This topic is not in internal KB, but here's external info...",
        sources=[
            Citation(
                source="external",
                document_title="External Source",
                url="https://example.com/topic",
                relevance_score=None
            )
        ],
        confidence_score=0.0,  # No internal matches
        used_internal_kb=False,
        used_external_kb=True,
        processing_time_ms=2800.0,
        timestamp=datetime.utcnow()
    )
    
    with patch('app.api.chat.get_orchestrator', return_value=mock_orchestrator):
        mock_orchestrator.process_query.return_value = response_data
        
        response = client.post("/api/v1/chat/query", json=request_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["used_external_kb"] is True
        assert data["used_internal_kb"] is False
        assert data["confidence_score"] == 0.0
        assert len(data["sources"]) > 0
        assert all(s["source"] == "external" for s in data["sources"])


def test_chat_query_external_fallback(client, mock_orchestrator):
    """Test that external KB failure doesn't break the request"""
    request_data = {
        "query": "What is quantum physics?",
        "session_id": "test_session",
        "use_external_kb": True,
        "include_sources": True
    }
    
    # Response with external KB failure (fallback to internal only)
    response_data = ChatResponse(
        session_id="test_session",
        query="What is quantum physics?",
        answer="Based on internal knowledge...",
        sources=[],
        confidence_score=0.3,
        used_internal_kb=True,
        used_external_kb=False,  # External failed, fell back
        processing_time_ms=1500.0,
        timestamp=datetime.utcnow()
    )
    
    with patch('app.api.chat.get_orchestrator', return_value=mock_orchestrator):
        mock_orchestrator.process_query.return_value = response_data
        
        response = client.post("/api/v1/chat/query", json=request_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["used_external_kb"] is False  # External failed
        assert data["used_internal_kb"] is True  # Fallback to internal
        assert len(data["answer"]) > 0  # Should still have answer


def test_chat_query_default_use_external_kb(client, mock_orchestrator):
    """Test that use_external_kb defaults to True"""
    request_data = {
        "query": "What is AI?",
        "session_id": "test_session"
        # use_external_kb not specified, should default to True
    }
    
    response_data = ChatResponse(
        session_id="test_session",
        query="What is AI?",
        answer="AI is...",
        sources=[],
        confidence_score=0.8,
        used_internal_kb=True,
        used_external_kb=False,  # Not used due to high confidence
        processing_time_ms=1000.0,
        timestamp=datetime.utcnow()
    )
    
    with patch('app.api.chat.get_orchestrator', return_value=mock_orchestrator):
        mock_orchestrator.process_query.return_value = response_data
        
        response = client.post("/api/v1/chat/query", json=request_data)
        
        assert response.status_code == 200
        # Verify orchestrator was called with use_external_kb=True (default)
        call_args = mock_orchestrator.process_query.call_args
        assert call_args[0][0].use_external_kb is True
