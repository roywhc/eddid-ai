"""
AIOps Logger - Structured logging for AI operations
Logs user queries, prompts, KB searches, Perplexity interactions, etc.
"""
import json
import logging
import os
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any, List
from app.config import settings

logger = logging.getLogger(__name__)


class AIOpsLogger:
    """Structured logging service for AI operations"""
    
    def __init__(self, base_dir: str = "./aiops"):
        """
        Initialize AIOps logger
        
        Args:
            base_dir: Base directory for AIOps logs
        """
        self.base_dir = Path(base_dir)
        self.enabled = getattr(settings, 'aiops_logging_enabled', True)
        self.current_query_id: Optional[str] = None
        self.current_query_dir: Optional[Path] = None
        self.sequence = 0
        
        if self.enabled:
            self.base_dir.mkdir(parents=True, exist_ok=True)
            logger.info(f"AIOpsLogger initialized with base directory: {self.base_dir}")
        else:
            logger.info("AIOpsLogger disabled")
    
    def start_query(self, query: str, session_id: Optional[str] = None, **metadata) -> str:
        """
        Start logging a new query
        
        Args:
            query: User query string
            session_id: Optional session ID
            **metadata: Additional metadata to log
        
        Returns:
            Query ID for this interaction
        """
        if not self.enabled:
            return ""
        
        # Generate query ID
        query_id = f"{uuid.uuid4().hex[:12]}"
        self.current_query_id = query_id
        
        # Create timestamped directory
        now = datetime.utcnow()
        date_dir = self.base_dir / now.strftime("%Y-%m-%d")
        time_str = now.strftime("%H-%M-%S")
        query_dir = date_dir / f"{time_str}-{query_id}"
        query_dir.mkdir(parents=True, exist_ok=True)
        self.current_query_dir = query_dir
        self.sequence = 0
        
        # Log user query
        self.log_user_query(query, session_id, **metadata)
        
        logger.debug(f"AIOps: Started query logging - {query_id} in {query_dir}")
        return query_id
    
    def log_user_query(self, query: str, session_id: Optional[str] = None, **metadata):
        """Log user query"""
        if not self.enabled or not self.current_query_dir:
            return
        
        self.sequence += 1
        data = {
            "sequence": self.sequence,
            "timestamp": datetime.utcnow().isoformat(),
            "query": query,
            "session_id": session_id,
            "metadata": metadata
        }
        
        self._write_file("01-user-query.json", data)
    
    def log_kb_search(
        self,
        query: str,
        kb_id: str,
        results: List[Dict[str, Any]],
        confidence_score: Optional[float] = None,
        **metadata
    ):
        """Log KB search results"""
        if not self.enabled or not self.current_query_dir:
            return
        
        self.sequence += 1
        data = {
            "sequence": self.sequence,
            "timestamp": datetime.utcnow().isoformat(),
            "query": query,
            "kb_id": kb_id,
            "result_count": len(results),
            "confidence_score": confidence_score,
            "results": [
                {
                    "chunk_id": r.get("chunk_id") or (r.get("metadata", {}).get("chunk_id") if isinstance(r.get("metadata"), dict) else None),
                    "score": r.get("score", 0.0),
                    "content_preview": r.get("content", "")[:200] if isinstance(r.get("content"), str) else str(r.get("content", ""))[:200],
                    "document_id": r.get("metadata", {}).get("doc_id") if isinstance(r.get("metadata"), dict) else None,
                    "document_title": r.get("metadata", {}).get("section_title") if isinstance(r.get("metadata"), dict) else None
                }
                for r in results[:10]  # Limit to top 10 for readability
            ],
            "metadata": metadata
        }
        
        self._write_file("02-kb-search.json", data)
    
    def log_perplexity_query(
        self,
        query: str,
        additional_context: Optional[str] = None,
        response: Optional[Dict[str, Any]] = None,
        query_time_ms: Optional[float] = None,
        **metadata
    ):
        """Log Perplexity query and response"""
        if not self.enabled or not self.current_query_dir:
            return
        
        self.sequence += 1
        data = {
            "sequence": self.sequence,
            "timestamp": datetime.utcnow().isoformat(),
            "query": query,
            "additional_context": additional_context,
            "query_time_ms": query_time_ms,
            "response": {
                "answer_preview": response.get("answer", "")[:500] if response and isinstance(response.get("answer"), str) else None,
                "citation_count": len(response.get("citations", [])) if response else 0,
                "citations": response.get("citations", [])[:10] if response else []  # Limit citations
            } if response else None,
            "metadata": metadata
        }
        
        self._write_file("03-perplexity-query.json", data)
    
    def log_llm_prompt(
        self,
        system_prompt: str,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float,
        is_stock_analysis: bool = False,
        **metadata
    ):
        """Log LLM prompt"""
        if not self.enabled or not self.current_query_dir:
            return
        
        self.sequence += 1
        data = {
            "sequence": self.sequence,
            "timestamp": datetime.utcnow().isoformat(),
            "model": model,
            "temperature": temperature,
            "is_stock_analysis": is_stock_analysis,
            "system_prompt_preview": system_prompt[:1000],  # Preview of system prompt
            "system_prompt_length": len(system_prompt),
            "message_count": len(messages),
            "messages": [
                {
                    "role": msg.get("role"),
                    "content_preview": msg.get("content", "")[:500] if isinstance(msg.get("content"), str) else None,
                    "content_length": len(msg.get("content", "")) if isinstance(msg.get("content"), str) else 0
                }
                for msg in messages
            ],
            "metadata": metadata
        }
        
        self._write_file("04-llm-prompt.json", data)
    
    def log_llm_response(
        self,
        response: str,
        model: str,
        response_time_ms: Optional[float] = None,
        token_usage: Optional[Dict[str, int]] = None,
        **metadata
    ):
        """Log LLM response"""
        if not self.enabled or not self.current_query_dir:
            return
        
        self.sequence += 1
        data = {
            "sequence": self.sequence,
            "timestamp": datetime.utcnow().isoformat(),
            "model": model,
            "response_preview": response[:500],
            "response_length": len(response),
            "response_time_ms": response_time_ms,
            "token_usage": token_usage,
            "metadata": metadata
        }
        
        self._write_file("05-llm-response.json", data)
    
    def log_final_response(
        self,
        query: str,
        answer: str,
        session_id: str,
        confidence_score: float,
        used_internal_kb: bool,
        used_external_kb: bool,
        citations: List[Dict[str, Any]],
        processing_time_ms: float,
        **metadata
    ):
        """Log final response"""
        if not self.enabled or not self.current_query_dir:
            return
        
        self.sequence += 1
        data = {
            "sequence": self.sequence,
            "timestamp": datetime.utcnow().isoformat(),
            "query": query,
            "answer_preview": answer[:500],
            "answer_length": len(answer),
            "session_id": session_id,
            "confidence_score": confidence_score,
            "used_internal_kb": used_internal_kb,
            "used_external_kb": used_external_kb,
            "citation_count": len(citations),
            "citations": [
                {
                    "source": c.get("source") or (c.source if hasattr(c, "source") else None),
                    "document_id": c.get("document_id") or (c.document_id if hasattr(c, "document_id") else None),
                    "document_title": c.get("document_title") or (c.document_title if hasattr(c, "document_title") else None),
                    "url": c.get("url") or (c.url if hasattr(c, "url") else None),
                    "relevance_score": c.get("relevance_score") or (c.relevance_score if hasattr(c, "relevance_score") else None)
                }
                for c in citations[:20]  # Limit citations
            ],
            "processing_time_ms": processing_time_ms,
            "metadata": metadata
        }
        
        self._write_file("06-final-response.json", data)
    
    def log_error(self, error_type: str, error_message: str, **metadata):
        """Log error during processing"""
        if not self.enabled or not self.current_query_dir:
            return
        
        self.sequence += 1
        data = {
            "sequence": self.sequence,
            "timestamp": datetime.utcnow().isoformat(),
            "error_type": error_type,
            "error_message": error_message,
            "metadata": metadata
        }
        
        self._write_file("99-error.json", data)
    
    def _write_file(self, filename: str, data: Dict[str, Any]):
        """Write data to JSON file"""
        if not self.current_query_dir:
            return
        
        file_path = self.current_query_dir / filename
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False, default=str)
        except Exception as e:
            logger.error(f"Error writing AIOps log file {file_path}: {e}", exc_info=True)
    
    def end_query(self):
        """End current query logging"""
        if self.current_query_dir:
            # Write summary file
            summary = {
                "query_id": self.current_query_id,
                "completed_at": datetime.utcnow().isoformat(),
                "total_sequences": self.sequence
            }
            self._write_file("00-summary.json", summary)
        
        self.current_query_id = None
        self.current_query_dir = None
        self.sequence = 0


# Global instance
_aiops_logger: Optional[AIOpsLogger] = None

def get_aiops_logger() -> AIOpsLogger:
    """Get or create AIOps logger instance"""
    global _aiops_logger
    if _aiops_logger is None:
        base_dir = getattr(settings, 'aiops_log_dir', './aiops')
        _aiops_logger = AIOpsLogger(base_dir=base_dir)
    return _aiops_logger
