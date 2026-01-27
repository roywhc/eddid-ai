"""
Tool call enforcer for mandatory tool usage
Detects missing mandatory tool calls and provides feedback to LLM
"""
import logging
from typing import List, Dict, Any, Optional, Set, Tuple
from app.models import ErrorResponse

logger = logging.getLogger(__name__)

# Mandatory tools that must be called for every query
MANDATORY_TOOLS = {
    "knowledge_base_search",  # Must be called for every query
    "generate_response",  # Must be called to return final response
}

# Tools that are conditionally required (based on LLM decision)
CONDITIONAL_TOOLS = {
    "perplexity_search",  # Called when KB results are insufficient
    "index_keywords",  # Called after Perplexity to index keywords
}


class ToolEnforcer:
    """Enforces mandatory tool call requirements"""
    
    def __init__(self):
        """Initialize tool enforcer"""
        self.mandatory_tools = MANDATORY_TOOLS.copy()
        self.conditional_tools = CONDITIONAL_TOOLS.copy()
    
    def check_mandatory_tools(self, tool_calls: List[Dict[str, Any]]) -> Tuple[bool, List[str], Optional[str]]:
        """
        Check if all mandatory tools have been called
        
        Args:
            tool_calls: List of tool call dictionaries with 'name' field
        
        Returns:
            Tuple of (all_present, missing_tools, feedback_message)
        """
        called_tools = {call.get("name") or call.get("tool_name") for call in tool_calls}
        missing_tools = self.mandatory_tools - called_tools
        
        if not missing_tools:
            return True, [], None
        
        # Generate feedback message for LLM
        missing_list = ", ".join(sorted(missing_tools))
        feedback = (
            f"The following mandatory tools must be called: {missing_list}. "
            f"Please call these tools before proceeding. "
            f"For knowledge_base_search, tailor the query for optimal retrieval results. "
            f"For generate_response, use this tool to return the final response to the user."
        )
        
        logger.warning(f"Missing mandatory tools: {missing_list}")
        return False, list(missing_tools), feedback
    
    def check_response_tool(self, tool_calls: List[Dict[str, Any]]) -> Tuple[bool, Optional[str]]:
        """
        Check if response generation tool was called
        
        Args:
            tool_calls: List of tool call dictionaries
        
        Returns:
            Tuple of (was_called, feedback_message)
        """
        called_tools = {call.get("name") or call.get("tool_name") for call in tool_calls}
        
        if "generate_response" in called_tools:
            return True, None
        
        feedback = (
            "The generate_response tool must be called to return the final response to the user. "
            "Do not return the response directly. Use the generate_response tool call instead."
        )
        
        logger.warning("Response generation tool not called")
        return False, feedback
    
    def check_knowledge_base_tool(self, tool_calls: List[Dict[str, Any]]) -> Tuple[bool, Optional[str]]:
        """
        Check if knowledge base tool was called
        
        Args:
            tool_calls: List of tool call dictionaries
        
        Returns:
            Tuple of (was_called, feedback_message)
        """
        called_tools = {call.get("name") or call.get("tool_name") for call in tool_calls}
        
        if "knowledge_base_search" in called_tools:
            return True, None
        
        feedback = (
            "The knowledge_base_search tool must be called for every query. "
            "Please tailor the query parameters for optimal retrieval results."
        )
        
        logger.warning("Knowledge base tool not called")
        return False, feedback
    
    def get_mandatory_tool_list(self) -> List[str]:
        """
        Get list of mandatory tool names
        
        Returns:
            List of mandatory tool names
        """
        return list(self.mandatory_tools)
    
    def validate_tool_call_sequence(
        self,
        tool_calls: List[Dict[str, Any]],
        expected_sequence: Optional[List[str]] = None
    ) -> Tuple[bool, Optional[str]]:
        """
        Validate tool call sequence (optional validation)
        
        Args:
            tool_calls: List of tool call dictionaries
            expected_sequence: Optional expected sequence of tool names
        
        Returns:
            Tuple of (is_valid, error_message)
        """
        if expected_sequence is None:
            # Default expected sequence: KB search -> (optional Perplexity) -> response generation
            expected_sequence = ["knowledge_base_search", "generate_response"]
        
        called_tools = [call.get("name") or call.get("tool_name") for call in tool_calls]
        
        # Check if mandatory tools are in expected order (if both present)
        kb_index = None
        response_index = None
        
        for i, tool_name in enumerate(called_tools):
            if tool_name == "knowledge_base_search":
                kb_index = i
            elif tool_name == "generate_response":
                response_index = i
        
        if kb_index is not None and response_index is not None:
            if kb_index > response_index:
                return False, "knowledge_base_search must be called before generate_response"
        
        return True, None
