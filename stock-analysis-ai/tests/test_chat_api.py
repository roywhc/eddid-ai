"""Test chat API endpoint"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient
from app.models import ChatRequest, ChatResponse
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


def test_chat_query_endpoint(client):
    """Test chat query endpoint with valid request"""
    request_data = {
        "query": "What is AI?",
        "session_id": "test_session",
        "include_sources": True
    }
    
    with patch('app.api.chat.get_orchestrator') as mock_get_orch:
        mock_orchestrator = MagicMock()
        mock_orchestrator.process_query = AsyncMock(return_value=ChatResponse(
            session_id="test_session",
            query="What is AI?",
            answer="AI stands for Artificial Intelligence...",
            sources=[],
            confidence_score=0.85,
            used_internal_kb=True,
            used_external_kb=False,
            processing_time_ms=150.0,
            timestamp=datetime.utcnow()
        ))
        mock_get_orch.return_value = mock_orchestrator
        
        response = client.post("/api/v1/chat/query", json=request_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["session_id"] == "test_session"
        assert data["query"] == "What is AI?"
        assert "answer" in data
        assert "confidence_score" in data
        assert data["used_internal_kb"] is True


def test_chat_query_without_session_id(client):
    """Test chat query creates new session if none provided"""
    request_data = {
        "query": "Test query"
    }
    
    with patch('app.api.chat.get_orchestrator') as mock_get_orch:
        mock_orchestrator = MagicMock()
        mock_orchestrator.process_query = AsyncMock(return_value=ChatResponse(
            session_id="new_session",
            query="Test query",
            answer="Answer",
            sources=[],
            confidence_score=0.8,
            used_internal_kb=True,
            used_external_kb=False,
            processing_time_ms=100.0,
            timestamp=datetime.utcnow()
        ))
        mock_get_orch.return_value = mock_orchestrator
        
        response = client.post("/api/v1/chat/query", json=request_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "session_id" in data


def test_chat_query_validation_error(client):
    """Test chat query validates request data"""
    # Empty query should fail validation
    request_data = {
        "query": ""
    }
    
    response = client.post("/api/v1/chat/query", json=request_data)
    
    assert response.status_code == 422  # Validation error


def test_chat_query_too_long(client):
    """Test chat query enforces max length"""
    # Query longer than 5000 chars should fail
    request_data = {
        "query": "x" * 5001
    }
    
    response = client.post("/api/v1/chat/query", json=request_data)
    
    assert response.status_code == 422  # Validation error


def test_chat_query_with_conversation_history(client):
    """Test chat query with conversation history"""
    request_data = {
        "query": "Tell me more",
        "session_id": "test_session",
        "conversation_history": [
            {
                "role": "user",
                "content": "What is ML?"
            },
            {
                "role": "assistant",
                "content": "Machine learning is..."
            }
        ]
    }
    
    with patch('app.api.chat.get_orchestrator') as mock_get_orch:
        mock_orchestrator = MagicMock()
        mock_orchestrator.process_query = AsyncMock(return_value=ChatResponse(
            session_id="test_session",
            query="Tell me more",
            answer="Based on our previous conversation...",
            sources=[],
            confidence_score=0.8,
            used_internal_kb=True,
            used_external_kb=False,
            processing_time_ms=120.0,
            timestamp=datetime.utcnow()
        ))
        mock_get_orch.return_value = mock_orchestrator
        
        response = client.post("/api/v1/chat/query", json=request_data)
        
        assert response.status_code == 200
        # Verify orchestrator was called
        mock_orchestrator.process_query.assert_called_once()


def test_chat_query_includes_sources(client):
    """Test chat query response includes citations"""
    from app.models import Citation
    
    request_data = {
        "query": "What is AI?",
        "session_id": "test_session",
        "include_sources": True
    }
    
    with patch('app.api.chat.get_orchestrator') as mock_get_orch:
        mock_orchestrator = MagicMock()
        mock_orchestrator.process_query = AsyncMock(return_value=ChatResponse(
            session_id="test_session",
            query="What is AI?",
            answer="AI is...",
            sources=[
                Citation(
                    source="internal",
                    document_id="doc_001",
                    relevance_score=0.9
                )
            ],
            confidence_score=0.85,
            used_internal_kb=True,
            used_external_kb=False,
            processing_time_ms=150.0,
            timestamp=datetime.utcnow()
        ))
        mock_get_orch.return_value = mock_orchestrator
        
        response = client.post("/api/v1/chat/query", json=request_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "sources" in data
        assert len(data["sources"]) > 0
        assert data["sources"][0]["source"] == "internal"
