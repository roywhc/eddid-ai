"""Test external knowledge service (Perplexity)"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.services.external_knowledge import PerplexityService
from app.models import ExternalKnowledgeResult, Citation
from app.config import settings


@pytest.fixture
def mock_perplexity_response():
    """Create a mock Perplexity API response"""
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = "This is a test answer from Perplexity."
    mock_response.choices[0].message.citations = [
        {"url": "https://example.com/source1", "title": "Source 1"},
        {"url": "https://example.com/source2", "title": "Source 2"}
    ]
    mock_response.model_dump = MagicMock(return_value={"test": "data"})
    return mock_response


@pytest.fixture
def perplexity_service():
    """Create PerplexityService instance with mocked client"""
    with patch('app.services.external_knowledge.AsyncOpenAI') as mock_openai:
        service = PerplexityService()
        service.client = MagicMock()
        service.client.chat.completions.create = AsyncMock()
        yield service


@pytest.mark.asyncio
async def test_search_success(perplexity_service, mock_perplexity_response):
    """Test successful Perplexity search"""
    perplexity_service.client.chat.completions.create.return_value = mock_perplexity_response
    
    result = await perplexity_service.search("What is AI?")
    
    assert isinstance(result, ExternalKnowledgeResult)
    assert result.answer == "This is a test answer from Perplexity."
    assert len(result.citations) == 2
    assert result.citations[0]["url"] == "https://example.com/source1"
    assert result.query_time_ms > 0


@pytest.mark.asyncio
async def test_search_with_additional_context(perplexity_service, mock_perplexity_response):
    """Test Perplexity search with additional context"""
    perplexity_service.client.chat.completions.create.return_value = mock_perplexity_response
    
    result = await perplexity_service.search(
        "What is AI?",
        additional_context="Internal KB context about machine learning"
    )
    
    assert isinstance(result, ExternalKnowledgeResult)
    # Verify that additional context was included in the API call
    call_args = perplexity_service.client.chat.completions.create.call_args
    messages = call_args.kwargs['messages']
    user_message = messages[1]['content']
    assert "Internal KB context" in user_message


@pytest.mark.asyncio
async def test_search_api_error(perplexity_service):
    """Test Perplexity search with API error"""
    from openai import APIError
    
    perplexity_service.client.chat.completions.create.side_effect = APIError(
        message="API error",
        request=None,
        body=None
    )
    
    with pytest.raises(APIError):
        await perplexity_service.search("What is AI?")


@pytest.mark.asyncio
async def test_search_timeout(perplexity_service):
    """Test Perplexity search timeout"""
    import asyncio
    
    async def slow_response():
        await asyncio.sleep(35)  # Longer than default timeout
        return MagicMock()
    
    perplexity_service.client.chat.completions.create.side_effect = slow_response
    
    with pytest.raises(Exception):  # Should raise timeout error
        await perplexity_service.search("What is AI?")


@pytest.mark.asyncio
async def test_search_no_api_key():
    """Test Perplexity service initialization without API key"""
    with patch('app.services.external_knowledge.settings.perplexity_api_key', None):
        service = PerplexityService()
        # Should initialize but fail on actual search
        with pytest.raises(ValueError, match="Perplexity API key is required"):
            await service.search("test query")


def test_extract_citations_with_structured_citations(perplexity_service, mock_perplexity_response):
    """Test citation extraction from structured response"""
    citations = perplexity_service._extract_citations(mock_perplexity_response)
    
    assert len(citations) == 2
    assert citations[0]["url"] == "https://example.com/source1"
    assert citations[0]["title"] == "Source 1"


def test_extract_citations_from_message(perplexity_service):
    """Test citation extraction from message object"""
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.citations = [
        {"url": "https://example.com", "title": "Example"}
    ]
    
    citations = perplexity_service._extract_citations(mock_response)
    
    assert len(citations) == 1
    assert citations[0]["url"] == "https://example.com"


def test_extract_citations_from_text(perplexity_service):
    """Test citation extraction from answer text (fallback)"""
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = (
        "Here is some information. "
        "Source: https://example.com/article "
        "More info at https://example.com/docs"
    )
    
    citations = perplexity_service._extract_citations(mock_response)
    
    assert len(citations) >= 1
    assert any("example.com" in cit.get("url", "") for cit in citations)


def test_extract_citations_empty(perplexity_service):
    """Test citation extraction with no citations"""
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = "Answer with no citations"
    mock_response.choices[0].message.citations = None
    
    citations = perplexity_service._extract_citations(mock_response)
    
    # Should return empty list or try to extract from text
    assert isinstance(citations, list)


def test_convert_to_citations(perplexity_service):
    """Test conversion of Perplexity citations to Citation objects"""
    perplexity_citations = [
        {"url": "https://example.com", "title": "Example", "snippet": "Some text"},
        {"url": "https://test.com", "name": "Test Source"}
    ]
    
    citations = perplexity_service.convert_to_citations(perplexity_citations)
    
    assert len(citations) == 2
    assert all(isinstance(c, Citation) for c in citations)
    assert citations[0].source == "external"
    assert citations[0].url == "https://example.com"
    assert citations[0].document_title == "Example"
    assert citations[1].url == "https://test.com"
    assert citations[1].document_title == "Test Source"


def test_convert_to_citations_empty(perplexity_service):
    """Test conversion with empty citations"""
    citations = perplexity_service.convert_to_citations([])
    assert citations == []


@pytest.mark.asyncio
async def test_search_query_time_tracking(perplexity_service, mock_perplexity_response):
    """Test that query time is tracked correctly"""
    import time
    
    perplexity_service.client.chat.completions.create.return_value = mock_perplexity_response
    
    start = time.time()
    result = await perplexity_service.search("test")
    elapsed = (time.time() - start) * 1000
    
    assert result.query_time_ms > 0
    assert result.query_time_ms <= elapsed + 100  # Allow some margin


@pytest.mark.asyncio
async def test_search_uses_correct_model(perplexity_service, mock_perplexity_response):
    """Test that search uses configured model"""
    perplexity_service.client.chat.completions.create.return_value = mock_perplexity_response
    
    await perplexity_service.search("test")
    
    call_args = perplexity_service.client.chat.completions.create.call_args
    assert call_args.kwargs['model'] == settings.perplexity_model


@pytest.mark.asyncio
async def test_search_uses_correct_temperature(perplexity_service, mock_perplexity_response):
    """Test that search uses configured temperature"""
    perplexity_service.client.chat.completions.create.return_value = mock_perplexity_response
    
    await perplexity_service.search("test")
    
    call_args = perplexity_service.client.chat.completions.create.call_args
    assert call_args.kwargs['temperature'] == settings.llm_temperature


@pytest.mark.asyncio
async def test_search_uses_timeout(perplexity_service, mock_perplexity_response):
    """Test that search uses configured timeout"""
    perplexity_service.client.chat.completions.create.return_value = mock_perplexity_response
    
    await perplexity_service.search("test")
    
    call_args = perplexity_service.client.chat.completions.create.call_args
    assert call_args.kwargs['timeout'] == settings.perplexity_timeout
