"""Test confidence scoring functionality"""
import pytest
from app.services.confidence import ConfidenceService
from app.models import RetrievalResult, ChunkMetadata
from datetime import datetime


def test_calculate_confidence_high_score():
    """Test confidence calculation with high relevance scores"""
    service = ConfidenceService()
    
    results = [
        RetrievalResult(
            chunk_id="chunk_001",
            content="Highly relevant content",
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
            score=0.95
        ),
        RetrievalResult(
            chunk_id="chunk_002",
            content="Relevant content",
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
            score=0.88
        )
    ]
    
    confidence = service.calculate_confidence(results, "test query")
    
    assert 0.0 <= confidence <= 1.0
    assert confidence > 0.7  # High confidence for high scores


def test_calculate_confidence_low_score():
    """Test confidence calculation with low relevance scores"""
    service = ConfidenceService()
    
    results = [
        RetrievalResult(
            chunk_id="chunk_001",
            content="Somewhat relevant content",
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
            score=0.45
        )
    ]
    
    confidence = service.calculate_confidence(results, "test query")
    
    assert 0.0 <= confidence <= 1.0
    assert confidence < 0.7  # Low confidence for low scores


def test_calculate_confidence_empty_results():
    """Test confidence calculation with no results"""
    service = ConfidenceService()
    
    confidence = service.calculate_confidence([], "test query")
    
    assert confidence == 0.0  # No confidence when no results


def test_calculate_confidence_multiple_results():
    """Test confidence increases with more high-quality results"""
    service = ConfidenceService()
    
    # Single result
    single_result = [
        RetrievalResult(
            chunk_id="chunk_001",
            content="Content",
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
    
    # Multiple results with similar scores
    multiple_results = [
        RetrievalResult(
            chunk_id=f"chunk_{i:03d}",
            content="Content",
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
        for i in range(5)
    ]
    
    single_confidence = service.calculate_confidence(single_result, "test query")
    multiple_confidence = service.calculate_confidence(multiple_results, "test query")
    
    # Multiple results should generally increase confidence
    assert multiple_confidence >= single_confidence


def test_calculate_confidence_score_distribution():
    """Test confidence considers score distribution"""
    service = ConfidenceService()
    
    # Results with wide score distribution (uncertain)
    wide_distribution = [
        RetrievalResult(
            chunk_id=f"chunk_{i:03d}",
            content="Content",
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
            score=0.9 - (i * 0.2)  # Scores: 0.9, 0.7, 0.5, 0.3, 0.1
        )
        for i in range(5)
    ]
    
    # Results with tight score distribution (certain)
    tight_distribution = [
        RetrievalResult(
            chunk_id=f"chunk_{i:03d}",
            content="Content",
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
            score=0.85  # All similar scores
        )
        for i in range(5)
    ]
    
    wide_confidence = service.calculate_confidence(wide_distribution, "test query")
    tight_confidence = service.calculate_confidence(tight_distribution, "test query")
    
    # Tight distribution should generally have higher confidence
    assert tight_confidence >= wide_confidence
