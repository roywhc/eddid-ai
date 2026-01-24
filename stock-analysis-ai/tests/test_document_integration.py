"""Integration tests for document creation with chunking and embedding"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime
from app.services.document_service import DocumentService
from app.models import KBUpdateRequest, KBDocument


@pytest.fixture
def document_service():
    """Create DocumentService instance"""
    with patch('app.services.document_service.get_vector_store_instance') as mock_get_store:
        mock_vector_store = MagicMock()
        mock_vector_store.add_chunks = AsyncMock(return_value=["chunk_1", "chunk_2", "chunk_3"])
        mock_vector_store.delete_chunks = AsyncMock(return_value=True)
        mock_get_store.return_value = mock_vector_store
        
        service = DocumentService()
        service.vector_store = mock_vector_store
        yield service


@pytest.mark.asyncio
async def test_create_document_with_chunking_and_embedding(document_service):
    """Test that document creation properly chunks and embeds content"""
    request = KBUpdateRequest(
        kb_id="test_kb",
        title="Test Document",
        content="This is a test document. " * 50,  # Long content to ensure chunking
        doc_type="test",
        tags=["test"],
        language="en",
        source_type="manual",
        source_urls=[]
    )
    
    with patch('app.services.document_service.SessionLocal') as mock_session_local:
        mock_session = MagicMock()
        mock_session_local.return_value = mock_session
        
        # The chunker should be called automatically
        result = await document_service.create_document(request, created_by="test_user")
        
        # Verify chunking was called
        assert document_service.chunker.chunk_document.called
        
        # Verify vector store was called with chunks
        assert document_service.vector_store.add_chunks.called
        
        # Get the chunks that were passed to vector store
        call_args = document_service.vector_store.add_chunks.call_args
        chunks_passed = call_args[0][0] if call_args[0] else []
        
        # Verify chunks have correct structure
        assert len(chunks_passed) > 0
        for chunk in chunks_passed:
            assert "chunk_id" in chunk
            assert "content" in chunk
            assert "metadata" in chunk
            assert chunk["doc_id"] == result.doc_id
            assert chunk["kb_id"] == "test_kb"
        
        # Verify document was created with correct chunk count
        assert result.chunks == len(chunks_passed)
        assert result.status == "active"
        assert result.version == "1.0.0"


@pytest.mark.asyncio
async def test_update_document_rechunks_and_reembeds(document_service):
    """Test that document update re-chunks and re-embeds content"""
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
        
        # Reset mock to track new calls
        document_service.vector_store.delete_chunks.reset_mock()
        document_service.vector_store.add_chunks.reset_mock()
        
        request = KBUpdateRequest(
            kb_id="test_kb",
            title="Updated Document",
            content="Updated content. " * 50,
            doc_type="test"
        )
        
        result = await document_service.update_document("doc_123", request, updated_by="test_user")
        
        # Verify old chunks were deleted
        assert document_service.vector_store.delete_chunks.called
        delete_call = document_service.vector_store.delete_chunks.call_args[0][0]
        assert "old_chunk_1" in delete_call
        assert "old_chunk_2" in delete_call
        
        # Verify new chunks were added
        assert document_service.vector_store.add_chunks.called
        
        # Verify version was incremented
        assert result.version == "1.0.1"
        
        # Verify chunking was called
        assert document_service.chunker.chunk_document.called


@pytest.mark.asyncio
async def test_delete_document_removes_chunks_from_vector_store(document_service):
    """Test that document deletion removes chunks from vector store"""
    with patch('app.services.document_service.SessionLocal') as mock_session_local:
        mock_session = MagicMock()
        mock_session_local.return_value = mock_session
        
        # Mock document with chunks
        mock_doc = MagicMock()
        mock_doc.doc_id = "doc_123"
        mock_doc.chunk_ids = ["chunk_1", "chunk_2", "chunk_3"]
        
        mock_session.query.return_value.filter.return_value.first.return_value = mock_doc
        mock_session.query.return_value.filter.return_value.update.return_value = None
        
        result = await document_service.delete_document("doc_123")
        
        # Verify chunks were deleted from vector store
        assert document_service.vector_store.delete_chunks.called
        delete_call = document_service.vector_store.delete_chunks.call_args[0][0]
        assert len(delete_call) == 3
        assert "chunk_1" in delete_call
        assert "chunk_2" in delete_call
        assert "chunk_3" in delete_call
        
        # Verify document status was updated
        assert mock_doc.status == "deleted"
        assert result is True


@pytest.mark.asyncio
async def test_create_document_handles_chunking_errors(document_service):
    """Test that document creation handles chunking errors gracefully"""
    request = KBUpdateRequest(
        kb_id="test_kb",
        title="Test Document",
        content="Test content",
        doc_type="test"
    )
    
    with patch('app.services.document_service.SessionLocal') as mock_session_local:
        mock_session = MagicMock()
        mock_session_local.return_value = mock_session
        
        # Make chunker raise an error
        document_service.chunker.chunk_document = Mock(side_effect=Exception("Chunking error"))
        
        with pytest.raises(Exception, match="Chunking error"):
            await document_service.create_document(request)


@pytest.mark.asyncio
async def test_create_document_handles_vector_store_errors(document_service):
    """Test that document creation handles vector store errors with cleanup"""
    request = KBUpdateRequest(
        kb_id="test_kb",
        title="Test Document",
        content="Test content",
        doc_type="test"
    )
    
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
        
        # Vector store should be called to add chunks
        document_service.vector_store.add_chunks = AsyncMock(return_value=["chunk_1"])
        
        with pytest.raises(Exception):
            await document_service.create_document(request)
        
        # Verify cleanup was attempted
        assert document_service.vector_store.delete_chunks.called
        assert mock_session.rollback.called
