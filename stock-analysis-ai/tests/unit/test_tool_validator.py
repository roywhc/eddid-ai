"""
Unit tests for tool parameter validator
"""
import pytest
from app.services.tool_validator import ToolValidator


def test_validate_tool_name_valid():
    """Test validation of valid tool names"""
    is_valid, error = ToolValidator.validate_tool_name("knowledge_base_search")
    assert is_valid is True
    assert error is None
    
    is_valid, error = ToolValidator.validate_tool_name("generate_response")
    assert is_valid is True
    assert error is None
    
    is_valid, error = ToolValidator.validate_tool_name("tool_123")
    assert is_valid is True
    assert error is None


def test_validate_tool_name_invalid():
    """Test validation of invalid tool names"""
    # Empty string
    is_valid, error = ToolValidator.validate_tool_name("")
    assert is_valid is False
    assert error is not None
    
    # None
    is_valid, error = ToolValidator.validate_tool_name(None)
    assert is_valid is False
    assert error is not None
    
    # Too long
    long_name = "a" * 101
    is_valid, error = ToolValidator.validate_tool_name(long_name)
    assert is_valid is False
    assert "maximum length" in error.lower()
    
    # Invalid characters
    is_valid, error = ToolValidator.validate_tool_name("tool@name")
    assert is_valid is False
    assert "invalid characters" in error.lower()


def test_validate_query_parameter_valid():
    """Test validation of valid query parameters"""
    is_valid, error = ToolValidator.validate_query_parameter("test query")
    assert is_valid is True
    assert error is None
    
    is_valid, error = ToolValidator.validate_query_parameter("What is AI?")
    assert is_valid is True
    assert error is None


def test_validate_query_parameter_invalid():
    """Test validation of invalid query parameters"""
    # Empty string
    is_valid, error = ToolValidator.validate_query_parameter("")
    assert is_valid is False
    assert error is not None
    
    # Whitespace only
    is_valid, error = ToolValidator.validate_query_parameter("   ")
    assert is_valid is False
    assert error is not None
    
    # Too long
    long_query = "a" * 5001
    is_valid, error = ToolValidator.validate_query_parameter(long_query)
    assert is_valid is False
    assert "maximum length" in error.lower()
    
    # Malicious pattern (XSS)
    is_valid, error = ToolValidator.validate_query_parameter("<script>alert('xss')</script>")
    assert is_valid is False
    assert "malicious" in error.lower()


def test_validate_keyword_valid():
    """Test validation of valid keywords"""
    is_valid, error = ToolValidator.validate_keyword("artificial intelligence")
    assert is_valid is True
    assert error is None
    
    is_valid, error = ToolValidator.validate_keyword("machine learning")
    assert is_valid is True
    assert error is None
    
    # Minimum length
    is_valid, error = ToolValidator.validate_keyword("ab")
    assert is_valid is True
    assert error is None
    
    # Maximum length
    is_valid, error = ToolValidator.validate_keyword("a" * 50)
    assert is_valid is True
    assert error is None


def test_validate_keyword_invalid():
    """Test validation of invalid keywords"""
    # Too short
    is_valid, error = ToolValidator.validate_keyword("a")
    assert is_valid is False
    assert "at least 2" in error.lower()
    
    # Too long
    is_valid, error = ToolValidator.validate_keyword("a" * 51)
    assert is_valid is False
    assert "at most 50" in error.lower()
    
    # Generic word
    is_valid, error = ToolValidator.validate_keyword("the")
    assert is_valid is False
    assert "generic" in error.lower()
    
    # Empty
    is_valid, error = ToolValidator.validate_keyword("")
    assert is_valid is False
    assert error is not None


def test_validate_keywords_list():
    """Test validation of keyword lists"""
    # Valid list
    is_valid, error, valid_keywords = ToolValidator.validate_keywords([
        "artificial intelligence",
        "machine learning",
        "neural networks"
    ])
    assert is_valid is True
    assert error is None
    assert len(valid_keywords) == 3
    
    # Empty list
    is_valid, error, valid_keywords = ToolValidator.validate_keywords([])
    assert is_valid is False
    assert "empty" in error.lower()
    
    # List with invalid keywords
    is_valid, error, valid_keywords = ToolValidator.validate_keywords([
        "valid keyword",
        "the",  # Generic
        "a",  # Too short
        "another valid"
    ])
    assert is_valid is True  # Some valid keywords found
    assert len(valid_keywords) == 2  # Only valid ones


def test_validate_parameters_knowledge_base_search():
    """Test parameter validation for knowledge_base_search tool"""
    # Valid parameters
    params = {"query": "test query", "kb_id": "default", "top_k": 5}
    is_valid, error = ToolValidator.validate_parameters(params, "knowledge_base_search")
    assert is_valid is True
    assert error is None
    
    # Missing query
    params = {"kb_id": "default"}
    is_valid, error = ToolValidator.validate_parameters(params, "knowledge_base_search")
    assert is_valid is False
    assert "query" in error.lower()
    
    # Invalid query
    params = {"query": ""}
    is_valid, error = ToolValidator.validate_parameters(params, "knowledge_base_search")
    assert is_valid is False


def test_validate_parameters_generate_response():
    """Test parameter validation for generate_response tool"""
    # Valid parameters
    params = {
        "response": "This is a test response",
        "sources": [],
        "confidence_score": 0.8
    }
    is_valid, error = ToolValidator.validate_parameters(params, "generate_response")
    assert is_valid is True
    assert error is None
    
    # Missing response
    params = {"sources": []}
    is_valid, error = ToolValidator.validate_parameters(params, "generate_response")
    assert is_valid is False
    assert "response" in error.lower()
    
    # Invalid response type
    params = {"response": 123}
    is_valid, error = ToolValidator.validate_parameters(params, "generate_response")
    assert is_valid is False
    assert "string" in error.lower()


def test_sanitize_string():
    """Test string sanitization"""
    # Normal string
    result = ToolValidator.sanitize_string("test string")
    assert result == "test string"
    
    # String with null bytes
    result = ToolValidator.sanitize_string("test\x00string")
    assert "\x00" not in result
    
    # String with control characters
    result = ToolValidator.sanitize_string("test\x01string")
    assert "\x01" not in result
    
    # Non-string input
    result = ToolValidator.sanitize_string(123)
    assert isinstance(result, str)
