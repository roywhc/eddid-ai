"""Test document service"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch, Mock
from datetime import datetime
from app.services.document_service import DocumentService
from app.models import KBUpdateRequest, KBDocument
from app.db.metadata_store import DocumentRecord, ChunkRecord


@pytest.fixture
def document_service():
    """Create DocumentService instance with mocked dependencies"""
    with patch('app.services.document_service.get_vector_store_instance') as mock_get_store:
        mock_vector_store = MagicMock()
        mock_vector_store.add_chunks = AsyncMock(return_value=["chunk_1", "chunk_2"])
        mock_vector_store.delete_chunks = AsyncMock(return_value=True)
        mock_get_store.return_value = mock_vector_store
        
        service = DocumentService()
        service.vector_store = mock_vector_store
        yield service


@pytest.fixture
def sample_request():
    """Create sample KBUpdateRequest"""
    return KBUpdateRequest(
        kb_id="test_kb",
        title="Test Document",
        content="This is a test document with some content that will be chunked.",
        doc_type="test",
        tags=["test", "sample"],
        language="en",
        source_type="manual",
        source_urls=[]
    )


@pytest.mark.asyncio
async def test_create_document_success(document_service, sample_request):
    """Test successful document creation"""
    with patch('app.services.document_service.SessionLocal') as mock_session_local:
        mock_session = MagicMock()
        mock_session_local.return_value = mock_session
        
        # Mock chunker
        document_service.chunker.chunk_document = Mock(return_value=[
            {
                "chunk_id": "chunk_1",
                "doc_id": "doc_123",
                "kb_id": "test_kb",
                "content": "This is a test",
                "metadata": {
                    "chunk_index": 0,
                    "chunk_size": 14,
                    "doc_type": "test",
                    "version": "1.0.0"
                }
            },
            {
                "chunk_id": "chunk_2",
                "doc_id": "doc_123",
                "kb_id": "test_kb",
                "content": "document content",
                "metadata": {
                    "chunk_index": 1,
                    "chunk_size": 16,
                    "doc_type": "test",
                    "version": "1.0.0"
                }
            }
        ])
        
        result = await document_service.create_document(sample_request, created_by="test_user")
        
        assert isinstance(result, KBDocument)
        assert result.kb_id == "test_kb"
        assert result.title == "Test Document"
        assert result.version == "1.0.0"
        assert result.status == "active"
        assert result.chunks == 2
        assert mock_session.add.call_count == 3  # 1 document + 2 chunks
        assert mock_session.commit.called
        assert document_service.vector_store.add_chunks.called


@pytest.mark.asyncio
async def test_create_document_validation_empty_title(document_service):
    """Test document creation with empty title"""
    request = KBUpdateRequest(
        kb_id="test_kb",
        title="",
        content="Some content",
        doc_type="test"
    )
    
    with pytest.raises(ValueError, match="title cannot be empty"):
        await document_service.create_document(request)


@pytest.mark.asyncio
async def test_create_document_validation_empty_content(document_service):
    """Test document creation with empty content"""
    request = KBUpdateRequest(
        kb_id="test_kb",
        title="Test",
        content="",
        doc_type="test"
    )
    
    with pytest.raises(ValueError, match="content cannot be empty"):
        await document_service.create_document(request)


@pytest.mark.asyncio
async def test_create_document_validation_large_content(document_service):
    """Test document creation with content exceeding size limit"""
    large_content = "x" * (10 * 1024 * 1024 + 1)  # 10MB + 1 byte
    request = KBUpdateRequest(
        kb_id="test_kb",
        title="Test",
        content=large_content,
        doc_type="test"
    )
    
    with pytest.raises(ValueError, match="exceeds 10MB limit"):
        await document_service.create_document(request)


@pytest.mark.asyncio
async def test_create_document_rollback_on_error(document_service, sample_request):
    """Test that database rollback occurs on error"""
    with patch('app.services.document_service.SessionLocal') as mock_session_local:
        mock_session = MagicMock()
        mock_session_local.return_value = mock_session
        mock_session.commit.side_effect = Exception("Database error")
        
        document_service.chunker.chunk_document = Mock(return_value=[
            {
                "chunk_id": "chunk_1",
                "doc_id": "doc_123",
                "kb_id": "test_kb",
                "content": "test",
                "metadata": {}
            }
        ])
        
        with pytest.raises(Exception):
            await document_service.create_document(sample_request)
        
        assert mock_session.rollback.called
        assert document_service.vector_store.delete_chunks.called  # Cleanup


def test_get_document_success(document_service):
    """Test successful document retrieval"""
    with patch('app.services.document_service.SessionLocal') as mock_session_local:
        mock_session = MagicMock()
        mock_session_local.return_value = mock_session
        
        # Mock document record
        mock_doc = MagicMock()
        mock_doc.doc_id = "doc_123"
        mock_doc.kb_id = "test_kb"
        mock_doc.title = "Test Document"
        mock_doc.doc_type = "test"
        mock_doc.version = "1.0.0"
        mock_doc.status = "active"
        mock_doc.created_at = datetime.utcnow()
        mock_doc.updated_at = datetime.utcnow()
        mock_doc.created_by = "test_user"
        mock_doc.approved_by = None
        mock_doc.tags = ["test"]
        
        mock_session.query.return_value.filter.return_value.first.return_value = mock_doc
        mock_session.query.return_value.filter.return_value.count.return_value = 5
        
        result = document_service.get_document("doc_123")
        
        assert isinstance(result, KBDocument)
        assert result.doc_id == "doc_123"
        assert result.title == "Test Document"
        assert result.chunks == 5


def test_get_document_not_found(document_service):
    """Test document retrieval when document doesn't exist"""
    with patch('app.services.document_service.SessionLocal') as mock_session_local:
        mock_session = MagicMock()
        mock_session_local.return_value = mock_session
        mock_session.query.return_value.filter.return_value.first.return_value = None
        
        with pytest.raises(ValueError, match="Document not found"):
            document_service.get_document("nonexistent")


