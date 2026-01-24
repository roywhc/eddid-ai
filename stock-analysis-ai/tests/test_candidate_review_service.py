"""Test candidate review service"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime
from app.services.candidate_review_service import CandidateReviewService
from app.models import KBCandidate, KBUpdateRequest, KBDocument
from app.db.metadata_store import KBCandidateRecord


@pytest.fixture
def candidate_service():
    """Create CandidateReviewService instance with mocked dependencies"""
    with patch('app.services.candidate_review_service.DocumentService') as mock_doc_service:
        service = CandidateReviewService()
        service.document_service = MagicMock()
        service.document_service.create_document = AsyncMock()
        yield service


@pytest.fixture
def sample_candidate_record():
    """Create sample candidate record"""
    record = MagicMock()
    record.candidate_id = "candidate_123"
    record.original_query = "What is AI?"
    record.source_type = "external_perplexity"
    record.title = "What is AI?"
    record.content = "AI is artificial intelligence..."
    record.suggested_kb_id = "default_kb"
    record.suggested_category = "faq"
    record.external_urls = ["https://example.com/ai"]
    record.extracted_on = datetime.utcnow()
    record.status = "pending"
    record.reviewed_by = None
    record.review_notes = None
    record.hit_count = 1
    return record


def test_get_candidates(candidate_service):
    """Test getting candidates with filters"""
    with patch('app.services.candidate_review_service.SessionLocal') as mock_session_local:
        mock_session = MagicMock()
        mock_session_local.return_value = mock_session
        
        # Mock candidate records
        mock_candidate = MagicMock()
        mock_candidate.candidate_id = "candidate_123"
        mock_candidate.original_query = "What is AI?"
        mock_candidate.source_type = "external_perplexity"
        mock_candidate.title = "What is AI?"
        mock_candidate.content = "AI is..."
        mock_candidate.suggested_kb_id = "default_kb"
        mock_candidate.suggested_category = "faq"
        mock_candidate.external_urls = []
        mock_candidate.extracted_on = datetime.utcnow()
        mock_candidate.status = "pending"
        mock_candidate.reviewed_by = None
        mock_candidate.review_notes = None
        mock_candidate.hit_count = 1
        
        mock_session.query.return_value.filter.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = [mock_candidate]
        
        results = candidate_service.get_candidates(kb_id="default_kb", limit=10, offset=0)
        
        assert len(results) == 1
        assert isinstance(results[0], KBCandidate)
        assert results[0].candidate_id == "candidate_123"


def test_get_candidates_with_status_filter(candidate_service):
    """Test getting candidates with status filter"""
    with patch('app.services.candidate_review_service.SessionLocal') as mock_session_local:
        mock_session = MagicMock()
        mock_session_local.return_value = mock_session
        mock_session.query.return_value.filter.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = []
        
        results = candidate_service.get_candidates(status="approved", limit=10, offset=0)
        
        assert len(results) == 0


@pytest.mark.asyncio
async def test_approve_candidate_success(candidate_service, sample_candidate_record):
    """Test successful candidate approval"""
    with patch('app.services.candidate_review_service.SessionLocal') as mock_session_local:
        mock_session = MagicMock()
        mock_session_local.return_value = mock_session
        mock_session.query.return_value.filter.return_value.first.return_value = sample_candidate_record
        
        # Mock document creation
        mock_document = KBDocument(
            doc_id="doc_123",
            kb_id="default_kb",
            title="What is AI?",
            doc_type="faq",
            content="AI is...",
            version="1.0.0",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            created_by="reviewer",
            approved_by=None,
            language="en",
            tags=[],
            status="active",
            chunks=1
        )
        candidate_service.document_service.create_document.return_value = mock_document
        
        result = await candidate_service.approve_candidate(
            candidate_id="candidate_123",
            reviewer="reviewer",
            notes="Looks good"
        )
        
        assert isinstance(result, KBDocument)
        assert result.doc_id == "doc_123"
        assert sample_candidate_record.status == "approved"
        assert sample_candidate_record.reviewed_by == "reviewer"
        assert sample_candidate_record.review_notes == "Looks good"
        assert mock_session.commit.called
        assert candidate_service.document_service.create_document.called


@pytest.mark.asyncio
async def test_approve_candidate_not_found(candidate_service):
    """Test approving non-existent candidate"""
    with patch('app.services.candidate_review_service.SessionLocal') as mock_session_local:
        mock_session = MagicMock()
        mock_session_local.return_value = mock_session
        mock_session.query.return_value.filter.return_value.first.return_value = None
        
        with pytest.raises(ValueError, match="Candidate not found"):
            await candidate_service.approve_candidate("nonexistent", "reviewer")


@pytest.mark.asyncio
async def test_approve_candidate_already_reviewed(candidate_service, sample_candidate_record):
    """Test approving already reviewed candidate"""
    with patch('app.services.candidate_review_service.SessionLocal') as mock_session_local:
        mock_session = MagicMock()
        mock_session_local.return_value = mock_session
        sample_candidate_record.status = "approved"
        mock_session.query.return_value.filter.return_value.first.return_value = sample_candidate_record
        
        with pytest.raises(ValueError, match="already reviewed"):
            await candidate_service.approve_candidate("candidate_123", "reviewer")


def test_reject_candidate_success(candidate_service, sample_candidate_record):
    """Test successful candidate rejection"""
    with patch('app.services.candidate_review_service.SessionLocal') as mock_session_local:
        mock_session = MagicMock()
        mock_session_local.return_value = mock_session
        mock_session.query.return_value.filter.return_value.first.return_value = sample_candidate_record
        
        result = candidate_service.reject_candidate(
            candidate_id="candidate_123",
            reviewer="reviewer",
            notes="Not relevant"
        )
        
        assert result is True
        assert sample_candidate_record.status == "rejected"
        assert sample_candidate_record.reviewed_by == "reviewer"
        assert sample_candidate_record.review_notes == "Not relevant"
        assert mock_session.commit.called


def test_reject_candidate_not_found(candidate_service):
    """Test rejecting non-existent candidate"""
    with patch('app.services.candidate_review_service.SessionLocal') as mock_session_local:
        mock_session = MagicMock()
        mock_session_local.return_value = mock_session
        mock_session.query.return_value.filter.return_value.first.return_value = None
        
        with pytest.raises(ValueError, match="Candidate not found"):
            candidate_service.reject_candidate("nonexistent", "reviewer")


def test_reject_candidate_already_reviewed(candidate_service, sample_candidate_record):
    """Test rejecting already reviewed candidate"""
    with patch('app.services.candidate_review_service.SessionLocal') as mock_session_local:
        mock_session = MagicMock()
        mock_session_local.return_value = mock_session
        sample_candidate_record.status = "rejected"
        mock_session.query.return_value.filter.return_value.first.return_value = sample_candidate_record
        
        with pytest.raises(ValueError, match="already reviewed"):
            candidate_service.reject_candidate("candidate_123", "reviewer")


@pytest.mark.asyncio
async def test_modify_candidate_success(candidate_service, sample_candidate_record):
    """Test successful candidate modification and approval"""
    with patch('app.services.candidate_review_service.SessionLocal') as mock_session_local:
        mock_session = MagicMock()
        mock_session_local.return_value = mock_session
        mock_session.query.return_value.filter.return_value.first.return_value = sample_candidate_record
        
        # Mock document creation
        mock_document = KBDocument(
            doc_id="doc_123",
            kb_id="default_kb",
            title="Modified Title",
            doc_type="faq",
            content="Modified content",
            version="1.0.0",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            created_by="reviewer",
            approved_by=None,
            language="en",
            tags=[],
            status="active",
            chunks=1
        )
        candidate_service.document_service.create_document.return_value = mock_document
        
        request = KBUpdateRequest(
            kb_id="default_kb",
            title="Modified Title",
            content="Modified content",
            doc_type="faq"
        )
        
        result = await candidate_service.modify_candidate(
            candidate_id="candidate_123",
            request=request,
            reviewer="reviewer",
            notes="Modified before approval"
        )
        
        assert isinstance(result, KBDocument)
        assert result.title == "Modified Title"
        assert sample_candidate_record.status == "modified"
        assert sample_candidate_record.reviewed_by == "reviewer"
        assert mock_session.commit.called
        assert candidate_service.document_service.create_document.called


@pytest.mark.asyncio
async def test_modify_candidate_not_found(candidate_service):
    """Test modifying non-existent candidate"""
    with patch('app.services.candidate_review_service.SessionLocal') as mock_session_local:
        mock_session = MagicMock()
        mock_session_local.return_value = mock_session
        mock_session.query.return_value.filter.return_value.first.return_value = None
        
        request = KBUpdateRequest(
            kb_id="default_kb",
            title="Test",
            content="Test",
            doc_type="test"
        )
        
        with pytest.raises(ValueError, match="Candidate not found"):
            await candidate_service.modify_candidate("nonexistent", request, "reviewer")


@pytest.mark.asyncio
async def test_modify_candidate_already_reviewed(candidate_service, sample_candidate_record):
    """Test modifying already reviewed candidate"""
    with patch('app.services.candidate_review_service.SessionLocal') as mock_session_local:
        mock_session = MagicMock()
        mock_session_local.return_value = mock_session
        sample_candidate_record.status = "approved"
        mock_session.query.return_value.filter.return_value.first.return_value = sample_candidate_record
        
        request = KBUpdateRequest(
            kb_id="default_kb",
            title="Test",
            content="Test",
            doc_type="test"
        )
        
        with pytest.raises(ValueError, match="already reviewed"):
            await candidate_service.modify_candidate("candidate_123", request, "reviewer")
