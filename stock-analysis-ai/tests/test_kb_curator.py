"""Test KB curator service"""
import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime
from app.services.kb_curator import KBCuratorService
from app.models import KBCandidate, Citation
from app.config import settings


@pytest.fixture
def kb_curator():
    """Create KBCuratorService instance"""
    return KBCuratorService()


@pytest.fixture
def sample_citations():
    """Create sample citations for testing"""
    return [
        Citation(
            source="external",
            document_id=None,
            document_title="External Source 1",
            url="https://example.com/source1",
            relevance_score=None,
            snippet="Some content"
        ),
        Citation(
            source="internal",
            document_id="doc_001",
            document_title="Internal Doc",
            url=None,
            relevance_score=0.9,
            snippet="Internal content"
        ),
        Citation(
            source="external",
            document_id=None,
            document_title="External Source 2",
            url="https://example.com/source2",
            relevance_score=None,
            snippet="More content"
        )
    ]


def test_generate_candidate_with_external_citations(kb_curator, sample_citations):
    """Test candidate generation with external citations"""
    query = "What is machine learning?"
    answer = "Machine learning is a subset of AI..."
    
    candidate = kb_curator.generate_candidate(query, answer, sample_citations)
    
    assert candidate is not None
    assert isinstance(candidate, KBCandidate)
    assert candidate.original_query == query
    assert candidate.content == answer
    assert candidate.source_type == "external_perplexity"
    assert len(candidate.external_urls) == 2
    assert "https://example.com/source1" in candidate.external_urls
    assert "https://example.com/source2" in candidate.external_urls
    assert candidate.status == "pending"
    assert candidate.hit_count == 1


def test_generate_candidate_no_external_citations(kb_curator):
    """Test candidate generation with no external citations"""
    query = "What is AI?"
    answer = "AI is..."
    citations = [
        Citation(
            source="internal",
            document_id="doc_001",
            document_title="Internal Doc",
            url=None,
            relevance_score=0.9
        )
    ]
    
    candidate = kb_curator.generate_candidate(query, answer, citations)
    
    assert candidate is None  # Should not generate candidate without external citations


def test_generate_candidate_disabled(kb_curator, sample_citations):
    """Test candidate generation when disabled"""
    with patch('app.services.kb_curator.settings.kb_update_enabled', False):
        curator = KBCuratorService()
        candidate = curator.generate_candidate("test", "answer", sample_citations)
        assert candidate is None


def test_generate_candidate_title_from_query(kb_curator, sample_citations):
    """Test that candidate title is generated from query"""
    query = "What is artificial intelligence?"
    answer = "AI is..."
    
    candidate = kb_curator.generate_candidate(query, answer, sample_citations)
    
    assert candidate.title == query  # Short query should be used as-is


def test_generate_candidate_title_truncated(kb_curator, sample_citations):
    """Test that long query is truncated for title"""
    long_query = "What is " + "x" * 200  # Very long query
    answer = "Answer"
    
    candidate = kb_curator.generate_candidate(long_query, answer, sample_citations)
    
    assert len(candidate.title) <= 100
    assert candidate.title.endswith("...")


def test_save_candidate_new(kb_curator, sample_citations):
    """Test saving a new candidate"""
    query = "What is AI?"
    answer = "AI is..."
    candidate = kb_curator.generate_candidate(query, answer, sample_citations)
    
    with patch('app.services.kb_curator.SessionLocal') as mock_session_local:
        mock_session = MagicMock()
        mock_session_local.return_value = mock_session
        mock_session.query.return_value.filter.return_value.first.return_value = None  # No existing
        
        candidate_id = kb_curator.save_candidate(candidate)
        
        assert candidate_id == candidate.candidate_id
        mock_session.add.assert_called_once()
        mock_session.commit.assert_called_once()
        mock_session.close.assert_called_once()


def test_save_candidate_existing(kb_curator, sample_citations):
    """Test saving candidate when one already exists"""
    query = "What is AI?"
    answer = "AI is..."
    candidate = kb_curator.generate_candidate(query, answer, sample_citations)
    
    with patch('app.services.kb_curator.SessionLocal') as mock_session_local:
        mock_session = MagicMock()
        mock_session_local.return_value = mock_session
        
        # Mock existing candidate
        existing = MagicMock()
        existing.candidate_id = "existing_id"
        existing.hit_count = 5
        mock_session.query.return_value.filter.return_value.first.return_value = existing
        
        candidate_id = kb_curator.save_candidate(candidate)
        
        assert candidate_id == "existing_id"
        assert existing.hit_count == 6  # Incremented
        mock_session.add.assert_not_called()  # Should not add new
        mock_session.commit.assert_called_once()


def test_save_candidate_error_handling(kb_curator, sample_citations):
    """Test error handling when saving candidate"""
    query = "What is AI?"
    answer = "AI is..."
    candidate = kb_curator.generate_candidate(query, answer, sample_citations)
    
    with patch('app.services.kb_curator.SessionLocal') as mock_session_local:
        mock_session = MagicMock()
        mock_session_local.return_value = mock_session
        mock_session.query.side_effect = Exception("Database error")
        
        with pytest.raises(Exception):
            kb_curator.save_candidate(candidate)
        
        mock_session.close.assert_called_once()  # Should close even on error


def test_generate_and_save_candidate(kb_curator, sample_citations):
    """Test generate and save in one step"""
    query = "What is AI?"
    answer = "AI is..."
    
    with patch('app.services.kb_curator.SessionLocal') as mock_session_local:
        mock_session = MagicMock()
        mock_session_local.return_value = mock_session
        mock_session.query.return_value.filter.return_value.first.return_value = None
        
        candidate_id = kb_curator.generate_and_save_candidate(query, answer, sample_citations)
        
        assert candidate_id is not None
        assert isinstance(candidate_id, str)
        mock_session.add.assert_called_once()
        mock_session.commit.assert_called_once()


def test_generate_and_save_candidate_no_external(kb_curator):
    """Test generate and save with no external citations"""
    query = "What is AI?"
    answer = "AI is..."
    citations = [
        Citation(source="internal", document_id="doc_001", document_title="Doc")
    ]
    
    candidate_id = kb_curator.generate_and_save_candidate(query, answer, citations)
    
    assert candidate_id is None  # Should not generate without external citations


def test_generate_candidate_kb_id(kb_curator, sample_citations):
    """Test that candidate uses specified kb_id"""
    query = "What is AI?"
    answer = "AI is..."
    kb_id = "custom_kb"
    
    candidate = kb_curator.generate_candidate(query, answer, sample_citations, kb_id=kb_id)
    
    assert candidate.suggested_kb_id == kb_id


def test_generate_candidate_default_kb_id(kb_curator, sample_citations):
    """Test that candidate uses default kb_id when not specified"""
    query = "What is AI?"
    answer = "AI is..."
    
    candidate = kb_curator.generate_candidate(query, answer, sample_citations)
    
    assert candidate.suggested_kb_id == "default_kb"
