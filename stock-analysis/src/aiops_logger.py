"""AIOps Logger - Saves request flows to markdown files organized by request"""

import json
import logging
from pathlib import Path
from typing import Dict, Any, Optional
from datetime import datetime
import time

logger = logging.getLogger(__name__)

class AIOpsLogger:
    """Logger for AIOps that saves request flows to markdown files."""
    
    def __init__(self, log_base_dir: Path = None):
        """
        Initialize AIOps Logger.
        
        Args:
            log_base_dir: Base directory for AIOps logs
        """
        if log_base_dir is None:
            log_base_dir = Path("./aiops_logs")
        self.log_base_dir = Path(log_base_dir)
        try:
            self.log_base_dir.mkdir(parents=True, exist_ok=True)
            logger.info(f"AIOps logger initialized with base directory: {self.log_base_dir.absolute()}")
        except Exception as e:
            logger.error(f"Failed to create AIOps log directory {self.log_base_dir}: {e}", exc_info=True)
            raise
        self.current_request_id: Optional[str] = None
        self.current_request_dir: Optional[Path] = None
        self.log_entries: list = []
    
    def start_request(self, user_query: str, model: str = None) -> str:
        """
        Start a new request flow.
        
        Args:
            user_query: User's query
            model: Model being used
            
        Returns:
            Request ID (timestamp-based)
        """
        # Generate request ID from timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")[:-3]  # Include milliseconds
        self.current_request_id = timestamp
        
        # Create request directory
        # Sanitize query for folder name (first 50 chars, alphanumeric only)
        query_safe = "".join(c if c.isalnum() or c in (' ', '-', '_') else '_' for c in user_query[:50])
        query_safe = query_safe.strip().replace(' ', '_')
        if not query_safe:
            query_safe = "query"
        folder_name = f"{timestamp}_{query_safe}"
        self.current_request_dir = self.log_base_dir / folder_name
        try:
            self.current_request_dir.mkdir(parents=True, exist_ok=True)
            logger.debug(f"Created AIOps log directory: {self.current_request_dir.absolute()}")
        except Exception as e:
            logger.error(f"Failed to create request log directory {self.current_request_dir}: {e}", exc_info=True)
            raise
        
        # Initialize log entries
        self.log_entries = []
        
        # Create request metadata
        metadata = {
            "request_id": self.current_request_id,
            "timestamp": datetime.now().isoformat(),
            "user_query": user_query,
            "model": model,
            "status": "started"
        }
        
        # Save metadata
        metadata_file = self.current_request_dir / "metadata.json"
        with open(metadata_file, "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=2)
        
        # Create main log file
        self.log_file = self.current_request_dir / "flow.md"
        
        # Write header
        self._write_markdown_header(user_query, model)
        
        logger.info(f"AIOps: Started request {self.current_request_id} - {user_query[:50]}")
        
        return self.current_request_id
    
    def log(self, location: str, message: str, data: Dict[str, Any] = None, 
            log_type: str = "INFO", hypothesis_id: str = None):
        """
        Log an entry to the current request flow.
        
        Args:
            location: Code location (e.g., "chat_agent.py:123")
            message: Log message
            data: Additional data dictionary
            log_type: Log type (INFO, ERROR, WARNING, TOOL, LLM)
            hypothesis_id: Hypothesis ID for debugging
        """
        if not self.current_request_dir:
            # No active request, skip logging
            return
        
        entry = {
            "timestamp": datetime.now().isoformat(),
            "location": location,
            "message": message,
            "data": data or {},
            "log_type": log_type,
            "hypothesis_id": hypothesis_id
        }
        
        self.log_entries.append(entry)
        self._write_markdown_entry(entry)
    
    def log_llm_request(self, model: str, prompt: str, prompt_type: str = "system"):
        """Log LLM request."""
        self.log(
            "LLM_REQUEST",
            f"LLM Request - {prompt_type}",
            {
                "model": model,
                "prompt_type": prompt_type,
                "prompt_preview": prompt[:500] if prompt else None,
                "prompt_length": len(prompt) if prompt else 0
            },
            log_type="LLM"
        )
    
    def log_llm_response(self, response: str, metadata: Dict[str, Any] = None):
        """Log LLM response."""
        self.log(
            "LLM_RESPONSE",
            "LLM Response",
            {
                "response_preview": response[:500] if response else None,
                "response_length": len(response) if response else 0,
                "metadata": metadata or {}
            },
            log_type="LLM"
        )
    
    def log_tool_call(self, tool_name: str, args: Dict[str, Any], result: Any = None):
        """Log tool call."""
        self.log(
            "TOOL_CALL",
            f"Tool Call: {tool_name}",
            {
                "tool_name": tool_name,
                "args": args,
                "result_preview": str(result)[:200] if result else None
            },
            log_type="TOOL"
        )
    
    def end_request(self, status: str = "completed", error: str = None):
        """
        End the current request flow.
        
        Args:
            status: Request status (completed, failed, etc.)
            error: Error message if failed
        """
        if not self.current_request_dir:
            return
        
        # Write footer
        self._write_markdown_footer(status, error)
        
        # Update metadata
        metadata_file = self.current_request_dir / "metadata.json"
        if metadata_file.exists():
            with open(metadata_file, "r", encoding="utf-8") as f:
                metadata = json.load(f)
            metadata["status"] = status
            metadata["end_timestamp"] = datetime.now().isoformat()
            if error:
                metadata["error"] = error
            with open(metadata_file, "w", encoding="utf-8") as f:
                json.dump(metadata, f, indent=2)
        
        # Save full log as JSON for programmatic access
        log_json_file = self.current_request_dir / "flow.json"
        with open(log_json_file, "w", encoding="utf-8") as f:
            json.dump(self.log_entries, f, indent=2)
        
        logger.info(f"AIOps: Ended request {self.current_request_id} - {status}")
        
        # Reset
        self.current_request_id = None
        self.current_request_dir = None
        self.log_entries = []
    
    def _write_markdown_header(self, user_query: str, model: str = None):
        """Write markdown header for the request flow."""
        header = f"""# AIOps Request Flow

**Request ID:** `{self.current_request_id}`  
**Timestamp:** {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}  
**User Query:** {user_query}  
**Model:** {model or "N/A"}

---

## Flow Log

"""
        with open(self.log_file, "w", encoding="utf-8") as f:
            f.write(header)
    
    def _write_markdown_entry(self, entry: Dict[str, Any]):
        """Write a log entry to markdown."""
        timestamp = entry["timestamp"]
        location = entry["location"]
        message = entry["message"]
        log_type = entry["log_type"]
        data = entry.get("data", {})
        hypothesis_id = entry.get("hypothesis_id")
        
        # Format entry
        entry_text = f"""### {log_type}: {message}

**Time:** {timestamp}  
**Location:** `{location}`  
"""
        
        if hypothesis_id:
            entry_text += f"**Hypothesis ID:** {hypothesis_id}\n"
        
        if data:
            entry_text += "\n**Data:**\n```json\n"
            entry_text += json.dumps(data, indent=2)
            entry_text += "\n```\n"
        
        entry_text += "\n---\n\n"
        
        with open(self.log_file, "a", encoding="utf-8") as f:
            f.write(entry_text)
    
    def _write_markdown_footer(self, status: str, error: str = None):
        """Write markdown footer."""
        footer = f"""
## Request Summary

**Status:** {status}  
**End Time:** {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}  
**Total Log Entries:** {len(self.log_entries)}
"""
        
        if error:
            footer += f"\n**Error:** {error}\n"
        
        footer += "\n---\n\n*End of request flow*\n"
        
        with open(self.log_file, "a", encoding="utf-8") as f:
            f.write(footer)


# Global AIOps logger instance
_aiops_logger: Optional[AIOpsLogger] = None

def get_aiops_logger(log_base_dir: Path = None) -> AIOpsLogger:
    """Get or create global AIOps logger instance."""
    global _aiops_logger
    if _aiops_logger is None:
        base_dir = log_base_dir if log_base_dir else Path("./aiops_logs")
        try:
            _aiops_logger = AIOpsLogger(base_dir)
            logger.info(f"AIOps logger initialized with base directory: {base_dir.absolute()}")
        except Exception as e:
            logger.error(f"Failed to initialize AIOps logger: {e}", exc_info=True)
            # Create a dummy logger that does nothing
            class DummyLogger:
                def start_request(self, *args, **kwargs): return "dummy"
                def log(self, *args, **kwargs): pass
                def end_request(self, *args, **kwargs): pass
                def log_llm_request(self, *args, **kwargs): pass
                def log_llm_response(self, *args, **kwargs): pass
                def log_tool_call(self, *args, **kwargs): pass
                current_request_id = None
            _aiops_logger = DummyLogger()
    return _aiops_logger

def set_aiops_logger(logger: AIOpsLogger):
    """Set global AIOps logger instance."""
    global _aiops_logger
    _aiops_logger = logger

