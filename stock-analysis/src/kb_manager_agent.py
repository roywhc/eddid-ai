"""KB Manager Agent - Middle layer agent for knowledge base operations"""

import logging
import json
from pathlib import Path
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta

from langchain.agents import create_agent
from langchain_openai import ChatOpenAI
from langchain_core.runnables import RunnableLambda
from langchain_core.messages import SystemMessage, HumanMessage
import os

from .kb_tools.index_tools import IndexTools
from .kb_tools.report_tools import ReportTools
from .kb_tools.perplexity_tool import PerplexityResearchTool
from .index_manager import IndexManager

logger = logging.getLogger(__name__)

# #region debug log helper
def _debug_log(location, message, data=None, hypothesis_id=None):
    try:
        import time
        log_entry = {
            "sessionId": "debug-session",
            "runId": "run1",
            "hypothesisId": hypothesis_id,
            "location": location,
            "message": message,
            "data": data or {},
            "timestamp": int(time.time() * 1000)
        }
        with open(r"c:\Users\Wanho\workspace\eddid-ai\.cursor\debug.log", "a", encoding="utf-8") as f:
            f.write(json.dumps(log_entry) + "\n")
        
        # Also log to AIOps logger if available
        try:
            from .aiops_logger import get_aiops_logger
            aiops = get_aiops_logger()
            if aiops.current_request_id:
                # Determine log type from location or hypothesis_id
                log_type = "INFO"
                if "TOOL" in location or hypothesis_id == "TOOL":
                    log_type = "TOOL"
                elif "LLM" in location or hypothesis_id == "LLM":
                    log_type = "LLM"
                elif "ERROR" in location or "error" in message.lower():
                    log_type = "ERROR"
                elif "WARNING" in location or "warning" in message.lower():
                    log_type = "WARNING"
                
                aiops.log(location, message, data, log_type, hypothesis_id)
        except Exception:
            pass  # AIOps logging is optional
    except Exception:
        pass
# #endregion


