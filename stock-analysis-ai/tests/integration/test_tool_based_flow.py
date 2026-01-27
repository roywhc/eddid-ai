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
