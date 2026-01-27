"""
Contract tests for tool definitions
Validates that tool definitions match expected JSON Schema format
"""
import pytest
import json
from app.services.tools.tool_definitions import (
    get_tool_definitions,
    get_tool_definition_by_name,
    TOOL_DEFINITIONS
)


def test_tool_definitions_structure():
    """Test that tool definitions have correct structure"""
    definitions = get_tool_definitions()
    
    assert isinstance(definitions, list)
    assert len(definitions) > 0
    
    for tool_def in definitions:
        assert "type" in tool_def
        assert tool_def["type"] == "function"
        assert "function" in tool_def
        
        function = tool_def["function"]
        assert "name" in function
        assert "description" in function
        assert "parameters" in function
        
        params = function["parameters"]
        assert params["type"] == "object"
        assert "properties" in params


def test_knowledge_base_search_tool_definition():
    """Test knowledge_base_search tool definition"""
    tool_def = get_tool_definition_by_name("knowledge_base_search")
    
    assert tool_def is not None
    assert tool_def["type"] == "function"
    
    function = tool_def["function"]
    assert function["name"] == "knowledge_base_search"
    assert "knowledge base" in function["description"].lower()
    assert "mandatory" in function["description"].lower()
    
    params = function["parameters"]
    assert "query" in params["properties"]
    assert "kb_id" in params["properties"]
    assert "top_k" in params["properties"]
    
    # Check query parameter
    query_param = params["properties"]["query"]
    assert query_param["type"] == "string"
    assert query_param["minLength"] == 1
    assert query_param["maxLength"] == 5000
    
    # Check required fields
    assert "query" in params["required"]


def test_generate_response_tool_definition():
    """Test generate_response tool definition"""
    tool_def = get_tool_definition_by_name("generate_response")
    
    assert tool_def is not None
    assert tool_def["type"] == "function"
    
    function = tool_def["function"]
    assert function["name"] == "generate_response"
    assert "mandatory" in function["description"].lower()
    assert "response" in function["description"].lower()
    
    params = function["parameters"]
    assert "response" in params["properties"]
    assert "sources" in params["properties"]
    assert "confidence_score" in params["properties"]
    
    # Check response parameter
    response_param = params["properties"]["response"]
    assert response_param["type"] == "string"
    assert response_param["minLength"] == 1
    assert response_param["maxLength"] == 50000
    
    # Check sources parameter
    sources_param = params["properties"]["sources"]
    assert sources_param["type"] == "array"
    assert "items" in sources_param
    
    # Check required fields
    assert "response" in params["required"]


def test_tool_definitions_json_schema_valid():
    """Test that tool definitions are valid JSON Schema"""
    definitions = get_tool_definitions()
    
    for tool_def in definitions:
        # Should be serializable to JSON
        json_str = json.dumps(tool_def)
        assert json_str is not None
        
        # Should be deserializable
        parsed = json.loads(json_str)
        assert parsed == tool_def
        
        # Validate structure
        function = tool_def["function"]
        params = function["parameters"]
        
        # Properties should be an object
        assert isinstance(params["properties"], dict)
        
        # Required should be a list if present
        if "required" in params:
            assert isinstance(params["required"], list)


def test_get_tool_definition_by_name():
    """Test getting tool definition by name"""
    # Test existing tool
    kb_tool = get_tool_definition_by_name("knowledge_base_search")
    assert kb_tool is not None
    assert kb_tool["function"]["name"] == "knowledge_base_search"
    
    response_tool = get_tool_definition_by_name("generate_response")
    assert response_tool is not None
    assert response_tool["function"]["name"] == "generate_response"
    
    # Test non-existent tool
    nonexistent = get_tool_definition_by_name("nonexistent_tool")
    assert nonexistent is None


def test_tool_definitions_completeness():
    """Test that all expected tools are defined"""
    definitions = get_tool_definitions()
    tool_names = [tool["function"]["name"] for tool in definitions]
    
    # User Story 1 tools should be present
    assert "knowledge_base_search" in tool_names
    assert "generate_response" in tool_names
    
    # User Story 2 and 3 tools are not yet defined (will be added later)
    # assert "perplexity_search" in tool_names
    # assert "index_keywords" in tool_names
