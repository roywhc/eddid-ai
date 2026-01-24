"""Test prompt templates"""
import pytest
from unittest.mock import patch, mock_open
from app.utils.prompt_templates import PromptTemplates
from pathlib import Path


def test_load_stock_analysis_template():
    """Test loading stock analysis template"""
    template = PromptTemplates.load_stock_analysis_template()
    
    assert template is not None
    assert len(template) > 0
    assert "professional equity research analyst" in template.lower()
    assert "{{TICKER}}" in template
    assert "{{CURRENT_DATE}}" in template
    assert "{{USER_ENQUIRY}}" in template


def test_format_stock_template():
    """Test formatting stock template with variables"""
    template = PromptTemplates.load_stock_analysis_template()
    
    formatted = PromptTemplates.format_stock_template(
        ticker="AAPL",
        current_date="2026-01-25",
        user_enquiry="Analyze Apple stock"
    )
    
    assert "AAPL" in formatted
    assert "2026-01-25" in formatted
    assert "Analyze Apple stock" in formatted
    assert "{{TICKER}}" not in formatted
    assert "{{CURRENT_DATE}}" not in formatted
    assert "{{USER_ENQUIRY}}" not in formatted


def test_format_stock_template_no_ticker():
    """Test formatting with no ticker"""
    formatted = PromptTemplates.format_stock_template(
        ticker=None,
        current_date="2026-01-25",
        user_enquiry="What is stock analysis?"
    )
    
    assert "Not specified" in formatted
    assert "2026-01-25" in formatted
    assert "What is stock analysis?" in formatted


def test_template_file_not_found_fallback():
    """Test fallback to default template when file not found"""
    with patch('pathlib.Path.exists', return_value=False):
        # Clear cached template
        PromptTemplates._stock_analysis_template = None
        
        template = PromptTemplates.load_stock_analysis_template()
        
        assert template is not None
        assert len(template) > 0
        assert "professional equity research analyst" in template.lower()


def test_template_caching():
    """Test that template is cached after first load"""
    # Clear cache
    PromptTemplates._stock_analysis_template = None
    
    template1 = PromptTemplates.load_stock_analysis_template()
    template2 = PromptTemplates.load_stock_analysis_template()
    
    # Should be the same object (cached)
    assert template1 is template2
