"""Test LLM service functionality"""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.llm_service import LLMService
from app.models import RetrievalResult, ChunkMetadata
from datetime import datetime


@pytest.mark.asyncio
async def test_generate_answer_with_context():
    """Test answer generation with retrieved context"""
    service = LLMService()
    
    context = [
        RetrievalResult(
            chunk_id="chunk_001",
            content="AI is artificial intelligence",
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
            score=0.9
        )
    ]
    
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = "AI stands for Artificial Intelligence, which is..."
    
    with patch.object(service.client.chat.completions, 'create', new_callable=AsyncMock) as mock_create:
        mock_create.return_value = mock_response
        
        answer = await service.generate_answer(
            query="What is AI?",
            context=context,
            conversation_history=[]
        )
        
        assert answer is not None
        assert len(answer) > 0
        assert "AI" in answer or "Artificial Intelligence" in answer
        mock_create.assert_called_once()


@pytest.mark.asyncio
async def test_generate_answer_with_conversation_history():
    """Test answer generation includes conversation history"""
    service = LLMService()
    
    from app.models import ChatMessage
    
    conversation_history = [
        ChatMessage(role="user", content="What is machine learning?"),
        ChatMessage(role="assistant", content="Machine learning is a subset of AI.")
    ]
    
    context = []
    
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = "Based on our previous conversation..."
    
    with patch.object(service.client.chat.completions, 'create', new_callable=AsyncMock) as mock_create:
        mock_create.return_value = mock_response
        
        answer = await service.generate_answer(
            query="Tell me more",
            context=context,
            conversation_history=conversation_history
        )
        
        # Verify conversation history was included in API call
        call_args = mock_create.call_args
        messages = call_args.kwargs.get('messages', [])
        
        # Should have system prompt, conversation history, and current query
        assert len(messages) >= 2
        mock_create.assert_called_once()


@pytest.mark.asyncio
async def test_generate_answer_prompt_building():
    """Test that RAG prompt is built correctly with context"""
    service = LLMService()
    
    context = [
        RetrievalResult(
            chunk_id="chunk_001",
            content="Context content 1",
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
            score=0.9
        ),
        RetrievalResult(
            chunk_id="chunk_002",
            content="Context content 2",
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
            score=0.85
        )
    ]
    
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = "Answer"
    
    with patch.object(service.client.chat.completions, 'create', new_callable=AsyncMock) as mock_create:
        mock_create.return_value = mock_response
        
        await service.generate_answer(
            query="Test query",
            context=context,
            conversation_history=[]
        )
        
        # Verify prompt includes context
        call_args = mock_create.call_args
        messages = call_args.kwargs.get('messages', [])
        
        # System message should contain context
        system_message = next((m for m in messages if m.get('role') == 'system'), None)
        assert system_message is not None
        assert 'Context content' in system_message.get('content', '')


@pytest.mark.asyncio
async def test_generate_answer_api_error():
    """Test error handling when LLM API fails"""
    service = LLMService()
    
    context = []
    
    with patch.object(service.client.chat.completions, 'create', new_callable=AsyncMock) as mock_create:
        mock_create.side_effect = Exception("API Error")
        
        with pytest.raises(Exception):
            await service.generate_answer(
                query="Test query",
                context=context,
                conversation_history=[]
            )


@pytest.mark.asyncio
async def test_generate_answer_empty_context():
    """Test answer generation with no context"""
    service = LLMService()
    
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = "I don't have specific information about that."
    
    with patch.object(service.client.chat.completions, 'create', new_callable=AsyncMock) as mock_create:
        mock_create.return_value = mock_response
        
        answer = await service.generate_answer(
            query="Test query",
            context=[],
            conversation_history=[]
        )
        
        assert answer is not None
        mock_create.assert_called_once()
