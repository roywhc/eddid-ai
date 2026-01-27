"""
Tool definitions for LLM function calling
Defines JSON Schema for each tool that the LLM can call
"""
from typing import Dict, Any, List, Optional

# Tool definitions in OpenAI function calling format (JSON Schema)
TOOL_DEFINITIONS: List[Dict[str, Any]] = [
    {
        "type": "function",
        "function": {
            "name": "knowledge_base_search",
            "description": (
                "Search the internal knowledge base for relevant information. "
                "This tool is MANDATORY for every query. Tailor the query parameters "
                "for optimal retrieval results. The query should be optimized for semantic search."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Search query optimized for knowledge base retrieval. Should be clear and specific.",
                        "minLength": 1,
                        "maxLength": 5000
                    },
                    "kb_id": {
                        "type": "string",
                        "description": "Knowledge base identifier to search within",
                        "default": "default"
                    },
                    "top_k": {
                        "type": "integer",
                        "description": "Number of top results to retrieve",
                        "default": 5,
                        "minimum": 1,
                        "maximum": 20
                    }
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "generate_response",
            "description": (
                "Generate and return the final response to the user. "
                "This tool is MANDATORY - you must use this tool to return the response, "
                "not return it directly. Include citations and source attribution from "
                "knowledge base and Perplexity results."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "response": {
                        "type": "string",
                        "description": "The final answer to return to the user. Should be comprehensive and well-structured.",
                        "minLength": 1,
                        "maxLength": 50000
                    },
                    "sources": {
                        "type": "array",
                        "description": "List of citations and sources used in the response",
                        "items": {
                            "type": "object",
                            "properties": {
                                "source": {
                                    "type": "string",
                                    "enum": ["internal", "external"],
                                    "description": "Source type: 'internal' for KB, 'external' for Perplexity"
                                },
                                "document_id": {
                                    "type": "string",
                                    "description": "Document ID if from internal KB"
                                },
                                "document_title": {
                                    "type": "string",
                                    "description": "Document title"
                                },
                                "url": {
                                    "type": "string",
                                    "description": "URL if from external source"
                                },
                                "relevance_score": {
                                    "type": "number",
                                    "description": "Relevance score (0-1)"
                                }
                            },
                            "required": ["source"]
                        }
                    },
                    "confidence_score": {
                        "type": "number",
                        "description": "Confidence score in the answer quality (0-1)",
                        "minimum": 0,
                        "maximum": 1,
                        "default": 0.8
                    }
                },
                "required": ["response"]
            }
        }
    }
]

# Additional tool definitions will be added for User Story 2 (Perplexity) and User Story 3 (Keyword indexing)

def get_tool_definitions() -> List[Dict[str, Any]]:
    """
    Get all tool definitions
    
    Returns:
        List of tool definition dictionaries in OpenAI function calling format
    """
    return TOOL_DEFINITIONS.copy()

def get_tool_definition_by_name(tool_name: str) -> Optional[Dict[str, Any]]:
    """
    Get tool definition by name
    
    Args:
        tool_name: Name of the tool
    
    Returns:
        Tool definition dictionary or None if not found
    """
    for tool_def in TOOL_DEFINITIONS:
        if tool_def.get("function", {}).get("name") == tool_name:
            return tool_def
    return None
