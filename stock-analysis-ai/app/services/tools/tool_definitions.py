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
    },
    {
        "type": "function",
        "function": {
            "name": "perplexity_search",
            "description": (
                "Search external knowledge base using Perplexity API for information not available "
                "in the internal knowledge base. Use this tool when knowledge base results are "
                "insufficient to answer the user's query. Optimize the query for external search "
                "by extracting key concepts and removing conversational elements."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Search query optimized for external knowledge retrieval. Should extract key concepts from the user query.",
                        "minLength": 1,
                        "maxLength": 5000
                    },
                    "additional_context": {
                        "type": "string",
                        "description": "Optional context from internal knowledge base to improve external search results",
                        "maxLength": 2000
                    }
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "index_keywords",
            "description": (
                "Index keywords from Perplexity results for future knowledge base queries. "
                "This tool should be called after perplexity_search to extract and store "
                "key concepts from the external knowledge results. Keywords must be 2-50 "
                "characters, non-empty, and not generic words (e.g., 'the', 'is', 'how'). "
                "Extract meaningful concepts, entities, and technical terms."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "keywords": {
                        "type": "array",
                        "description": "List of keyword strings to index. Each keyword should be a meaningful concept (2-50 characters).",
                        "items": {
                            "type": "string",
                            "minLength": 2,
                            "maxLength": 50
                        },
                        "minItems": 1,
                        "maxItems": 50
                    },
                    "query_id": {
                        "type": "string",
                        "description": "Query ID for associating keywords with the original query"
                    },
                    "perplexity_result_id": {
                        "type": "string",
                        "description": "Optional Perplexity result ID for traceability"
                    },
                    "session_id": {
                        "type": "string",
                        "description": "Optional session ID"
                    }
                },
                "required": ["keywords", "query_id"]
            }
        }
    }
]

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
