"""KB Manager Agent - Middle layer agent for knowledge base operations"""

import logging
from pathlib import Path
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta

from langchain.agents import create_agent
from langchain_openai import ChatOpenAI
from langchain_core.runnables import RunnableLambda
import os

from .kb_tools.index_tools import IndexTools
from .kb_tools.report_tools import ReportTools
from .kb_tools.perplexity_tool import PerplexityResearchTool
from .index_manager import IndexManager

logger = logging.getLogger(__name__)


class KBManagerAgent:
    """Knowledge Base Manager Agent - Handles KB queries and operations."""
    
    def __init__(
        self,
        knowledge_base_dir: Path,
        api_key: Optional[str] = None,
        model: str = "openai/gpt-4o-mini",
        openrouter_api_key: Optional[str] = None
    ):
        """
        Initialize KB Manager Agent.
        
        Args:
            knowledge_base_dir: Root directory of the knowledge base
            api_key: Perplexity API key for research (defaults to PERPLEXITY_API_KEY env var)
            model: LLM model to use for agent (OpenRouter model identifier)
            openrouter_api_key: OpenRouter API key for agent (defaults to OPENROUTER_API_KEY env var)
        """
        self.kb_dir = Path(knowledge_base_dir)
        self.index_tools = IndexTools(self.kb_dir)
        self.report_tools = ReportTools(self.kb_dir)
        self.index_manager = IndexManager(self.kb_dir)
        
        # Initialize Perplexity tool
        prompt_file = Path(__file__).parent.parent.parent / "docs" / "perplexity-stock-analysis-prompt.md"
        self.perplexity_tool = PerplexityResearchTool(
            api_key=api_key,
            knowledge_base_dir=self.kb_dir,
            prompt_file=prompt_file
        )
        
        # Create LangChain tools
        self.tools = self._create_tools()
        
        # Initialize agent
        self.agent = self._create_agent(model, openrouter_api_key)
    
    def _create_tools(self) -> List:
        """Create LangChain tools from KB tools."""
        from langchain_core.tools import StructuredTool
        
        def read_index_tool(node_id: Optional[str] = None, node_path: Optional[str] = None) -> Dict[str, Any]:
            """Read an index node from the knowledge base."""
            return self.index_tools.read_index(node_id=node_id, node_path=node_path) or {}
        
        def search_index_tool(query_text: str, node_type: Optional[str] = None, max_results: int = 10) -> List[Dict[str, Any]]:
            """Search index nodes by text query."""
            return self.index_tools.search_index(query_text=query_text, node_type=node_type, max_results=max_results)
        
        def read_report_tool(ticker: str, date: Optional[str] = None) -> Dict[str, Any]:
            """Read a stock analysis report."""
            return self.report_tools.read_report(ticker=ticker, date=date) or {}
        
        def search_reports_tool(
            tickers: Optional[List[str]] = None,
            date_range: Optional[Dict[str, str]] = None,
            topics: Optional[List[str]] = None,
            keywords: Optional[List[str]] = None
        ) -> List[Dict[str, Any]]:
            """Search across multiple reports."""
            return self.report_tools.search_reports(
                tickers=tickers,
                date_range=date_range,
                topics=topics,
                keywords=keywords
            )
        
        def update_index_tool(node_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
            """Update an index node."""
            return self.index_tools.update_index(node_id=node_id, updates=updates) or {}
        
        def research_tool(ticker: str, date: Optional[str] = None, focus_areas: Optional[str] = None) -> Dict[str, Any]:
            """Generate new report using Perplexity and update indexes."""
            report = self.perplexity_tool.research(ticker=ticker, date=date, focus_areas=focus_areas)
            
            # Update indexes after new report
            normalized_ticker = ticker.upper().replace(":", "_")
            self.index_manager.update_stock_index(normalized_ticker, report)
            self.index_manager.update_root_index_stock(normalized_ticker, report)
            
            return report
        
        tools = [
            StructuredTool.from_function(read_index_tool),
            StructuredTool.from_function(search_index_tool),
            StructuredTool.from_function(read_report_tool),
            StructuredTool.from_function(search_reports_tool),
            StructuredTool.from_function(update_index_tool),
            StructuredTool.from_function(research_tool),
        ]
        
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
        system_message = """You are a Knowledge Base Manager agent. Your role is to:

1. Receive structured queries from the Chat Agent
2. Navigate the index graph intelligently:
   - Always start at the root index
   - Read index nodes to understand available information
   - Follow links to relevant topic/stock/date nodes
   - Decide navigation path based on query parameters and index summaries

3. Retrieve relevant reports using report tools:
   - Use read_report for specific ticker/date queries
   - Use search_reports for topic-based or comparative queries

4. Assess information sufficiency:
   - Check date recency (if query implies current information)
   - Verify topic coverage (if query asks for specific topics)
   - Validate data completeness (if report has null/empty fields)
   - Return sufficient: true/false with reasoning

5. Call Perplexity tool when information is insufficient:
   - Pass ticker, date, focus areas, and context
   - Store raw response in knowledge base
   - Trigger index update after new data ingestion

6. Update indexes after new report ingestion:
   - Root index: Add/update stock entry
   - Topic indexes: Add/update relevant topic nodes
   - Stock indexes: Add/update date entries
   - Cross-references: Update related stock/topic links
   - Generate/update index summaries based on report content

7. Return structured results with:
   - sufficient: boolean
   - data: extracted information
   - source: knowledge_base | newly_generated
   - reasoning: explanation of sufficiency assessment

Always prioritize knowledge base lookups before calling Perplexity to minimize costs."""
        
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
    
    def query(
        self,
        query_type: str,
        tickers: List[str],
        date_range: Optional[Dict[str, str]] = None,
        topics: Optional[List[str]] = None,
        user_query: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Process a KB query.
        
        Args:
            query_type: Type of query (retrieve, search, compare, generate)
            tickers: List of ticker symbols
            date_range: Optional date range filter
            topics: Optional topic filters
            user_query: Original user query for context
            
        Returns:
            Query result dictionary
        """
        # Build agent input
        agent_input = f"""
Query Type: {query_type}
Tickers: {', '.join(tickers)}
Date Range: {date_range or 'Not specified'}
Topics: {', '.join(topics) if topics else 'Not specified'}
User Query: {user_query or 'Not provided'}

Please:
1. Start by reading the root index
2. Navigate to relevant stock indexes
3. Retrieve reports matching the query
4. Assess if information is sufficient
5. If insufficient, use Perplexity to generate new report
6. Update indexes if new data was generated
7. Return the requested information
"""
        
        try:
            # LangChain 1.0 create_agent returns messages, extract content
            result = self.agent.invoke({"input": agent_input})
            
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
            
            return {
                "success": True,
                "result": output,
                "data": self._extract_data_from_result(result)
            }
        except Exception as e:
            logger.error(f"Error in KB Manager query: {e}")
            return {
                "success": False,
                "error": str(e),
                "result": None
            }
    
    def _extract_data_from_result(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Extract structured data from agent result."""
        # This is a simplified extraction - can be enhanced
        output = result.get("output", "")
        
        # Try to parse JSON from output if present
        import re
        json_match = re.search(r'\{.*\}', output, re.DOTALL)
        if json_match:
            try:
                import json
                return json.loads(json_match.group())
            except:
                pass
        
        return {"output": output}