class KBManagerAgent:
    """Knowledge Base Manager Agent - Handles KB queries and operations."""
    
    def __init__(
        self,
        knowledge_base_dir: Path,
        api_key: Optional[str] = None,
        model: str = "deepseek/deepseek-v3.2",
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
            # #region agent log
            _debug_log("kb_manager_agent.py:85", "read_index_tool called", {
                "node_id": node_id,
                "node_path": node_path
            }, "TOOL")
            # #endregion
            
            # Log tool call to AIOps
            try:
                from .aiops_logger import get_aiops_logger
                aiops = get_aiops_logger()
                if aiops.current_request_id:
                    aiops.log_tool_call("read_index_tool", {"node_id": node_id, "node_path": node_path})
            except Exception:
                pass
            
            try:
                result = self.index_tools.read_index(node_id=node_id, node_path=node_path) or {}
                # #region agent log
                _debug_log("kb_manager_agent.py:92", "read_index_tool result", {
                    "success": bool(result),
                    "has_node_id": "node_id" in result if isinstance(result, dict) else False
                }, "TOOL")
                # #endregion
                
                # Log tool result to AIOps
                try:
                    from .aiops_logger import get_aiops_logger
                    aiops = get_aiops_logger()
                    if aiops.current_request_id:
                        aiops.log_tool_call("read_index_tool", {"node_id": node_id, "node_path": node_path}, result)
                except Exception:
                    pass
                
                return result
            except Exception as e:
                # #region agent log
                _debug_log("kb_manager_agent.py:99", "read_index_tool error", {"error": str(e)}, "TOOL")
                # #endregion
                logger.error(f"Error in read_index_tool: {e}")
                return {"error": str(e)}
        
        def search_index_tool(query_text: str, node_type: Optional[str] = None, max_results: int = 10) -> List[Dict[str, Any]]:
            """Search index nodes by text query."""
            # #region agent log
            _debug_log("kb_manager_agent.py:106", "search_index_tool called", {
                "query_text": query_text,
                "node_type": node_type,
                "max_results": max_results
            }, "TOOL")
            # #endregion
            try:
                result = self.index_tools.search_index(query_text=query_text, node_type=node_type, max_results=max_results)
                # #region agent log
                _debug_log("kb_manager_agent.py:113", "search_index_tool result", {
                    "results_count": len(result) if isinstance(result, list) else 0
                }, "TOOL")
                # #endregion
                return result
            except Exception as e:
                # #region agent log
                _debug_log("kb_manager_agent.py:119", "search_index_tool error", {"error": str(e)}, "TOOL")
                # #endregion
                logger.error(f"Error in search_index_tool: {e}")
                return []
        
        def read_report_tool(ticker: str, date: Optional[str] = None) -> Dict[str, Any]:
            """Read a stock analysis report."""
            # #region agent log
            _debug_log("kb_manager_agent.py:126", "read_report_tool called", {
                "ticker": ticker,
                "date": date
            }, "TOOL")
            # #endregion
            try:
                result = self.report_tools.read_report(ticker=ticker, date=date) or {}
                # #region agent log
                _debug_log("kb_manager_agent.py:133", "read_report_tool result", {
                    "success": bool(result),
                    "has_ticker": "ticker" in result if isinstance(result, dict) else False
                }, "TOOL")
                # #endregion
                return result
            except Exception as e:
                # #region agent log
                _debug_log("kb_manager_agent.py:140", "read_report_tool error", {"error": str(e)}, "TOOL")
                # #endregion
                logger.error(f"Error in read_report_tool: {e}")
                return {"error": str(e)}
        
        def search_reports_tool(
            tickers: Optional[List[str]] = None,
            date_range: Optional[Dict[str, str]] = None,
            topics: Optional[List[str]] = None,
            keywords: Optional[List[str]] = None
        ) -> List[Dict[str, Any]]:
            """Search across multiple reports."""
            # #region agent log
            _debug_log("kb_manager_agent.py:152", "search_reports_tool called", {
                "tickers": tickers,
                "date_range": date_range,
                "topics": topics,
                "keywords": keywords
            }, "TOOL")
            # #endregion
            try:
                result = self.report_tools.search_reports(
                    tickers=tickers,
                    date_range=date_range,
                    topics=topics,
                    keywords=keywords
                )
                # #region agent log
                _debug_log("kb_manager_agent.py:165", "search_reports_tool result", {
                    "results_count": len(result) if isinstance(result, list) else 0
                }, "TOOL")
                # #endregion
                return result
            except Exception as e:
                # #region agent log
                _debug_log("kb_manager_agent.py:171", "search_reports_tool error", {"error": str(e)}, "TOOL")
                # #endregion
                logger.error(f"Error in search_reports_tool: {e}")
                return []
        
        def update_index_tool(node_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
            """Update an index node."""
            # #region agent log
            _debug_log("kb_manager_agent.py:179", "update_index_tool called", {
                "node_id": node_id,
                "updates_keys": list(updates.keys()) if isinstance(updates, dict) else []
            }, "TOOL")
            # #endregion
            try:
                result = self.index_tools.update_index(node_id=node_id, updates=updates) or {}
                # #region agent log
                _debug_log("kb_manager_agent.py:186", "update_index_tool result", {
                    "success": bool(result)
                }, "TOOL")
                # #endregion
                return result
            except Exception as e:
                # #region agent log
                _debug_log("kb_manager_agent.py:192", "update_index_tool error", {"error": str(e)}, "TOOL")
                # #endregion
                logger.error(f"Error in update_index_tool: {e}")
                return {"error": str(e)}
        
        def research_tool(ticker: str, date: Optional[str] = None, focus_areas: Optional[str] = None) -> Dict[str, Any]:
            """Generate new report using Perplexity and update indexes."""
            # #region agent log
            _debug_log("kb_manager_agent.py:200", "research_tool called", {
                "ticker": ticker,
                "date": date,
                "focus_areas": focus_areas
            }, "TOOL")
            # #endregion
            try:
                report = self.perplexity_tool.research(ticker=ticker, date=date, focus_areas=focus_areas)
                
                # Update indexes after new report
                normalized_ticker = ticker.upper().replace(":", "_")
                self.index_manager.update_stock_index(normalized_ticker, report)
                self.index_manager.update_root_index_stock(normalized_ticker, report)
                
                # #region agent log
                _debug_log("kb_manager_agent.py:212", "research_tool result", {
                    "success": bool(report),
                    "ticker": normalized_ticker
                }, "TOOL")
                # #endregion
                return report
            except Exception as e:
                # #region agent log
                _debug_log("kb_manager_agent.py:219", "research_tool error", {"error": str(e)}, "TOOL")
                # #endregion
                logger.error(f"Error in research_tool: {e}")
                return {"error": str(e)}
        
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
        
        # Use OpenRouter via OpenAI-compatible interface
        # Add callback for logging LLM prompts and responses
        from langchain_core.callbacks import BaseCallbackHandler
        
        class LLMLoggingHandler(BaseCallbackHandler):
            """Callback handler to log LLM prompts and responses"""
            def on_llm_start(self, serialized, prompts, **kwargs):
                # #region agent log
                _debug_log("kb_manager_agent.py:190", "KB LLM request start", {
                    "model": serialized.get("name", "unknown"),
                    "prompts_count": len(prompts),
                    "prompt_preview": str(prompts[0])[:500] if prompts else None
                }, "LLM")
                # #endregion
                logger.info(f"KB LLM REQUEST | MODEL: {model}")
                for i, prompt in enumerate(prompts):
                    logger.info(f"KB LLM REQUEST | PROMPT {i}: {str(prompt)[:500]}")
            
            def on_llm_end(self, response, **kwargs):
                # #region agent log
                response_text = ""
                if hasattr(response, 'generations') and response.generations:
                    if response.generations[0] and len(response.generations[0]) > 0:
                        gen = response.generations[0][0]
                        if hasattr(gen, 'text'):
                            response_text = gen.text
                        elif hasattr(gen, 'message') and hasattr(gen.message, 'content'):
                            response_text = gen.message.content
                _debug_log("kb_manager_agent.py:205", "KB LLM response end", {
                    "response_preview": response_text[:500],
                    "response_len": len(response_text)
                }, "LLM")
                # #endregion
                logger.info(f"KB LLM RESPONSE | LENGTH: {len(response_text)} chars")
                logger.info(f"KB LLM RESPONSE | CONTENT: {response_text[:1000]}")
            
            def on_llm_error(self, error, **kwargs):
                # #region agent log
                _debug_log("kb_manager_agent.py:213", "KB LLM error", {"error": str(error)}, "LLM")
                # #endregion
                logger.error(f"KB LLM ERROR: {error}")
        
        # Configure LLM with reasoning mode handling
        # For DeepSeek-V3.2, disable reasoning mode to avoid empty content
        extra_body = {}
        if "deepseek" in model.lower() and "v3.2" in model.lower():
            # Disable thinking/reasoning mode for DeepSeek-V3.2
            extra_body = {
                "chat_template_kwargs": {
                    "thinking": False
                }
            }
            # #region agent log
            _debug_log("kb_manager_agent.py:232", "disabling reasoning mode for DeepSeek-V3.2", {"model": model}, "F")
            # #endregion
        
        llm = ChatOpenAI(
            model=model,
            temperature=0,
            api_key=openrouter_key,
            base_url="https://openrouter.ai/api/v1",
            default_headers={
                "HTTP-Referer": "https://github.com/eddid-ai/stock-analysis",  # Optional: for analytics
                "X-Title": "Stock Analysis Agent System"  # Optional: for analytics
            },
            callbacks=[LLMLoggingHandler()],
            extra_body=extra_body if extra_body else None
        )
        
        # Create agent with create_agent (LangChain 1.0 standard)
        # Use system_prompt parameter (not system_message)
        # #region agent log
        _debug_log("kb_manager_agent.py:177", "kb_before create_agent", {"model": model, "tools_count": len(self.tools), "llm_type": str(type(llm)), "system_message_len": len(system_message)}, "F")
        # #endregion
        try:
            agent = create_agent(
                model=llm,
                tools=self.tools,
                system_prompt=system_message
            )
        except TypeError as e:
            # #region agent log
            _debug_log("kb_manager_agent.py:202", "kb_create_agent failed with system_prompt", {"error": str(e)}, "F")
            # #endregion
            # Fallback: create agent without system_prompt, then wrap to add system message properly
            agent = create_agent(
                model=llm,
                tools=self.tools
            )
            # Wrap agent to add system message as a proper message object
            def agent_with_system(input_dict):
                # #region agent log
                _debug_log("kb_manager_agent.py:211", "kb_agent_with_system entry (fallback)", {"input_dict": str(input_dict)}, "F")
                # #endregion
                user_input = input_dict.get("input", "")
                # Format as proper messages list with system message
                messages = [
                    SystemMessage(content=system_message),
                    HumanMessage(content=user_input)
                ]
                # #region agent log
                _debug_log("kb_manager_agent.py:218", "kb_messages formatted", {"messages_count": len(messages), "has_system": True}, "F")
                # #endregion
                # Invoke with messages instead of input
                result = agent.invoke({"messages": messages})
                # #region agent log
                _debug_log("kb_manager_agent.py:222", "kb_agent.invoke result (fallback)", {"result_type": str(type(result))}, "F")
                # #endregion
                return result
            agent = RunnableLambda(agent_with_system)
        # #region agent log
        _debug_log("kb_manager_agent.py:212", "kb_after create_agent", {"agent_type": str(type(agent))}, "F")
        # #endregion
        
        return agent
    
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
            # #region agent log
            _debug_log("kb_manager_agent.py:233", "kb_query before agent.invoke", {"agent_input_len": len(agent_input), "agent_input_preview": agent_input[:200]}, "E")
            # #endregion
            # LangChain 1.0 create_agent returns messages, extract content
            result = self.agent.invoke({"input": agent_input})
            # #region agent log
            _debug_log("kb_manager_agent.py:236", "kb_query after agent.invoke", {"result_type": str(type(result)), "result_is_dict": isinstance(result, dict), "result_keys": list(result.keys()) if isinstance(result, dict) else None}, "E")
            # #endregion
            
            # Log tool calls if present in messages
            if isinstance(result, dict) and "messages" in result:
                messages = result.get("messages", [])
                for i, msg in enumerate(messages):
                    if hasattr(msg, 'tool_calls') and msg.tool_calls:
                        # #region agent log
                        _debug_log("kb_manager_agent.py:243", f"tool calls in message {i}", {
                            "tool_calls_count": len(msg.tool_calls),
                            "tool_calls": [{"name": getattr(tc, 'name', 'unknown'), "args": str(getattr(tc, 'args', {}))[:200]} for tc in msg.tool_calls]
                        }, "TOOL")
                        # #endregion
            
            # Extract the last message content
            if isinstance(result, dict) and "messages" in result:
                # #region agent log
                _debug_log("kb_manager_agent.py:252", "kb_result has messages", {"messages_count": len(result["messages"]) if result.get("messages") else 0}, "E")
                # #endregion
                messages = result["messages"]
                if messages:
                    last_message = messages[-1]
                    output = last_message.content if hasattr(last_message, 'content') else str(last_message)
                else:
                    output = str(result)
            elif isinstance(result, dict) and "output" in result:
                # #region agent log
                _debug_log("kb_manager_agent.py:248", "kb_result has output key", {}, "E")
                # #endregion
                output = result["output"]
            else:
                # #region agent log
                _debug_log("kb_manager_agent.py:252", "kb_result format unknown", {"result_str": str(result)[:500]}, "E")
                # #endregion
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

