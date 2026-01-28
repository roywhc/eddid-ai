"""
Unit tests for keyword indexer service
"""
import pytest
from unittest.mock import MagicMock, patch
from app.services.keyword_indexer import KeywordIndexer


@pytest.fixture
def mock_db():
    """Create a mock database session"""
    return MagicMock()


@pytest.fixture
def keyword_indexer():
    """Create keyword indexer instance"""
    return KeywordIndexer()


def test_validate_keyword_valid(keyword_indexer):
    """Test validation of valid keywords"""
    is_valid, error = keyword_indexer.validate_keyword("artificial intelligence")
    assert is_valid is True
    assert error is None
    
    is_valid, error = keyword_indexer.validate_keyword("machine learning")
    assert is_valid is True
    assert error is None
    
    # Minimum length
    is_valid, error = keyword_indexer.validate_keyword("ab")
    assert is_valid is True
    assert error is None
    
    # Maximum length
    is_valid, error = keyword_indexer.validate_keyword("a" * 50)
    assert is_valid is True
    assert error is None


def test_validate_keyword_invalid(keyword_indexer):
    """Test validation of invalid keywords"""
    # Empty string
    is_valid, error = keyword_indexer.validate_keyword("")
    assert is_valid is False
    assert error is not None
    
    # Whitespace only
    is_valid, error = keyword_indexer.validate_keyword("   ")
    assert is_valid is False
    assert error is not None
    
    # Too short
    is_valid, error = keyword_indexer.validate_keyword("a")
    assert is_valid is False
    assert "at least 2" in error.lower()
    
    # Too long
    long_keyword = "a" * 51
    is_valid, error = keyword_indexer.validate_keyword(long_keyword)
    assert is_valid is False
    assert "at most 50" in error.lower()
    
    # Generic word
    is_valid, error = keyword_indexer.validate_keyword("the")
    assert is_valid is False
    assert "generic" in error.lower()


def test_validate_keyword_duplicate_handling(keyword_indexer):
    """Test that duplicate keywords are detected (case-insensitive)"""
    # These should be treated as the same keyword
    keyword1 = "Machine Learning"
    keyword2 = "machine learning"
    keyword3 = "MACHINE LEARNING"
    
    # All should validate as valid
    assert keyword_indexer.validate_keyword(keyword1)[0] is True
    assert keyword_indexer.validate_keyword(keyword2)[0] is True
    assert keyword_indexer.validate_keyword(keyword3)[0] is True
    
    # The indexer should handle duplicates when storing


def test_index_keywords_new_keywords(keyword_indexer, mock_db):
    """Test indexing new keywords"""
    keywords = ["artificial intelligence", "machine learning", "neural networks"]
    query_id = "query_123"
    perplexity_result_id = "perplexity_456"
    session_id = "session_789"
    
    # Mock database operations
    with patch('app.services.keyword_indexer.get_db_session') as mock_get_db:
        mock_get_db.return_value.__enter__.return_value = mock_db
        mock_get_db.return_value.__exit__.return_value = None
        
        # Mock keyword lookup (no existing keywords)
        with patch('app.db.metadata_store.get_keyword_by_text', return_value=None):
            # Mock keyword creation
            mock_keyword = MagicMock()
            mock_keyword.keyword_id = "kw_001"
            mock_keyword.keyword_text = "artificial intelligence"
            
            with patch('app.db.metadata_store.create_keyword', return_value=mock_keyword):
                with patch('app.db.metadata_store.create_keyword_association'):
                    result = keyword_indexer.index_keywords(
                        keywords=keywords,
                        query_id=query_id,
                        perplexity_result_id=perplexity_result_id,
                        session_id=session_id
                    )
                    
                    # Should successfully index keywords
                    assert result["success"] is True
                    assert len(result["indexed_keywords"]) == 3


def test_index_keywords_duplicate_handling(keyword_indexer, mock_db):
    """Test indexing keywords with duplicate detection and merging"""
    keywords = ["machine learning", "Machine Learning"]  # Case-insensitive duplicates
    query_id = "query_123"
    perplexity_result_id = "perplexity_456"
    
    # Mock existing keyword
    existing_keyword = MagicMock()
    existing_keyword.keyword_id = "kw_existing"
    existing_keyword.keyword_text = "machine learning"
    existing_keyword.usage_count = 1
    
    with patch('app.services.keyword_indexer.get_db_session') as mock_get_db:
        mock_get_db.return_value.__enter__.return_value = mock_db
        mock_get_db.return_value.__exit__.return_value = None
        
        # Mock keyword lookup: first returns None (new), second returns existing
        with patch('app.db.metadata_store.get_keyword_by_text') as mock_get:
            mock_get.side_effect = [
                None,  # First keyword is new
                existing_keyword  # Second is duplicate
            ]
            
            with patch('app.db.metadata_store.create_keyword') as mock_create:
                with patch('app.db.metadata_store.update_keyword_usage', return_value=existing_keyword) as mock_update:
                    with patch('app.db.metadata_store.create_keyword_association'):
                        mock_new_keyword = MagicMock()
                        mock_new_keyword.keyword_id = "kw_new"
                        mock_create.return_value = mock_new_keyword
                        
                        result = keyword_indexer.index_keywords(
                            keywords=keywords,
                            query_id=query_id,
                            perplexity_result_id=perplexity_result_id
                        )
                        
                        # Should handle duplicates by updating usage
                        assert result["success"] is True
                        # Should create one new keyword and update one existing
                        assert mock_create.called
                        assert mock_update.called


def test_index_keywords_invalid_keywords_filtered(keyword_indexer, mock_db):
    """Test that invalid keywords are filtered out during indexing"""
    keywords = [
        "valid keyword",  # Valid
        "a",  # Too short
        "the",  # Generic word
        "another valid keyword",  # Valid
        "   ",  # Whitespace only
        "x" * 51  # Too long
    ]
    
    with patch('app.services.keyword_indexer.get_db_session') as mock_get_db:
        mock_get_db.return_value.__enter__.return_value = mock_db
        mock_get_db.return_value.__exit__.return_value = None
        
        with patch('app.db.metadata_store.get_keyword_by_text', return_value=None):
            with patch('app.db.metadata_store.create_keyword') as mock_create:
                with patch('app.db.metadata_store.create_keyword_association'):
                    mock_keyword = MagicMock()
                    mock_keyword.keyword_id = "kw_001"
                    mock_create.return_value = mock_keyword
                    
                    result = keyword_indexer.index_keywords(
                        keywords=keywords,
                        query_id="query_123"
                    )
                    
                    # Should only index valid keywords (2 out of 6)
                    assert result["success"] is True
                    assert len(result["indexed_keywords"]) == 2
                    assert "valid keyword" in result["indexed_keywords"]
                    assert "another valid keyword" in result["indexed_keywords"]
                    assert len(result["invalid_keywords"]) == 4