@pytest.mark.asyncio
async def test_update_document_success(document_service, sample_request):
    """Test successful document update"""
    with patch('app.services.document_service.SessionLocal') as mock_session_local:
        mock_session = MagicMock()
        mock_session_local.return_value = mock_session
        
        # Mock existing document
        mock_doc = MagicMock()
        mock_doc.doc_id = "doc_123"
        mock_doc.kb_id = "test_kb"
        mock_doc.version = "1.0.0"
        mock_doc.created_by = "test_user"
        mock_doc.approved_by = None
        mock_doc.created_at = datetime.utcnow()
        mock_doc.updated_at = datetime.utcnow()
        mock_doc.chunk_ids = ["old_chunk_1", "old_chunk_2"]
        mock_doc.source_type = "manual"
        mock_doc.source_urls = []
        
        mock_session.query.return_value.filter.return_value.first.return_value = mock_doc
        mock_session.query.return_value.filter.return_value.update.return_value = None
        
        document_service.chunker.chunk_document = Mock(return_value=[
            {
                "chunk_id": "new_chunk_1",
                "doc_id": "doc_123",
                "kb_id": "test_kb",
                "content": "Updated content",
                "metadata": {"chunk_index": 0, "chunk_size": 15}
            }
        ])
        
        document_service.vector_store.add_chunks = AsyncMock(return_value=["new_chunk_1"])
        
        result = await document_service.update_document("doc_123", sample_request, updated_by="test_user")
        
        assert isinstance(result, KBDocument)
        assert result.version == "1.0.1"  # Incremented version
        assert document_service.vector_store.delete_chunks.called  # Old chunks deleted
        assert document_service.vector_store.add_chunks.called  # New chunks added
        assert mock_session.commit.called


