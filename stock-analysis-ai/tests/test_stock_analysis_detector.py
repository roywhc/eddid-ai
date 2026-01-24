"""Test stock analysis detector"""
import pytest
from app.utils.stock_analysis_detector import StockAnalysisDetector


def test_is_stock_analysis_query_with_ticker():
    """Test detection with ticker symbol"""
    assert StockAnalysisDetector.is_stock_analysis_query("Analyze AAPL") is True
    assert StockAnalysisDetector.is_stock_analysis_query("What is the stock price of TSLA?") is True
    assert StockAnalysisDetector.is_stock_analysis_query("MSFT earnings") is True


def test_is_stock_analysis_query_with_keywords():
    """Test detection with stock-related keywords"""
    assert StockAnalysisDetector.is_stock_analysis_query("What is the stock analysis?") is True
    assert StockAnalysisDetector.is_stock_analysis_query("Company valuation") is True
    assert StockAnalysisDetector.is_stock_analysis_query("Financial analysis of the company") is True
    assert StockAnalysisDetector.is_stock_analysis_query("Should I buy this stock?") is True


def test_is_not_stock_analysis_query():
    """Test that non-stock queries are not detected"""
    assert StockAnalysisDetector.is_stock_analysis_query("What is artificial intelligence?") is False
    assert StockAnalysisDetector.is_stock_analysis_query("How does machine learning work?") is False
    assert StockAnalysisDetector.is_stock_analysis_query("Tell me a joke") is False


def test_extract_ticker():
    """Test ticker extraction"""
    assert StockAnalysisDetector.extract_ticker("Analyze AAPL stock") == "AAPL"
    assert StockAnalysisDetector.extract_ticker("What about TSLA?") == "TSLA"
    assert StockAnalysisDetector.extract_ticker("MSFT earnings report") == "MSFT"
    assert StockAnalysisDetector.extract_ticker("Stock analysis for GOOGL") == "GOOGL"


def test_extract_ticker_not_found():
    """Test ticker extraction when no ticker present"""
    assert StockAnalysisDetector.extract_ticker("What is stock analysis?") is None
    assert StockAnalysisDetector.extract_ticker("General question") is None


def test_extract_ticker_filters_common_words():
    """Test that common words are filtered out"""
    # These should not be extracted as tickers
    assert StockAnalysisDetector.extract_ticker("What is AI?") is None
    assert StockAnalysisDetector.extract_ticker("US market") is None
    assert StockAnalysisDetector.extract_ticker("CEO statement") is None


def test_has_explicit_requirements():
    """Test detection of explicit requirements"""
    assert StockAnalysisDetector.has_explicit_requirements("Analyze AAPL following this format") is True
    assert StockAnalysisDetector.has_explicit_requirements("Include the following sections") is True
    assert StockAnalysisDetector.has_explicit_requirements("Use this template") is True
    assert StockAnalysisDetector.has_explicit_requirements("Must include financial data") is True


def test_no_explicit_requirements():
    """Test queries without explicit requirements"""
    assert StockAnalysisDetector.has_explicit_requirements("Analyze AAPL") is False
    assert StockAnalysisDetector.has_explicit_requirements("What is the stock price?") is False
    assert StockAnalysisDetector.has_explicit_requirements("Tell me about TSLA") is False


def test_get_analysis_info():
    """Test extraction of analysis information"""
    query = "Analyze AAPL stock"
    info = StockAnalysisDetector.get_analysis_info(query)
    
    assert info["ticker"] == "AAPL"
    assert info["current_date"] is not None
    assert info["user_enquiry"] == query
    assert len(info["current_date"]) == 10  # YYYY-MM-DD format


def test_get_analysis_info_no_ticker():
    """Test analysis info without ticker"""
    query = "What is stock analysis?"
    info = StockAnalysisDetector.get_analysis_info(query)
    
    assert info["ticker"] is None
    assert info["user_enquiry"] == query
