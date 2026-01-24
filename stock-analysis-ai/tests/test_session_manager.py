"""Test session manager functionality"""
import pytest
from app.services.session_manager import SessionManager
from app.models import ChatMessage
from datetime import datetime


def test_create_session():
    """Test session creation generates unique IDs"""
    manager = SessionManager()
    
    session_id_1 = manager.create_session()
    session_id_2 = manager.create_session()
    
    assert session_id_1 is not None
    assert session_id_2 is not None
    assert session_id_1 != session_id_2
    assert isinstance(session_id_1, str)
    assert len(session_id_1) > 0


def test_add_and_get_history():
    """Test adding messages and retrieving history"""
    manager = SessionManager()
    session_id = manager.create_session()
    
    message1 = ChatMessage(
        role="user",
        content="Hello",
        timestamp=datetime.utcnow()
    )
    message2 = ChatMessage(
        role="assistant",
        content="Hi there!",
        timestamp=datetime.utcnow()
    )
    
    manager.add_message(session_id, message1)
    manager.add_message(session_id, message2)
    
    history = manager.get_history(session_id)
    
    assert len(history) == 2
    assert history[0].role == "user"
    assert history[0].content == "Hello"
    assert history[1].role == "assistant"
    assert history[1].content == "Hi there!"


def test_get_history_empty_session():
    """Test getting history for new/empty session"""
    manager = SessionManager()
    session_id = manager.create_session()
    
    history = manager.get_history(session_id)
    
    assert history == []


def test_get_history_nonexistent_session():
    """Test getting history for nonexistent session creates it"""
    manager = SessionManager()
    
    history = manager.get_history("nonexistent_session")
    
    # Should return empty list for new session
    assert history == []


def test_clear_session():
    """Test clearing session removes all messages"""
    manager = SessionManager()
    session_id = manager.create_session()
    
    message = ChatMessage(
        role="user",
        content="Test message",
        timestamp=datetime.utcnow()
    )
    
    manager.add_message(session_id, message)
    assert len(manager.get_history(session_id)) == 1
    
    manager.clear_session(session_id)
    
    history = manager.get_history(session_id)
    assert len(history) == 0


def test_multiple_sessions_independent():
    """Test multiple sessions maintain independent histories"""
    manager = SessionManager()
    session_id_1 = manager.create_session()
    session_id_2 = manager.create_session()
    
    message1 = ChatMessage(role="user", content="Session 1 message")
    message2 = ChatMessage(role="user", content="Session 2 message")
    
    manager.add_message(session_id_1, message1)
    manager.add_message(session_id_2, message2)
    
    history_1 = manager.get_history(session_id_1)
    history_2 = manager.get_history(session_id_2)
    
    assert len(history_1) == 1
    assert len(history_2) == 1
    assert history_1[0].content == "Session 1 message"
    assert history_2[0].content == "Session 2 message"


def test_add_message_preserves_order():
    """Test messages are stored in chronological order"""
    manager = SessionManager()
    session_id = manager.create_session()
    
    messages = [
        ChatMessage(role="user", content=f"Message {i}", timestamp=datetime.utcnow())
        for i in range(5)
    ]
    
    for msg in messages:
        manager.add_message(session_id, msg)
    
    history = manager.get_history(session_id)
    
    assert len(history) == 5
    for i, msg in enumerate(history):
        assert msg.content == f"Message {i}"