@pytest.mark.asyncio
async def test_update_document_not_found(document_service, sample_request):
    """Test document update when document doesn't exist"""
    with patch('app.services.document_service.SessionLocal') as mock_session_local:
        mock_session = MagicMock()
        mock_session_local.return_value = mock_session
        mock_session.query.return_value.filter.return_value.first.return_value = None
        
        with pytest.raises(ValueError, match="Document not found"):
            await document_service.update_document("nonexistent", sample_request)


def test_increment_version(document_service):
    """Test version increment logic"""
    assert document_service._increment_version("1.0.0") == "1.0.1"
    assert document_service._increment_version("1.0.5") == "1.0.6"
    assert document_service._increment_version("2.1.0") == "2.1.1"
    assert document_service._increment_version(None) == "1.0.0"
    assert document_service._increment_version("invalid") == "1.0.0"


@pytest.mark.asyncio
async def test_delete_document_success(document_service):
    """Test successful document deletion"""
    with patch('app.services.document_service.SessionLocal') as mock_session_local:
        mock_session = MagicMock()
        mock_session_local.return_value = mock_session
        
        # Mock document record
        mock_doc = MagicMock()
        mock_doc.doc_id = "doc_123"
        mock_doc.chunk_ids = ["chunk_1", "chunk_2"]
        
        mock_session.query.return_value.filter.return_value.first.return_value = mock_doc
        mock_session.query.return_value.filter.return_value.update.return_value = None
        
        result = await document_service.delete_document("doc_123")
        
        assert result is True
        assert document_service.vector_store.delete_chunks.called
        assert mock_doc.status == "deleted"
        assert mock_session.commit.called


@pytest.mark.asyncio
async def test_delete_document_not_found(document_service):
    """Test document deletion when document doesn't exist"""
    with patch('app.services.document_service.SessionLocal') as mock_session_local:
        mock_session = MagicMock()
        mock_session_local.return_value = mock_session
        mock_session.query.return_value.filter.return_value.first.return_value = None
        
        with pytest.raises(ValueError, match="Document not found"):
            await document_service.delete_document("nonexistent")


def test_list_documents(document_service):
    """Test document listing with filters"""
    with patch('app.services.document_service.SessionLocal') as mock_session_local:
        mock_session = MagicMock()
        mock_session_local.return_value = mock_session
        
        # Mock document records
        mock_doc1 = MagicMock()
        mock_doc1.doc_id = "doc_1"
        mock_doc1.kb_id = "test_kb"
        mock_doc1.title = "Doc 1"
        mock_doc1.doc_type = "test"
        mock_doc1.version = "1.0.0"
        mock_doc1.status = "active"
        mock_doc1.created_at = datetime.utcnow()
        mock_doc1.updated_at = datetime.utcnow()
        mock_doc1.created_by = "user1"
        mock_doc1.approved_by = None
        mock_doc1.tags = []
        
        mock_doc2 = MagicMock()
        mock_doc2.doc_id = "doc_2"
        mock_doc2.kb_id = "test_kb"
        mock_doc2.title = "Doc 2"
        mock_doc2.doc_type = "test"
        mock_doc2.version = "1.0.0"
        mock_doc2.status = "active"
        mock_doc2.created_at = datetime.utcnow()
        mock_doc2.updated_at = datetime.utcnow()
        mock_doc2.created_by = "user1"
        mock_doc2.approved_by = None
        mock_doc2.tags = []
        
        mock_session.query.return_value.filter.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = [mock_doc1, mock_doc2]
        mock_session.query.return_value.filter.return_value.count.return_value = 3
        
        results = document_service.list_documents(kb_id="test_kb", limit=10, offset=0)
        
        assert len(results) == 2
        assert all(isinstance(doc, KBDocument) for doc in results)


def test_list_documents_with_filters(document_service):
    """Test document listing with status filter"""
    with patch('app.services.document_service.SessionLocal') as mock_session_local:
        mock_session = MagicMock()
        mock_session_local.return_value = mock_session
        mock_session.query.return_value.filter.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = []
        mock_session.query.return_value.filter.return_value.count.return_value = 0
        
        results = document_service.list_documents(status="archived", limit=10, offset=0)
        
        assert len(results) == 0
