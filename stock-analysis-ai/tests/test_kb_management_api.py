"""Test KB management API endpoints"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime
from app.models import KBDocument, KBCandidate


@pytest.fixture
def client():
    """Create test client"""
    with patch('app.db.vector_store.get_vector_store_instance'), \
         patch('app.services.retrieval.get_vector_store_instance'):
        from app.main import app
        return TestClient(app)


@pytest.fixture
def sample_document():
    """Sample document for testing"""
    return KBDocument(
        doc_id="doc_123",
        kb_id="test_kb",
        title="Test Document",
        doc_type="test",
        content="Test content",
        version="1.0.0",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        created_by="test_user",
        approved_by=None,
        language="en",
        tags=["test"],
        status="active",
        chunks=2
    )


@pytest.fixture
def sample_candidate():
    """Sample candidate for testing"""
    return KBCandidate(
        candidate_id="candidate_123",
        original_query="What is AI?",
        source_type="external_perplexity",
        title="What is AI?",
        content="AI is artificial intelligence...",
        suggested_kb_id="default_kb",
        suggested_category="faq",
        external_urls=["https://example.com/ai"],
        extracted_on=datetime.utcnow(),
        status="pending",
        reviewed_by=None,
        review_notes=None,
        hit_count=1
    )


@pytest.mark.asyncio
async def test_create_document_success(client, sample_document):
    """Test POST /api/v1/kb/documents - create document"""
    with patch('app.api.kb_management.get_document_service') as mock_get_service:
        mock_service = MagicMock()
        mock_service.create_document = AsyncMock(return_value=sample_document)
        mock_get_service.return_value = mock_service
        
        request_data = {
            "kb_id": "test_kb",
            "title": "Test Document",
            "content": "Test content",
            "doc_type": "test",
            "tags": ["test"],
            "language": "en",
            "source_type": "manual",
            "source_urls": []
        }
        
        response = client.post("/api/v1/kb/documents", json=request_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["doc_id"] == "doc_123"
        assert data["title"] == "Test Document"
        assert mock_service.create_document.called


def test_create_document_validation_error(client):
    """Test POST /api/v1/kb/documents - validation error"""
    with patch('app.api.kb_management.get_document_service') as mock_get_service:
        mock_service = MagicMock()
        mock_service.create_document = AsyncMock(side_effect=ValueError("Title cannot be empty"))
        mock_get_service.return_value = mock_service
        
        request_data = {
            "kb_id": "test_kb",
            "title": "",
            "content": "Test content",
            "doc_type": "test"
        }
        
        response = client.post("/api/v1/kb/documents", json=request_data)
        
        assert response.status_code == 400
        assert "Title cannot be empty" in response.json()["detail"]


def test_get_document_success(client, sample_document):
    """Test GET /api/v1/kb/documents/{doc_id} - get document"""
    with patch('app.api.kb_management.get_document_service') as mock_get_service:
        mock_service = MagicMock()
        mock_service.get_document.return_value = sample_document
        mock_get_service.return_value = mock_service
        
        response = client.get("/api/v1/kb/documents/doc_123")
        
        assert response.status_code == 200
        data = response.json()
        assert data["doc_id"] == "doc_123"
        assert data["title"] == "Test Document"


def test_get_document_not_found(client):
    """Test GET /api/v1/kb/documents/{doc_id} - document not found"""
    with patch('app.api.kb_management.get_document_service') as mock_get_service:
        mock_service = MagicMock()
        mock_service.get_document.side_effect = ValueError("Document not found: doc_123")
        mock_get_service.return_value = mock_service
        
        response = client.get("/api/v1/kb/documents/doc_123")
        
        assert response.status_code == 404
        assert "Document not found" in response.json()["detail"]


@pytest.mark.asyncio
async def test_update_document_success(client, sample_document):
    """Test PUT /api/v1/kb/documents/{doc_id} - update document"""
    with patch('app.api.kb_management.get_document_service') as mock_get_service:
        mock_service = MagicMock()
        updated_doc = sample_document.copy(update={"version": "1.0.1"})
        mock_service.update_document = AsyncMock(return_value=updated_doc)
        mock_get_service.return_value = mock_service
        
        request_data = {
            "kb_id": "test_kb",
            "title": "Updated Title",
            "content": "Updated content",
            "doc_type": "test"
        }
        
        response = client.put("/api/v1/kb/documents/doc_123", json=request_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["version"] == "1.0.1"
        assert mock_service.update_document.called


@pytest.mark.asyncio
async def test_delete_document_success(client):
    """Test DELETE /api/v1/kb/documents/{doc_id} - delete document"""
    with patch('app.api.kb_management.get_document_service') as mock_get_service:
        mock_service = MagicMock()
        mock_service.delete_document = AsyncMock(return_value=True)
        mock_get_service.return_value = mock_service
        
        response = client.delete("/api/v1/kb/documents/doc_123")
        
        assert response.status_code == 204
        assert mock_service.delete_document.called


def test_list_documents(client, sample_document):
    """Test GET /api/v1/kb/documents - list documents"""
    with patch('app.api.kb_management.get_document_service') as mock_get_service:
        mock_service = MagicMock()
        mock_service.list_documents.return_value = [sample_document]
        mock_get_service.return_value = mock_service
        
        response = client.get("/api/v1/kb/documents?kb_id=test_kb&limit=10&offset=0")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["doc_id"] == "doc_123"


def test_get_candidates(client, sample_candidate):
    """Test GET /api/v1/kb/candidates - get candidates"""
    with patch('app.api.kb_management.get_candidate_service') as mock_get_service:
        mock_service = MagicMock()
        mock_service.get_candidates.return_value = [sample_candidate]
        mock_get_service.return_value = mock_service
        
        response = client.get("/api/v1/kb/candidates?kb_id=default_kb&limit=10&offset=0")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["candidate_id"] == "candidate_123"


@pytest.mark.asyncio
async def test_approve_candidate_success(client, sample_document):
    """Test POST /api/v1/kb/candidates/{candidate_id}/approve - approve candidate"""
    with patch('app.api.kb_management.get_candidate_service') as mock_get_service:
        mock_service = MagicMock()
        mock_service.approve_candidate = AsyncMock(return_value=sample_document)
        mock_get_service.return_value = mock_service
        
        request_data = {
            "reviewer": "reviewer",
            "notes": "Looks good"
        }
        
        response = client.post("/api/v1/kb/candidates/candidate_123/approve", json=request_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["doc_id"] == "doc_123"
        assert mock_service.approve_candidate.called


@pytest.mark.asyncio
async def test_reject_candidate_success(client):
    """Test POST /api/v1/kb/candidates/{candidate_id}/reject - reject candidate"""
    with patch('app.api.kb_management.get_candidate_service') as mock_get_service:
        mock_service = MagicMock()
        mock_service.reject_candidate.return_value = True
        mock_get_service.return_value = mock_service
        
        request_data = {
            "reviewer": "reviewer",
            "notes": "Not relevant"
        }
        
        response = client.post("/api/v1/kb/candidates/candidate_123/reject", json=request_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "rejected"
        assert mock_service.reject_candidate.called


@pytest.mark.asyncio
async def test_modify_candidate_success(client, sample_document):
    """Test POST /api/v1/kb/candidates/{candidate_id}/modify - modify candidate"""
    with patch('app.api.kb_management.get_candidate_service') as mock_get_service:
        mock_service = MagicMock()
        mock_service.modify_candidate = AsyncMock(return_value=sample_document)
        mock_get_service.return_value = mock_service
        
        request_data = {
            "reviewer": "reviewer",
            "notes": "Modified before approval",
            "document": {
                "kb_id": "default_kb",
                "title": "Modified Title",
                "content": "Modified content",
                "doc_type": "faq"
            }
        }
        
        response = client.post("/api/v1/kb/candidates/candidate_123/modify", json=request_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["doc_id"] == "doc_123"
        assert mock_service.modify_candidate.called


def test_approve_candidate_not_found(client):
    """Test POST /api/v1/kb/candidates/{candidate_id}/approve - candidate not found"""
    with patch('app.api.kb_management.get_candidate_service') as mock_get_service:
        mock_service = MagicMock()
        mock_service.approve_candidate = AsyncMock(side_effect=ValueError("Candidate not found: candidate_123"))
        mock_get_service.return_value = mock_service
        
        request_data = {
            "reviewer": "reviewer"
        }
        
        response = client.post("/api/v1/kb/candidates/candidate_123/approve", json=request_data)
        
        assert response.status_code == 400
        assert "Candidate not found" in response.json()["detail"]
