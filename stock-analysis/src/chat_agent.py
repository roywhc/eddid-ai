"""Chat Agent - Outermost layer for natural language user interaction"""

import logging
import re
from typing import Dict, Any, Optional, List
from datetime import datetime

from langchain.agents import create_agent
from langchain_openai import ChatOpenAI
from langchain_core.runnables import RunnableLambda
import os

from .kb_manager_agent import KBManagerAgent

logger = logging.getLogger(__name__)


class ChatAgent:
    """Chat Agent - Handles natural language queries and coordinates with KB Manager."""
    
    # Common stock ticker mappings
    TICKER_MAPPINGS = {
        "apple": "AAPL",
        "microsoft": "MSFT",
        "google": "GOOGL",
        "alphabet": "GOOGL",
        "amazon": "AMZN",
        "tesla": "TSLA",
        "nvidia": "NVDA",
        "meta": "META",
        "facebook": "META",
    }
    
    def __init__(
        self,
        knowledge_base_dir: str,
        openrouter_api_key: Optional[str] = None,
        perplexity_api_key: Optional[str] = None,
        model: str = "openai/gpt-4o-mini"
    ):
        """
        Initialize Chat Agent.
        
        Args:
            knowledge_base_dir: Root directory of the knowledge base
            openrouter_api_key: OpenRouter API key for agent (defaults to OPENROUTER_API_KEY env var)
            perplexity_api_key: Perplexity API key for research
            model: LLM model to use for agent (OpenRouter model identifier, e.g., "openai/gpt-4o-mini")
        """
        from pathlib import Path
        
        self.kb_dir = Path(knowledge_base_dir)
        self.kb_manager = KBManagerAgent(
            knowledge_base_dir=self.kb_dir,
            api_key=perplexity_api_key,
            model=model,
            openrouter_api_key=openrouter_api_key
        )
        
        # Create agent with KB Manager as tool
        self.tools = self._create_tools()
        self.agent = self._create_agent(model, openrouter_api_key)
    
    def _create_tools(self) -> List:
        """Create LangChain tools."""
        from langchain_core.tools import StructuredTool
        
        def query_kb_tool(
            query_type: str,
            tickers: List[str],
            date_range: Optional[Dict[str, str]] = None,
            topics: Optional[List[str]] = None,
            user_query: Optional[str] = None
        ) -> Dict[str, Any]:
            """Query the knowledge base through KB Manager."""
            return self.kb_manager.query(
                query_type=query_type,
                tickers=tickers,
                date_range=date_range,
                topics=topics,
                user_query=user_query
            )
        
        tools = [StructuredTool.from_function(query_kb_tool)]
        
        return tools
    
    def _create_agent(self, model: str, api_key: Optional[str] = None):
        """Create LangChain agent using create_agent (LangChain 1.0 API) with OpenRouter."""
        # OpenRouter uses OpenAI-compatible API
        openrouter_key = api_key or os.getenv("OPENROUTER_API_KEY")
        if not openrouter_key:
            raise ValueError(
                "OpenRouter API key is required. "
                "Set OPENROUTER_API_KEY environment variable or pass openrouter_api_key parameter."
            )
        
        # Use OpenRouter via OpenAI-compatible interface
        llm = ChatOpenAI(
            model=model,
            temperature=0,
            api_key=openrouter_key,
            base_url="https://openrouter.ai/api/v1",
            default_headers={
                "HTTP-Referer": "https://github.com/eddid-ai/stock-analysis",  # Optional: for analytics
                "X-Title": "Stock Analysis Agent System"  # Optional: for analytics
            }
        )
        
        # System message for the agent
        system_message = """You are a helpful financial analysis assistant. Your role is to:

1. Understand user queries about stocks in natural language
2. Extract key information:
   - Stock ticker symbols (from company names, aliases, or explicit tickers)
   - Dates or date ranges (explicit, relative like "latest", or default to today)
   - Topics or focus areas (valuation, risks, catalysts, etc.)
   - Query intent (retrieve, compare, explore, generate)

3. Call the KB Manager tool with structured parameters:
   - query_type: retrieve | search | compare | generate
   - tickers: array of identified tickers
   - date_range: optional date constraints
   - topics: optional topic filters
   - user_query: original query for context

4. Synthesize KB Manager results into natural language responses:
   - Cite sources (report dates, tickers)
   - Indicate when information is from KB vs newly generated
   - Provide clear, concise answers

5. Handle ambiguous queries by asking for clarification when needed.

Always be helpful, accurate, and transparent about data sources."""
        
        # Create agent with create_agent (LangChain 1.0 standard)
        agent = create_agent(
            model=llm,
            tools=self.tools
        )
        
        # Wrap agent to prepend system message to input
        def agent_with_system(input_dict):
            original_input = input_dict.get("input", "")
            enhanced_input = f"{system_message}\n\nUser query: {original_input}"
            return agent.invoke({"input": enhanced_input})
        
        return RunnableLambda(agent_with_system)
    
    def identify_ticker(self, query: str) -> Optional[str]:
        """
        Identify stock ticker from query.
        
        Args:
            query: User query text
            
        Returns:
            Ticker symbol or None if not found
        """
        query_lower = query.lower()
        
        # Check explicit ticker patterns
        ticker_pattern = r'\b([A-Z]{1,5}(?::[A-Z0-9]+)?)\b'
        matches = re.findall(ticker_pattern, query.upper())
        if matches:
            return matches[0]
        
        # Check company name mappings
        for company_name, ticker in self.TICKER_MAPPINGS.items():
            if company_name in query_lower:
                return ticker
        
        return None
    
    def extract_topics(self, query: str) -> List[str]:
        """
        Extract topics from query.
        
        Args:
            query: User query text
            
        Returns:
            List of identified topics
        """
        topics = []
        query_lower = query.lower()
        
        topic_keywords = {
            "risk": ["risk", "risks", "downside"],
            "valuation": ["valuation", "value", "price", "valuation"],
            "catalyst": ["catalyst", "catalysts", "events"],
            "fundamentals": ["fundamentals", "financial", "earnings"],
            "competition": ["competition", "competitors", "competitive"],
        }
        
        for topic, keywords in topic_keywords.items():
            if any(kw in query_lower for kw in keywords):
                topics.append(topic)
        
        return topics
    
    def chat(self, user_query: str, chat_history: Optional[List] = None) -> str:
        """
        Process a user query and return response.
        
        Args:
            user_query: User's natural language query
            chat_history: Optional conversation history (not used in current implementation)
            
        Returns:
            Agent's response
        """
        try:
            # LangChain 1.0 create_agent uses {"input": ...} format
            result = self.agent.invoke({"input": user_query})
            
            # Extract the last message content
            if isinstance(result, dict) and "messages" in result:
                messages = result["messages"]
                if messages:
                    last_message = messages[-1]
                    output = last_message.content if hasattr(last_message, 'content') else str(last_message)
                else:
                    output = str(result)
            elif isinstance(result, dict) and "output" in result:
                output = result["output"]
            else:
                output = str(result)
            
            return output if output else "I apologize, but I couldn't process your query."
        except Exception as e:
            logger.error(f"Error in Chat Agent: {e}")
            return f"I encountered an error processing your query: {str(e)}"

