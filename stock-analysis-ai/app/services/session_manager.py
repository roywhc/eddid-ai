"""Session manager for chat conversations"""
import logging
import uuid
from typing import List, Dict, Optional, Any
from app.models import ChatMessage
from app.services.metrics_service import get_metrics_service
from datetime import datetime

logger = logging.getLogger(__name__)


class SessionManager:
    """Manages chat sessions and conversation history"""
    
    def __init__(self):
        """Initialize session manager with in-memory storage"""
        self.sessions: Dict[str, List[ChatMessage]] = {}
        self.metrics = get_metrics_service()
        logger.info("SessionManager initialized with in-memory storage")
    
    def create_session(self) -> str:
        """
        Create a new session and return session ID
        
        Returns:
            Unique session identifier
        """
        session_id = f"session_{uuid.uuid4().hex[:12]}"
        self.sessions[session_id] = []
        logger.debug(f"Created new session: {session_id}")
        
        # Update active sessions gauge
        self.metrics.set_gauge("active_sessions", len(self.sessions))
        
        return session_id
    
    def get_history(self, session_id: str) -> List[ChatMessage]:
        """
        Retrieve conversation history for a session
        
        Args:
            session_id: Session identifier
        
        Returns:
            List of ChatMessage objects in chronological order
        """
        if session_id not in self.sessions:
            # Create session if it doesn't exist
            self.sessions[session_id] = []
            logger.debug(f"Created new session for get_history: {session_id}")
        
        history = self.sessions.get(session_id, [])
        logger.debug(f"Retrieved {len(history)} messages for session: {session_id}")
        return history.copy()  # Return copy to prevent external modification
    
    def add_message(self, session_id: str, message: ChatMessage) -> None:
        """
        Add a message to session history
        
        Args:
            session_id: Session identifier
            message: ChatMessage to add
        """
        if session_id not in self.sessions:
            self.sessions[session_id] = []
            logger.debug(f"Created new session for add_message: {session_id}")
        
        # Set timestamp if not provided
        if message.timestamp is None:
            message.timestamp = datetime.utcnow()
        
        self.sessions[session_id].append(message)
        logger.debug(f"Added {message.role} message to session: {session_id}")
    
    def clear_session(self, session_id: str) -> None:
        """
        Clear all messages from a session
        
        Args:
            session_id: Session identifier
        """
        if session_id in self.sessions:
            self.sessions[session_id] = []
            logger.debug(f"Cleared session: {session_id}")
        else:
            logger.warning(f"Attempted to clear nonexistent session: {session_id}")
    
    def get_session_count(self) -> int:
        """
        Get total number of active sessions
        
        Returns:
            Number of sessions
        """
        return len(self.sessions)
    
    def cleanup_old_sessions(self, max_age_seconds: int = 3600) -> int:
        """
        Clean up old sessions (placeholder for future database-backed implementation)
        
        Args:
            max_age_seconds: Maximum age in seconds (default: 1 hour)
        
        Returns:
            Number of sessions cleaned up
        """
        # For in-memory implementation, this is a no-op
        # Will be implemented when moving to database-backed storage
        logger.debug("cleanup_old_sessions called (no-op for in-memory storage)")
        return 0
    
    def maintain_context(self, session_id: str, tool_calls: List[Dict[str, Any]]) -> None:
        """
        Maintain conversation context across tool calls
        
        Args:
            session_id: Session identifier
            tool_calls: List of tool calls made during query processing
        
        Note:
            This method ensures conversation history is preserved across
            multiple tool calls within a single query processing flow.
            Tool calls are tracked but not added as messages to preserve
            the natural conversation flow.
        """
        # For now, this is a no-op as tool calls are tracked separately
        # In the future, this could store tool call metadata in session
        logger.debug(f"Maintaining context for session {session_id} with {len(tool_calls)} tool calls")
