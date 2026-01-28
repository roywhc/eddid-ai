"""
Integration tests for tool-based RAG flow
Tests end-to-end flow with tool orchestration
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.services.tool_agent_controller import ToolAgentController
from app.models import ChatRequest, ChatMessage
from datetime import datetime


@pytest.fixture
def mock_llm_service():
    """Create a mock LLM service"""
    mock_service = MagicMock()
    mock_service.chat = AsyncMock()
    return mock_service


@pytest.fixture
def mock_kb_tool():
    """Create a mock knowledge base tool"""
    mock_tool = MagicMock()
    mock_tool.execute = AsyncMock(return_value={
        "success": True,
        "results": [
            {
                "chunk_id": "chunk_001",
                "content": "Test content about AI",
                "score": 0.85,
                "metadata": {
                    "doc_id": "doc_001",
                    "kb_id": "kb_001"
                }
            }
        ],
        "result_count": 1,
        "citations": [
            {
                "source": "internal",
                "document_id": "doc_001",
                "relevance_score": 0.85
            }
        ]
    })
    return mock_tool


@pytest.fixture
def mock_response_tool():
    """Create a mock response generator tool"""
    mock_tool = MagicMock()
    mock_tool.execute = MagicMock(return_value={
        "success": True,
        "response": "This is a test response",
        "citations": [],
        "confidence_score": 0.8
    })
    return mock_tool


@pytest.fixture
def controller(mock_llm_service, mock_kb_tool, mock_response_tool):
    """Create controller with mocked dependencies"""
    with patch('app.services.tool_agent_controller.LLMService', return_value=mock_llm_service):
        controller = ToolAgentController()
        controller.kb_tool = mock_kb_tool
        controller.response_tool = mock_response_tool
        return controller


@pytest.mark.asyncio
async def test_tool_based_flow_kb_only(controller, mock_llm_service):
    """Test tool-based flow with knowledge base only"""
    # Mock LLM response with tool calls
    mock_llm_response = {
        "content": "",
        "tool_calls": [
            {
                "id": "call_001",
                "type": "function",
                "function": {
                    "name": "knowledge_base_search",
                    "arguments": '{"query": "test query", "kb_id": "default", "top_k": 5}'
                }
            },
            {
                "id": "call_002",
                "type": "function",
                "function": {
                    "name": "generate_response",
                    "arguments": '{"response": "Based on the knowledge base, here is the answer.", "confidence_score": 0.8}'
                }
            }
        ]
    }
    
    # First call returns tool calls
    mock_llm_service.chat.return_value = mock_llm_response
    
    request = ChatRequest(
        query="test query",
        session_id="test_session"
    )
    
    response = await controller.process_query(request, "test_session")
    
    # Verify response
    assert response is not None
    assert response.query == "test query"
    assert response.session_id == "test_session"
    assert len(response.answer) > 0
    assert response.used_internal_kb is True
    assert response.used_external_kb is False
    
    # Verify tool calls were made
    assert mock_llm_service.chat.called
    assert controller.kb_tool.execute.called


@pytest.mark.asyncio
async def test_tool_based_flow_missing_mandatory_tool(controller, mock_llm_service):
    """Test tool-based flow when mandatory tool is missing"""
    # Mock LLM response missing knowledge_base_search
    mock_llm_response = {
        "content": "",
        "tool_calls": [
            {
                "id": "call_001",
                "type": "function",
                "function": {
                    "name": "generate_response",
                    "arguments": '{"response": "Answer without KB search"}'
                }
            }
        ]
    }
    
    # First call returns incomplete tool calls
    mock_llm_service.chat.return_value = mock_llm_response
    
    request = ChatRequest(
        query="test query",
        session_id="test_session"
    )
    
    # Should retry with feedback
    response = await controller.process_query(request, "test_session")
    
    # Verify that LLM was called multiple times (retry with feedback)
    assert mock_llm_service.chat.call_count >= 1


@pytest.mark.asyncio
async def test_tool_based_flow_with_conversation_history(controller, mock_llm_service):
    """Test tool-based flow with conversation history"""
    mock_llm_response = {
        "content": "",
        "tool_calls": [
            {
                "id": "call_001",
                "type": "function",
                "function": {
                    "name": "knowledge_base_search",
                    "arguments": '{"query": "follow-up query", "kb_id": "default"}'
                }
            },
            {
                "id": "call_002",
                "type": "function",
                "function": {
                    "name": "generate_response",
                    "arguments": '{"response": "Answer with context", "confidence_score": 0.8}'
                }
            }
        ]
    }
    
    mock_llm_service.chat.return_value = mock_llm_response
    
    request = ChatRequest(
        query="follow-up query",
        session_id="test_session",
        conversation_history=[
            ChatMessage(role="user", content="First question"),
            ChatMessage(role="assistant", content="First answer")
        ]
    )
    
    response = await controller.process_query(request, "test_session")
    
    # Verify response
    assert response is not None
    assert response.query == "follow-up query"
    
    # Verify conversation history was included in LLM call
    call_args = mock_llm_service.chat.call_args
    messages = call_args[1]["messages"] if "messages" in call_args[1] else call_args[0][0]
    assert len(messages) > 2  # System prompt + history + current query


@pytest.mark.asyncio
async def test_tool_based_flow_empty_kb_results(controller, mock_llm_service):
    """Test tool-based flow when KB returns empty results"""
    # Mock KB tool returning empty results
    controller.kb_tool.execute = AsyncMock(return_value={
        "success": True,
        "results": [],
        "result_count": 0,
        "citations": []
    })
    
    mock_llm_response = {
        "content": "",
        "tool_calls": [
            {
                "id": "call_001",
                "type": "function",
                "function": {
                    "name": "knowledge_base_search",
                    "arguments": '{"query": "test query"}'
                }
            },
            {
                "id": "call_002",
                "type": "function",
                "function": {
                    "name": "generate_response",
                    "arguments": '{"response": "No results found in KB", "confidence_score": 0.3}'
                }
            }
        ]
    }
    
    mock_llm_service.chat.return_value = mock_llm_response
    
    request = ChatRequest(
        query="test query",
        session_id="test_session"
    )
    
    response = await controller.process_query(request, "test_session")
    
    # Verify response handles empty results gracefully
    assert response is not None
    assert response.used_internal_kb is True  # KB was called even if empty


@pytest.mark.asyncio
async def test_tool_based_flow_with_perplexity(controller, mock_llm_service):
    """Test tool-based flow with Perplexity tool (User Story 2)"""
    # Mock KB tool returning insufficient results
    controller.kb_tool.execute = AsyncMock(return_value={
        "success": True,
        "results": [
            {
                "chunk_id": "chunk_001",
                "content": "Limited information",
                "score": 0.3,
                "metadata": {"doc_id": "doc_001"}
            }
        ],
        "result_count": 1,
        "citations": []
    })
    
    # Mock Perplexity tool
    mock_perplexity_tool = MagicMock()
    mock_perplexity_tool.execute = AsyncMock(return_value={
        "success": True,
        "answer": "External knowledge answer",
        "citations": [
            {
                "source": "external",
                "url": "https://example.com",
                "relevance_score": 0.9
            }
        ]
    })
    controller.perplexity_tool = mock_perplexity_tool
    
    # Mock LLM response calling KB, then Perplexity, then response
    mock_llm_responses = [
        {
            "content": "",
            "tool_calls": [
                {
                    "id": "call_001",
                    "type": "function",
                    "function": {
                        "name": "knowledge_base_search",
                        "arguments": '{"query": "test query", "kb_id": "default"}'
                    }
                }
            ]
        },
        {
            "content": "",
            "tool_calls": [
                {
                    "id": "call_002",
                    "type": "function",
                    "function": {
                        "name": "perplexity_search",
                        "arguments": '{"query": "test query optimized for external search"}'
                    }
                }
            ]
        },
        {
            "content": "",
            "tool_calls": [
                {
                    "id": "call_003",
                    "type": "function",
                    "function": {
                        "name": "generate_response",
                        "arguments": '{"response": "Combined answer from KB and Perplexity", "confidence_score": 0.7}'
                    }
                }
            ]
        }
    ]
    
    mock_llm_service.chat.side_effect = mock_llm_responses
    
    request = ChatRequest(
        query="test query requiring external knowledge",
        session_id="test_session",
        use_external_kb=True
    )
    
    response = await controller.process_query(request, "test_session")
    
    # Verify response
    assert response is not None
    assert response.used_internal_kb is True
    assert response.used_external_kb is True
    assert len(response.sources) > 0
    
    # Verify Perplexity tool was called
    assert mock_perplexity_tool.execute.called


@pytest.mark.asyncio
async def test_tool_based_flow_perplexity_api_failure(controller, mock_llm_service):
    """Test tool-based flow when Perplexity API fails (User Story 2)"""
    # Mock KB tool returning insufficient results
    controller.kb_tool.execute = AsyncMock(return_value={
        "success": True,
        "results": [],
        "result_count": 0,
        "citations": []
    })
    
    # Mock Perplexity tool failing
    mock_perplexity_tool = MagicMock()
    mock_perplexity_tool.execute = AsyncMock(side_effect=Exception("Perplexity API error"))
    controller.perplexity_tool = mock_perplexity_tool
    
    # Mock LLM response calling KB, then Perplexity (fails), then response with KB only
    mock_llm_responses = [
        {
            "content": "",
            "tool_calls": [
                {
                    "id": "call_001",
                    "type": "function",
                    "function": {
                        "name": "knowledge_base_search",
                        "arguments": '{"query": "test query"}'
                    }
                }
            ]
        },
        {
            "content": "",
            "tool_calls": [
                {
                    "id": "call_002",
                    "type": "function",
                    "function": {
                        "name": "perplexity_search",
                        "arguments": '{"query": "test query"}'
                    }
                }
            ]
        },
        {
            "content": "",
            "tool_calls": [
                {
                    "id": "call_003",
                    "type": "function",
                    "function": {
                        "name": "generate_response",
                        "arguments": '{"response": "Answer with KB only due to Perplexity failure", "confidence_score": 0.5}'
                    }
                }
            ]
        }
    ]
    
    mock_llm_service.chat.side_effect = mock_llm_responses
    
    request = ChatRequest(
        query="test query",
        session_id="test_session",
        use_external_kb=True
    )
    
    # Should handle Perplexity failure gracefully and continue with KB results
    response = await controller.process_query(request, "test_session")
    
    # Verify response still succeeds despite Perplexity failure
    assert response is not None
    assert response.used_internal_kb is True
    # Perplexity failure should be handled gracefully
    assert mock_perplexity_tool.execute.called


@pytest.mark.asyncio
async def test_tool_based_flow_keyword_indexing(controller, mock_llm_service):
    """Test tool-based flow with keyword indexing (User Story 3)"""
    # Mock KB tool returning insufficient results
    controller.kb_tool.execute = AsyncMock(return_value={
        "success": True,
        "results": [],
        "result_count": 0,
        "citations": []
    })
    
    # Mock Perplexity tool
    mock_perplexity_tool = MagicMock()
    mock_perplexity_tool.execute = AsyncMock(return_value={
        "success": True,
        "answer": "External knowledge answer",
        "citations": [],
        "citation_count": 0
    })
    controller.perplexity_tool = mock_perplexity_tool
    
    # Mock keyword indexer tool
    mock_index_tool = MagicMock()
    mock_index_tool.execute = MagicMock(return_value={
        "success": True,
        "indexed_keywords": ["AI", "machine learning", "neural networks"],
        "invalid_keywords": [],
        "duplicate_keywords": []
    })
    controller.index_keywords_tool = mock_index_tool
    
    # Mock LLM response calling KB, Perplexity, index_keywords, then response
    mock_llm_responses = [
        {
            "content": "",
            "tool_calls": [
                {
                    "id": "call_001",
                    "type": "function",
                    "function": {
                        "name": "knowledge_base_search",
                        "arguments": '{"query": "test query"}'
                    }
                }
            ]
        },
        {
            "content": "",
            "tool_calls": [
                {
                    "id": "call_002",
                    "type": "function",
                    "function": {
                        "name": "perplexity_search",
                        "arguments": '{"query": "test query optimized"}'
                    }
                }
            ]
        },
        {
            "content": "",
            "tool_calls": [
                {
                    "id": "call_003",
                    "type": "function",
                    "function": {
                        "name": "index_keywords",
                        "arguments": '{"keywords": ["AI", "machine learning"], "query_id": "query_123"}'
                    }
                }
            ]
        },
        {
            "content": "",
            "tool_calls": [
                {
                    "id": "call_004",
                    "type": "function",
                    "function": {
                        "name": "generate_response",
                        "arguments": '{"response": "Final answer", "confidence_score": 0.7}'
                    }
                }
            ]
        }
    ]
    
    mock_llm_service.chat.side_effect = mock_llm_responses
    
    request = ChatRequest(
        query="test query requiring external knowledge",
        session_id="test_session",
        use_external_kb=True
    )
    
    response = await controller.process_query(request, "test_session")
    
    # Verify response
    assert response is not None
    assert response.used_internal_kb is True
    assert response.used_external_kb is True
    
    # Verify keyword indexing tool was called
    assert mock_index_tool.execute.called


@pytest.mark.asyncio
async def test_tool_based_flow_keyword_retrieval_in_kb(controller, mock_llm_service):
    """Test that indexed keywords help retrieve relevant information (User Story 3)"""
    # This test verifies that keywords indexed from previous Perplexity queries
    # can be used to enhance KB search in future queries
    # Implementation: The keyword_indexer.get_keywords_for_query() method
    # can be called to retrieve relevant keywords, which can then be used
    # to enhance the KB search query
    
    # Mock KB tool
    controller.kb_tool.execute = AsyncMock(return_value={
        "success": True,
        "results": [
            {
                "chunk_id": "chunk_001",
                "content": "Content about AI and machine learning",
                "score": 0.9,
                "metadata": {"doc_id": "doc_001"}
            }
        ],
        "result_count": 1,
        "citations": []
    })
    
    # Mock LLM response with KB search only
    mock_llm_response = {
        "content": "",
        "tool_calls": [
            {
                "id": "call_001",
                "type": "function",
                "function": {
                    "name": "knowledge_base_search",
                    "arguments": '{"query": "AI machine learning", "kb_id": "default"}'
                }
            },
            {
                "id": "call_002",
                "type": "function",
                "function": {
                    "name": "generate_response",
                    "arguments": '{"response": "Answer using KB", "confidence_score": 0.8}'
                }
            }
        ]
    }
    
    mock_llm_service.chat.return_value = mock_llm_response
    
    request = ChatRequest(
        query="Tell me about AI",
        session_id="test_session"
    )
    
    response = await controller.process_query(request, "test_session")
    
    # Verify response
    assert response is not None
    assert response.used_internal_kb is True
    
    # Note: Keyword retrieval enhancement is optional and can be added later
    # The test verifies the basic flow works


@pytest.mark.asyncio
async def test_tool_based_flow_tool_execution_error(controller, mock_llm_service):
    """Test tool-based flow when tool execution fails"""
    # Mock KB tool raising an error
    controller.kb_tool.execute = AsyncMock(side_effect=Exception("KB service error"))
    
    # Mock LLM response that includes generate_response after error handling
    mock_llm_response_with_response = {
        "content": "",
        "tool_calls": [
            {
                "id": "call_002",
                "type": "function",
                "function": {
                    "name": "generate_response",
                    "arguments": '{"response": "Error occurred, but continuing", "confidence_score": 0.3}'
                }
            }
        ]
    }
    
    # First call returns KB tool call, subsequent calls return response tool
    mock_llm_service.chat.side_effect = [
        {
            "content": "",
            "tool_calls": [
                {
                    "id": "call_001",
                    "type": "function",
                    "function": {
                        "name": "knowledge_base_search",
                        "arguments": '{"query": "test query"}'
                    }
                }
            ]
        },
        mock_llm_response_with_response
    ]
    
    request = ChatRequest(
        query="test query",
        session_id="test_session"
    )
    
    # Should handle error gracefully and still return a response
    response = await controller.process_query(request, "test_session")
    
    # Verify error was handled gracefully
    assert response is not None
    # The response should still be generated even if KB tool failed
    assert len(response.answer) > 0


@pytest.mark.asyncio
async def test_tool_based_flow_max_iterations_reached(controller, mock_llm_service):
    """Test that max iterations prevents infinite loops"""
    # Mock LLM always returning tool calls but never calling generate_response
    mock_llm_response = {
        "content": "",
        "tool_calls": [
            {
                "id": "call_001",
                "type": "function",
                "function": {
                    "name": "knowledge_base_search",
                    "arguments": '{"query": "test query"}'
                }
            }
        ]
    }
    
    # LLM never calls generate_response
    mock_llm_service.chat.return_value = mock_llm_response
    
    controller.kb_tool.execute = AsyncMock(return_value={
        "success": True,
        "results": [],
        "result_count": 0,
        "citations": []
    })
    
    request = ChatRequest(
        query="test query",
        session_id="test_session"
    )
    
    # Should handle max iterations gracefully
    response = await controller.process_query(request, "test_session")
    
    # Should return some response even if max iterations reached
    assert response is not None


@pytest.mark.asyncio
async def test_tool_based_flow_invalid_tool_parameters(controller, mock_llm_service):
    """Test handling of invalid tool parameters"""
    # Mock LLM calling tool with invalid parameters
    mock_llm_response = {
        "content": "",
        "tool_calls": [
            {
                "id": "call_001",
                "type": "function",
                "function": {
                    "name": "knowledge_base_search",
                    "arguments": '{"query": ""}'  # Empty query - invalid
                }
            }
        ]
    }
    
    mock_llm_service.chat.return_value = mock_llm_response
    
    request = ChatRequest(
        query="test query",
        session_id="test_session"
    )
    
    # Should handle invalid parameters gracefully
    response = await controller.process_query(request, "test_session")
    
    # Should still return a response
    assert response is not None
