"""
Stock Analysis Query Detector
Detects if a query is related to stock analysis and extracts relevant information
"""
import re
from typing import Optional, Dict
from datetime import datetime


class StockAnalysisDetector:
    """Detects stock analysis queries and extracts ticker symbols"""
    
    # Common stock-related keywords
    STOCK_KEYWORDS = [
        'stock', 'equity', 'share', 'ticker', 'symbol', 'company',
        'analysis', 'valuation', 'price', 'earnings', 'revenue',
        'financial', 'balance sheet', 'cash flow', 'dividend',
        'buy', 'sell', 'hold', 'recommendation', 'target price',
        'pe ratio', 'p/e', 'ev/ebitda', 'market cap', 'valuation'
    ]
    
    # Ticker symbol pattern (1-5 uppercase letters, sometimes with exchange suffix)
    TICKER_PATTERN = r'\b([A-Z]{1,5})(?:\.[A-Z]+)?\b'
    
    @staticmethod
    def is_stock_analysis_query(query: str) -> bool:
        """
        Detect if query is related to stock analysis
        
        Args:
            query: User query string
        
        Returns:
            True if query appears to be stock analysis related
        """
        query_lower = query.lower()
        
        # Check for stock-related keywords
        has_keyword = any(keyword in query_lower for keyword in StockAnalysisDetector.STOCK_KEYWORDS)
        
        # Check for ticker-like patterns (all caps, 1-5 letters)
        ticker_match = re.search(StockAnalysisDetector.TICKER_PATTERN, query)
        has_ticker = ticker_match is not None
        
        return has_keyword or has_ticker
    
    @staticmethod
    def extract_ticker(query: str) -> Optional[str]:
        """
        Extract ticker symbol from query
        
        Args:
            query: User query string
        
        Returns:
            Ticker symbol if found, None otherwise
        """
        # Look for ticker pattern
        matches = re.findall(StockAnalysisDetector.TICKER_PATTERN, query)
        
        if matches:
            # Filter out common words that match the pattern
            common_words = {'AI', 'IT', 'US', 'UK', 'CEO', 'CFO', 'IPO', 'ETF', 'SEC', 'IRS'}
            for match in matches:
                ticker = match[0] if isinstance(match, tuple) else match
                if ticker not in common_words and len(ticker) >= 1:
                    return ticker
        
        return None
    
    @staticmethod
    def has_explicit_requirements(query: str) -> bool:
        """
        Check if query has explicit requirements/instructions
        
        Args:
            query: User query string
        
        Returns:
            True if query has explicit requirements
        """
        explicit_indicators = [
            'format', 'structure', 'include', 'must', 'should',
            'following', 'as follows', 'according to', 'based on',
            'template', 'use', 'follow', 'style'
        ]
        
        query_lower = query.lower()
        return any(indicator in query_lower for indicator in explicit_indicators)
    
    @staticmethod
    def get_analysis_info(query: str) -> Dict[str, Optional[str]]:
        """
        Extract stock analysis information from query
        
        Args:
            query: User query string
        
        Returns:
            Dict with ticker, current_date, and user_enquiry
        """
        ticker = StockAnalysisDetector.extract_ticker(query)
        current_date = datetime.now().strftime("%Y-%m-%d")
        
        return {
            "ticker": ticker,
            "current_date": current_date,
            "user_enquiry": query
        }
