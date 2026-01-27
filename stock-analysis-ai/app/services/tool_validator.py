"""
Tool parameter validator for tool call security and validation
Validates tool call parameters to prevent injection attacks and malformed requests
"""
import re
import logging
from typing import Dict, Any, List, Optional, Tuple
from app.models import ErrorResponse

logger = logging.getLogger(__name__)

# Maximum lengths for different parameter types
MAX_QUERY_LENGTH = 5000
MAX_TOOL_NAME_LENGTH = 100
MAX_PARAMETER_COUNT = 50

# Potentially malicious patterns to reject
MALICIOUS_PATTERNS = [
    r'<script[^>]*>.*?</script>',  # XSS script tags
    r'javascript:',  # JavaScript protocol
    r'on\w+\s*=',  # Event handlers (onclick, onerror, etc.)
    r'data:text/html',  # Data URI with HTML
    r'vbscript:',  # VBScript protocol
    r'SELECT\s+.*\s+FROM',  # SQL injection patterns (basic)
    r'UNION\s+SELECT',  # SQL UNION injection
    r';\s*(DROP|DELETE|UPDATE|INSERT)',  # SQL command injection
    r'exec\s*\(',  # Code execution attempts
    r'eval\s*\(',  # Eval attempts
    r'__import__',  # Python import attempts
    r'subprocess',  # Subprocess attempts
    r'os\.system',  # OS system calls
]

# Generic words that should not be indexed as keywords
GENERIC_WORDS = {
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'are', 'was', 'were', 'be',
    'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
    'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this',
    'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
    'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how'
}


