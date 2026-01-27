"""
Unit tests for tool call enforcer
"""
import pytest
from app.services.tool_enforcer import ToolEnforcer


def test_check_mandatory_tools_all_present():
    """Test checking mandatory tools when all are present"""
    enforcer = ToolEnforcer()
    
    tool_calls = [
        {"name": "knowledge_base_search", "parameters": {}},
        {"name": "generate_response", "parameters": {}}
    ]
    
    all_present, missing, feedback = enforcer.check_mandatory_tools(tool_calls)
    assert all_present is True
    assert len(missing) == 0
    assert feedback is None


def test_check_mandatory_tools_missing():
    """Test checking mandatory tools when some are missing"""
    enforcer = ToolEnforcer()
    
    # Missing knowledge_base_search
    tool_calls = [
        {"name": "generate_response", "parameters": {}}
    ]
    
    all_present, missing, feedback = enforcer.check_mandatory_tools(tool_calls)
    assert all_present is False
    assert "knowledge_base_search" in missing
    assert feedback is not None
    assert "mandatory" in feedback.lower()
    
    # Missing generate_response
    tool_calls = [
        {"name": "knowledge_base_search", "parameters": {}}
    ]
    
    all_present, missing, feedback = enforcer.check_mandatory_tools(tool_calls)
    assert all_present is False
    assert "generate_response" in missing
    assert feedback is not None


def test_check_mandatory_tools_empty():
    """Test checking mandatory tools with empty list"""
    enforcer = ToolEnforcer()
    
    tool_calls = []
    
    all_present, missing, feedback = enforcer.check_mandatory_tools(tool_calls)
    assert all_present is False
    assert len(missing) == 2  # Both mandatory tools missing
    assert feedback is not None


def test_check_response_tool():
    """Test checking if response tool was called"""
    enforcer = ToolEnforcer()
    
    # Response tool called
    tool_calls = [
        {"name": "knowledge_base_search", "parameters": {}},
        {"name": "generate_response", "parameters": {}}
    ]
    
    was_called, feedback = enforcer.check_response_tool(tool_calls)
    assert was_called is True
    assert feedback is None
    
    # Response tool not called
    tool_calls = [
        {"name": "knowledge_base_search", "parameters": {}}
    ]
    
    was_called, feedback = enforcer.check_response_tool(tool_calls)
    assert was_called is False
    assert feedback is not None
    assert "generate_response" in feedback.lower()


def test_check_knowledge_base_tool():
    """Test checking if knowledge base tool was called"""
    enforcer = ToolEnforcer()
    
    # KB tool called
    tool_calls = [
        {"name": "knowledge_base_search", "parameters": {}}
    ]
    
    was_called, feedback = enforcer.check_knowledge_base_tool(tool_calls)
    assert was_called is True
    assert feedback is None
    
    # KB tool not called
    tool_calls = [
        {"name": "generate_response", "parameters": {}}
    ]
    
    was_called, feedback = enforcer.check_knowledge_base_tool(tool_calls)
    assert was_called is False
    assert feedback is not None
    assert "knowledge_base_search" in feedback.lower()


def test_get_mandatory_tool_list():
    """Test getting list of mandatory tools"""
    enforcer = ToolEnforcer()
    
    mandatory_tools = enforcer.get_mandatory_tool_list()
    assert isinstance(mandatory_tools, list)
    assert "knowledge_base_search" in mandatory_tools
    assert "generate_response" in mandatory_tools


def test_validate_tool_call_sequence():
    """Test validating tool call sequence"""
    enforcer = ToolEnforcer()
    
    # Valid sequence: KB before response
    tool_calls = [
        {"name": "knowledge_base_search", "parameters": {}},
        {"name": "generate_response", "parameters": {}}
    ]
    
    is_valid, error = enforcer.validate_tool_call_sequence(tool_calls)
    assert is_valid is True
    assert error is None
    
    # Invalid sequence: response before KB
    tool_calls = [
        {"name": "generate_response", "parameters": {}},
        {"name": "knowledge_base_search", "parameters": {}}
    ]
    
    is_valid, error = enforcer.validate_tool_call_sequence(tool_calls)
    assert is_valid is False
    assert error is not None
    assert "before" in error.lower()


def test_tool_calls_with_alternative_format():
    """Test tool calls with alternative field names"""
    enforcer = ToolEnforcer()
    
    # Tool calls with "tool_name" instead of "name"
    tool_calls = [
        {"tool_name": "knowledge_base_search", "parameters": {}},
        {"tool_name": "generate_response", "parameters": {}}
    ]
    
    all_present, missing, feedback = enforcer.check_mandatory_tools(tool_calls)
    assert all_present is True
    assert len(missing) == 0