class ToolValidator:
    """Validates tool call parameters for security and correctness"""
    
    @staticmethod
    def validate_tool_name(tool_name: str) -> Tuple[bool, Optional[str]]:
        """
        Validate tool name
        
        Args:
            tool_name: Name of the tool to validate
        
        Returns:
            Tuple of (is_valid, error_message)
        """
        if not tool_name or not isinstance(tool_name, str):
            return False, "Tool name must be a non-empty string"
        
        if len(tool_name) > MAX_TOOL_NAME_LENGTH:
            return False, f"Tool name exceeds maximum length of {MAX_TOOL_NAME_LENGTH} characters"
        
        # Allow alphanumeric, underscore, and hyphen
        if not re.match(r'^[a-zA-Z0-9_-]+$', tool_name):
            return False, "Tool name contains invalid characters (only alphanumeric, underscore, and hyphen allowed)"
        
        return True, None
    
    @staticmethod
    def validate_query_parameter(query: str, param_name: str = "query") -> Tuple[bool, Optional[str]]:
        """
        Validate query parameter (for KB search, Perplexity search, etc.)
        
        Args:
            query: Query string to validate
            param_name: Name of the parameter for error messages
        
        Returns:
            Tuple of (is_valid, error_message)
        """
        if not query or not isinstance(query, str):
            return False, f"{param_name} must be a non-empty string"
        
        query = query.strip()
        if not query:
            return False, f"{param_name} cannot be empty or whitespace only"
        
        if len(query) > MAX_QUERY_LENGTH:
            return False, f"{param_name} exceeds maximum length of {MAX_QUERY_LENGTH} characters"
        
        # Check for malicious patterns
        for pattern in MALICIOUS_PATTERNS:
            if re.search(pattern, query, re.IGNORECASE | re.DOTALL):
                logger.warning(f"Rejected {param_name} containing potentially malicious pattern: {pattern[:50]}")
                return False, f"{param_name} contains potentially malicious content"
        
        return True, None
    
    @staticmethod
    def validate_keyword(keyword: str) -> Tuple[bool, Optional[str]]:
        """
        Validate keyword for indexing
        
        Args:
            keyword: Keyword string to validate
        
        Returns:
            Tuple of (is_valid, error_message)
        """
        if not keyword or not isinstance(keyword, str):
            return False, "Keyword must be a non-empty string"
        
        keyword = keyword.strip()
        if not keyword:
            return False, "Keyword cannot be empty or whitespace only"
        
        if len(keyword) < 2:
            return False, "Keyword must be at least 2 characters long"
        
        if len(keyword) > 50:
            return False, "Keyword must be at most 50 characters long"
        
        # Check if keyword is generic
        if keyword.lower() in GENERIC_WORDS:
            return False, f"Keyword '{keyword}' is too generic and cannot be indexed"
        
        # Check for malicious patterns
        for pattern in MALICIOUS_PATTERNS:
            if re.search(pattern, keyword, re.IGNORECASE):
                logger.warning(f"Rejected keyword containing potentially malicious pattern: {pattern[:50]}")
                return False, "Keyword contains potentially malicious content"
        
        return True, None
    
    @staticmethod
    def validate_keywords(keywords: List[str]) -> Tuple[bool, Optional[str], List[str]]:
        """
        Validate a list of keywords
        
        Args:
            keywords: List of keyword strings
        
        Returns:
            Tuple of (is_valid, error_message, valid_keywords)
        """
        if not isinstance(keywords, list):
            return False, "Keywords must be a list", []
        
        if len(keywords) == 0:
            return False, "Keywords list cannot be empty", []
        
        if len(keywords) > 100:  # Reasonable limit
            return False, "Keywords list exceeds maximum length of 100", []
        
        valid_keywords = []
        for keyword in keywords:
            is_valid, error = ToolValidator.validate_keyword(keyword)
            if is_valid:
                valid_keywords.append(keyword.strip())
            else:
                logger.debug(f"Skipping invalid keyword: {keyword} - {error}")
        
        if len(valid_keywords) == 0:
            return False, "No valid keywords found in list", []
        
        return True, None, valid_keywords
    
    @staticmethod
    def validate_parameters(parameters: Dict[str, Any], tool_name: str) -> Tuple[bool, Optional[str]]:
        """
        Validate tool call parameters
        
        Args:
            parameters: Dictionary of parameters
            tool_name: Name of the tool (for tool-specific validation)
        
        Returns:
            Tuple of (is_valid, error_message)
        """
        if not isinstance(parameters, dict):
            return False, "Parameters must be a dictionary"
        
        if len(parameters) > MAX_PARAMETER_COUNT:
            return False, f"Parameters exceed maximum count of {MAX_PARAMETER_COUNT}"
        
        # Tool-specific validation
        if tool_name == "knowledge_base_search":
            if "query" not in parameters:
                return False, "Missing required parameter: query"
            is_valid, error = ToolValidator.validate_query_parameter(parameters["query"], "query")
            if not is_valid:
                return False, error
        
        elif tool_name == "perplexity_search":
            if "query" not in parameters:
                return False, "Missing required parameter: query"
            is_valid, error = ToolValidator.validate_query_parameter(parameters["query"], "query")
            if not is_valid:
                return False, error
        
        elif tool_name == "index_keywords":
            if "keywords" not in parameters:
                return False, "Missing required parameter: keywords"
            if not isinstance(parameters["keywords"], list):
                return False, "Keywords parameter must be a list"
            is_valid, error, _ = ToolValidator.validate_keywords(parameters["keywords"])
            if not is_valid:
                return False, error
        
        elif tool_name == "generate_response":
            if "response" not in parameters:
                return False, "Missing required parameter: response"
            if not isinstance(parameters["response"], str):
                return False, "Response parameter must be a string"
            if len(parameters["response"]) > 50000:  # Reasonable limit for response
                return False, "Response exceeds maximum length of 50000 characters"
        
        # Sanitize string parameters
        for key, value in parameters.items():
            if isinstance(value, str):
                # Check for malicious patterns in all string parameters
                for pattern in MALICIOUS_PATTERNS:
                    if re.search(pattern, value, re.IGNORECASE | re.DOTALL):
                        logger.warning(f"Rejected parameter '{key}' containing potentially malicious pattern")
                        return False, f"Parameter '{key}' contains potentially malicious content"
        
        return True, None
    
    @staticmethod
    def sanitize_string(value: str) -> str:
        """
        Sanitize a string value by removing potentially dangerous characters
        
        Args:
            value: String to sanitize
        
        Returns:
            Sanitized string
        """
        if not isinstance(value, str):
            return str(value)
        
        # Remove null bytes
        value = value.replace('\x00', '')
        
        # Remove control characters except newlines and tabs
        value = re.sub(r'[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]', '', value)
        
        return value.strip()
