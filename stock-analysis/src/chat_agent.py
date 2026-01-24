"""Chat Agent - Outermost layer for natural language user interaction"""

import logging
import re
import json
from typing import Dict, Any, Optional, List
from datetime import datetime

from langchain.agents import create_agent
from langchain_openai import ChatOpenAI
from langchain_core.runnables import RunnableLambda
from langchain_core.messages import SystemMessage, HumanMessage
import os

from .kb_manager_agent import KBManagerAgent

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
        model: str = "deepseek/deepseek-v3.2"
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
        
        self.model = model  # Store model for error messages
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
            """
            Query the knowledge base through KB Manager.
            
            IMPORTANT: Extract ticker symbols from the user_query if not explicitly provided.
            Examples:
            - "Please analysis TSLA" → tickers=["TSLA"], topics=["general"]
            - "analyze Apple stock" → tickers=["AAPL"], topics=["general"]
            - "What are the risks for NVDA?" → tickers=["NVDA"], topics=["general", "risk"]
            
            Args:
                query_type: Type of query - use "retrieve" for specific ticker analysis
                tickers: List of ticker symbols (e.g., ["TSLA"], ["AAPL", "MSFT"])
                date_range: Optional date range filter
                topics: List of topics - ALWAYS include "general" as first if no specific topic mentioned
                user_query: Original user query for context
            """
            # #region agent log
            _debug_log("chat_agent.py:95", "query_kb_tool called", {
                "query_type": query_type,
                "tickers": tickers,
                "date_range": date_range,
                "topics": topics,
                "user_query": user_query
            }, "TOOL")
            # #endregion
            
            # Log tool call to AIOps
            try:
                from .aiops_logger import get_aiops_logger
                aiops = get_aiops_logger()
                if aiops.current_request_id:
                    aiops.log_tool_call("query_kb_tool", {
                        "query_type": query_type,
                        "tickers": tickers,
                        "date_range": date_range,
                        "topics": topics,
                        "user_query": user_query
                    })
            except Exception:
                pass
            result = self.kb_manager.query(
                query_type=query_type,
                tickers=tickers,
                date_range=date_range,
                topics=topics,
                user_query=user_query
            )
            # #region agent log
            _debug_log("chat_agent.py:107", "query_kb_tool result", {
                "success": result.get("success"),
                "result_preview": str(result.get("result", ""))[:200],
                "has_data": "data" in result
            }, "TOOL")
            # #endregion
            return result
        
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
        
        # System message for the agent
        # IMPORTANT: Emphasize that the agent MUST use tools to answer queries
        system_message = """You are a helpful financial analysis assistant. Your role is to:

1. Understand user queries about stocks in natural language
2. **EXTRACT TICKER SYMBOLS FROM QUERIES** - Look for:
   - Explicit ticker symbols (e.g., "TSLA", "AAPL", "NVDA") - these are 1-5 uppercase letters
   - Company names that map to tickers (e.g., "Tesla" → "TSLA", "Apple" → "AAPL")
   - Examples: "Please analysis TSLA" → ticker is "TSLA", "analyze Apple stock" → ticker is "AAPL"
   - If a ticker is found, ALWAYS call the tool with it - do NOT ask the user for it
3. Extract other key information:
   - Dates or date ranges (explicit, relative like "latest", or default to today)
   - Topics or focus areas: general (default), valuation, risks, catalysts, fundamentals, competition
   - Query intent (retrieve, search, compare, generate)

4. **YOU MUST USE THE AVAILABLE TOOLS** to answer user queries. Do not try to answer without using tools.
   - Call the query_kb_tool with structured parameters:
   - query_type: retrieve (for specific ticker) | search | compare | generate
   - tickers: array of identified tickers (e.g., ["TSLA"] for "Please analysis TSLA")
   - date_range: optional date constraints (default to latest if not specified)
   - topics: array of topics - ALWAYS include "general" as the first topic if no specific topic is mentioned
   - user_query: original query for context

5. After receiving tool results, synthesize them into natural language responses:
   - Cite sources (report dates, tickers)
   - Indicate when information is from KB vs newly generated
   - Provide clear, concise answers

6. Handle ambiguous queries by asking for clarification ONLY if no ticker can be identified.

CRITICAL RULES:
- If a ticker symbol is present in the query (like "TSLA" in "Please analysis TSLA"), extract it and call the tool immediately
- Do NOT ask the user for information that is already in their query
- Always include "general" as the first topic in the topics array if no specific topic is mentioned
- Never respond without calling the tool first when a ticker is identified"""
        
        # Use OpenRouter via OpenAI-compatible interface
        # Add callback for logging LLM prompts and responses
        from langchain_core.callbacks import BaseCallbackHandler
        
        class LLMLoggingHandler(BaseCallbackHandler):
            """Callback handler to log LLM prompts and responses"""
            def on_llm_start(self, serialized, prompts, **kwargs):
                # #region agent log
                _debug_log("chat_agent.py:150", "LLM request start", {
                    "model": serialized.get("name", "unknown"),
                    "prompts_count": len(prompts),
                    "prompt_preview": str(prompts[0])[:500] if prompts else None
                }, "LLM")
                # #endregion
                logger.info(f"LLM REQUEST | MODEL: {model}")
                for i, prompt in enumerate(prompts):
                    logger.info(f"LLM REQUEST | PROMPT {i}: {str(prompt)[:500]}")
                
                # Log to AIOps
                try:
                    from .aiops_logger import get_aiops_logger
                    aiops = get_aiops_logger()
                    if aiops.current_request_id and prompts:
                        aiops.log_llm_request(model, str(prompts[0]), "system" if i == 0 else "user")
                except Exception:
                    pass
            
            def on_llm_end(self, response, **kwargs):
                # #region agent log
                response_text = ""
                response_llm_output = {}
                if hasattr(response, 'generations') and response.generations:
                    if response.generations[0] and len(response.generations[0]) > 0:
                        gen = response.generations[0][0]
                        if hasattr(gen, 'text'):
                            response_text = gen.text
                        elif hasattr(gen, 'message') and hasattr(gen.message, 'content'):
                            response_text = gen.message.content
                if hasattr(response, 'llm_output'):
                    response_llm_output = response.llm_output
                _debug_log("chat_agent.py:165", "LLM response end", {
                    "response_preview": response_text[:500],
                    "response_len": len(response_text),
                    "llm_output": str(response_llm_output)[:500],
                    "response_type": str(type(response)),
                    "response_attrs": [attr for attr in dir(response) if not attr.startswith('_')][:20]
                }, "LLM")
                # #endregion
                logger.info(f"LLM RESPONSE | LENGTH: {len(response_text)} chars")
                logger.info(f"LLM RESPONSE | CONTENT: {response_text[:1000]}")
                if response_llm_output:
                    logger.info(f"LLM RESPONSE | LLM_OUTPUT: {str(response_llm_output)[:500]}")
                
                # Log to AIOps
                try:
                    from .aiops_logger import get_aiops_logger
                    aiops = get_aiops_logger()
                    if aiops.current_request_id:
                        aiops.log_llm_response(response_text, response_llm_output)
                except Exception:
                    pass
            
            def on_llm_error(self, error, **kwargs):
                # #region agent log
                _debug_log("chat_agent.py:173", "LLM error", {"error": str(error)}, "LLM")
                # #endregion
                logger.error(f"LLM ERROR: {error}")
        
        # Configure LLM with reasoning mode handling
        # For DeepSeek-V3.2, try to disable reasoning mode via extra_body
        # Note: model_kwargs approach doesn't work - it causes "unexpected keyword argument 'thinking'"
        extra_body = {}
        
        if "deepseek" in model.lower() and "v3.2" in model.lower():
            # Try to disable reasoning mode using extra_body
            # This is passed to the API request body
            extra_body = {
                "chat_template_kwargs": {
                    "thinking": False
                }
            }
            # #region agent log
            _debug_log("chat_agent.py:220", "disabling reasoning mode for DeepSeek-V3.2", {
                "model": model,
                "extra_body": extra_body
            }, "C")
            # #endregion
            logger.info(f"Attempting to disable reasoning mode for {model} using extra_body")
        
        # Create LLM - only use extra_body, not model_kwargs (which causes errors)
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
        tool_names = [getattr(tool, 'name', str(tool)) for tool in self.tools]
        _debug_log("chat_agent.py:137", "before create_agent", {
            "model": model,
            "tools_count": len(self.tools),
            "tool_names": tool_names,
            "llm_type": str(type(llm)),
            "system_message_len": len(system_message)
        }, "C")
        # #endregion
        try:
            agent = create_agent(
                model=llm,
                tools=self.tools,
                system_prompt=system_message
            )
            # #region agent log
            _debug_log("chat_agent.py:235", "agent created successfully", {
                "agent_type": str(type(agent)),
                "has_tools": hasattr(agent, 'tools') if hasattr(agent, '__dict__') else False
            }, "C")
            # #endregion
        except TypeError as e:
            # #region agent log
            _debug_log("chat_agent.py:162", "create_agent failed with system_prompt", {"error": str(e)}, "C")
            # #endregion
            # Fallback: create agent without system_prompt, then wrap to add system message properly
            agent = create_agent(
                model=llm,
                tools=self.tools
            )
            # Wrap agent to add system message as a proper message object
            def agent_with_system(input_dict):
                # #region agent log
                _debug_log("chat_agent.py:171", "agent_with_system entry (fallback)", {"input_dict": str(input_dict)}, "C")
                # #endregion
                user_input = input_dict.get("input", "")
                # Format as proper messages list with system message
                messages = [
                    SystemMessage(content=system_message),
                    HumanMessage(content=user_input)
                ]
                # #region agent log
                _debug_log("chat_agent.py:178", "messages formatted", {"messages_count": len(messages), "has_system": True}, "C")
                # #endregion
                # Invoke with messages instead of input
                result = agent.invoke({"messages": messages})
                # #region agent log
                _debug_log("chat_agent.py:182", "agent.invoke result (fallback)", {"result_type": str(type(result))}, "C")
                # #endregion
                return result
            agent = RunnableLambda(agent_with_system)
        # #region agent log
        _debug_log("chat_agent.py:172", "after create_agent", {"agent_type": str(type(agent))}, "C")
        # #endregion
        
        return agent
    
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
            List of identified topics (always includes "general" as first)
        """
        topics = ["general"]  # Always include "general" as the first topic
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
                if topic not in topics:  # Avoid duplicates
                    topics.append(topic)
        
        return topics
    
    def extract_ticker(self, query: str) -> Optional[str]:
        """
        Extract ticker from query (alias for identify_ticker for consistency).
        
        Args:
            query: User query text
            
        Returns:
            Ticker symbol or None if not found
        """
        return self.identify_ticker(query)
    
    def chat(self, user_query: str, chat_history: Optional[List] = None) -> str:
        """
        Process a user query and return response with robust error handling.
        
        Args:
            user_query: User's natural language query
            chat_history: Optional conversation history (not used in current implementation)
            
        Returns:
            Agent's response
        """
        # Start AIOps logging for this request
        try:
            from .aiops_logger import get_aiops_logger
            import os
            # Get log directory from environment or use default
            log_dir = os.getenv("AIOPS_LOG_DIR", "./aiops_logs")
            from pathlib import Path
            aiops = get_aiops_logger(Path(log_dir))
            model_name = self.model if hasattr(self, 'model') else None
            request_id = aiops.start_request(user_query, model_name)
            logger.info(f"AIOps: Started logging for request {request_id}: {user_query[:50]}")
            # #region agent log
            _debug_log("chat_agent.py:496", "AIOps logging started", {"request_id": request_id, "log_dir": str(log_dir)}, "B")
            # #endregion
        except Exception as e:
            logger.warning(f"AIOps logging failed: {e}", exc_info=True)
            # #region agent log
            _debug_log("chat_agent.py:501", "AIOps logging failed", {"error": str(e)}, "B")
            # #endregion
            # Continue without AIOps logging
        
        # #region agent log
        _debug_log("chat_agent.py:341", "chat method entry", {"user_query": user_query, "user_query_len": len(user_query)}, "B")
        # #endregion
        
        # Retry mechanism with exponential backoff
        max_retries = 3
        retry_delay = 1.0
        
        for attempt in range(max_retries):
            try:
                # #region agent log
                _debug_log("chat_agent.py:350", "agent invoke attempt", {"attempt": attempt + 1, "max_retries": max_retries}, "B")
                # #endregion
                
                # Invoke agent with retry
                result = self._invoke_agent_with_retry(user_query, attempt, retry_delay)
                
                # Extract and validate response
                output = self._extract_response(result)
                
                # Validate output quality
                if output and len(output.strip()) > 10:
                    # #region agent log
                    _debug_log("chat_agent.py:360", "chat method success", {"output_len": len(output), "attempt": attempt + 1}, "B")
                    # #endregion
                    # End AIOps logging
                    try:
                        from .aiops_logger import get_aiops_logger
                        aiops = get_aiops_logger()
                        aiops.end_request("completed")
                    except Exception:
                        pass
                    return output
                else:
                    # #region agent log
                    _debug_log("chat_agent.py:365", "output too short, retrying", {"output": output[:100] if output else "None", "attempt": attempt + 1}, "B")
                    # #endregion
                    if attempt < max_retries - 1:
                        import time
                        time.sleep(retry_delay * (attempt + 1))
                        continue
                    else:
                        # Last attempt failed, return helpful error
                        # End AIOps logging with error
                        try:
                            from .aiops_logger import get_aiops_logger
                            aiops = get_aiops_logger()
                            aiops.end_request("failed", str(e))
                        except Exception:
                            pass
                        return self._generate_fallback_response(user_query, result)
                        
            except Exception as e:
                # End AIOps logging with error
                try:
                    from .aiops_logger import get_aiops_logger
                    aiops = get_aiops_logger()
                    aiops.end_request("error", str(e))
                except Exception:
                    pass
                # #region agent log
                _debug_log("chat_agent.py:375", "chat method exception", {"error": str(e), "attempt": attempt + 1, "error_type": str(type(e))}, "B")
                # #endregion
                logger.error(f"Error in chat method (attempt {attempt + 1}): {e}")
                
                if attempt < max_retries - 1:
                    import time
                    time.sleep(retry_delay * (attempt + 1))
                    continue
                else:
                    # All retries failed
                    error_msg = f"I encountered an error while processing your query: '{user_query}'. Please try rephrasing your question or try again later."
                    # End AIOps logging
                    try:
                        from .aiops_logger import get_aiops_logger
                        aiops = get_aiops_logger()
                        aiops.end_request("error", str(e))
                    except Exception:
                        pass
                    return error_msg
        
        # Should not reach here, but just in case
        # End AIOps logging
        try:
            from .aiops_logger import get_aiops_logger
            aiops = get_aiops_logger()
            aiops.end_request("failed", "Unexpected end of retry loop")
        except Exception:
            pass
        return "I'm having trouble processing your request. Please try again."
    
    def _invoke_agent_with_retry(self, user_query: str, attempt: int, retry_delay: float) -> Dict[str, Any]:
        """Invoke agent with proper error handling and logging."""
        invoke_dict = {"input": user_query}
        
        # #region agent log
        _debug_log("chat_agent.py:395", "before agent.invoke", {
            "invoke_dict": str(invoke_dict),
            "agent_type": str(type(self.agent)),
            "tools_available": len(self.tools),
            "tool_names": [getattr(t, 'name', str(t)) for t in self.tools],
            "attempt": attempt + 1
        }, "B")
        # #endregion
        
        try:
            result = self.agent.invoke(invoke_dict)
            
            # #region agent log
            result_str = str(result)[:1000] if result else "None"
            _debug_log("chat_agent.py:408", "after agent.invoke", {
                "result_type": str(type(result)),
                "result_is_dict": isinstance(result, dict),
                "result_keys": list(result.keys()) if isinstance(result, dict) else None,
                "result_str": result_str[:500]
            }, "B")
            # #endregion
            
            return result
            
        except Exception as e:
            # #region agent log
            _debug_log("chat_agent.py:420", "agent.invoke exception", {"error": str(e), "error_type": str(type(e))}, "B")
            # #endregion
            raise
    
    def _extract_response(self, result: Any) -> Optional[str]:
        """
        Extract response from agent result with robust fallback chain.
        
        Priority:
        1. Last AIMessage with non-empty content
        2. ToolMessage content (if no AIMessage content)
        3. Result output key
        4. String representation of result
        """
        # #region agent log
        _debug_log("chat_agent.py:435", "extract_response entry", {"result_type": str(type(result))}, "B")
        # #endregion
        
        if not result:
            # #region agent log
            _debug_log("chat_agent.py:439", "result is None", {}, "B")
            # #endregion
            return None
        
        # Try to extract from messages
        if isinstance(result, dict) and "messages" in result:
            messages = result.get("messages", [])
            # #region agent log
            _debug_log("chat_agent.py:445", "extracting from messages", {"messages_count": len(messages)}, "B")
            # #endregion
            
            if messages:
                # Strategy 1: Find last AIMessage with content
                from langchain_core.messages import AIMessage
                for msg in reversed(messages):
                    if isinstance(msg, AIMessage):
                        # #region agent log
                        # Check for reasoning_content as well
                        has_reasoning = hasattr(msg, 'additional_kwargs') and msg.additional_kwargs and 'reasoning_content' in msg.additional_kwargs
                        reasoning_content = msg.additional_kwargs.get('reasoning_content', '') if has_reasoning else None
                        _debug_log("chat_agent.py:452", "checking AIMessage", {
                            "has_content": hasattr(msg, 'content'),
                            "content_len": len(msg.content) if hasattr(msg, 'content') and msg.content else 0,
                            "has_tool_calls": hasattr(msg, 'tool_calls') and bool(msg.tool_calls),
                            "has_reasoning_content": has_reasoning,
                            "reasoning_content_len": len(reasoning_content) if reasoning_content else 0,
                            "additional_kwargs_keys": list(msg.additional_kwargs.keys()) if hasattr(msg, 'additional_kwargs') and msg.additional_kwargs else []
                        }, "B")
                        # #endregion
                        
                        # Priority 1: Use content if available
                        if hasattr(msg, 'content') and msg.content and len(msg.content.strip()) > 0:
                            # #region agent log
                            _debug_log("chat_agent.py:465", "found AIMessage content", {"content_preview": msg.content[:200]}, "B")
                            # #endregion
                            return msg.content
                        
                        # Priority 2: Check if there are reasoning tokens but empty content
                        # This means reasoning mode is still active - try to extract reasoning or continue agent
                        if hasattr(msg, 'response_metadata') and msg.response_metadata:
                            metadata = msg.response_metadata
                            token_usage = metadata.get('token_usage', {}) if isinstance(metadata, dict) else {}
                            completion_details = token_usage.get('completion_tokens_details', {}) if isinstance(token_usage, dict) else {}
                            reasoning_tokens = completion_details.get('reasoning_tokens', 0) if isinstance(completion_details, dict) else 0
                            
                            if reasoning_tokens > 0 and not msg.content:
                                # #region agent log
                                _debug_log("chat_agent.py:475", "reasoning tokens detected but empty content", {
                                    "reasoning_tokens": reasoning_tokens,
                                    "has_tool_calls": hasattr(msg, 'tool_calls') and bool(msg.tool_calls)
                                }, "B")
                                # #endregion
                                
                                # If there are tool calls, agent should continue automatically
                                # But if content is empty, we need to handle it
                                # Try to continue agent execution with current messages
                                if hasattr(msg, 'tool_calls') and msg.tool_calls:
                                    # Agent made tool calls, should continue
                                    # #region agent log
                                    _debug_log("chat_agent.py:485", "tool calls present, attempting continuation", {}, "B")
                                    # #endregion
                                    try:
                                        # Continue agent execution - need to get agent instance
                                        # The agent is stored in self.agent
                                        if hasattr(self, 'agent') and self.agent:
                                            continued_result = self.agent.invoke({"messages": messages})
                                            # Recursively extract from continued result
                                            continued_output = self._extract_response(continued_result)
                                            if continued_output:
                                                return continued_output
                                        # #region agent log
                                        _debug_log("chat_agent.py:500", "agent continuation completed but no output", {}, "B")
                                        # #endregion
                                    except Exception as e:
                                        # #region agent log
                                        _debug_log("chat_agent.py:503", "agent continuation failed", {"error": str(e)}, "B")
                                        # #endregion
                                        logger.warning(f"Failed to continue agent execution: {e}")
                                
                                # If no tool calls, reasoning mode produced empty content
                                # Don't return here - continue to check other messages or fallback
                                # #region agent log
                                _debug_log("chat_agent.py:722", "no tool calls with reasoning tokens, continuing search", {}, "B")
                                # #endregion
                        
                        # Priority 3: If content is empty but reasoning_content exists, use it as fallback
                        if reasoning_content and len(reasoning_content.strip()) > 0:
                            # #region agent log
                            _debug_log("chat_agent.py:510", "using reasoning_content as fallback", {"reasoning_preview": reasoning_content[:200]}, "B")
                            # #endregion
                            return str(reasoning_content)
                
                # Strategy 2: If no AIMessage content, check for tool calls and continue execution
                last_message = messages[-1]
                if hasattr(last_message, 'tool_calls') and last_message.tool_calls:
                    # #region agent log
                    _debug_log("chat_agent.py:467", "tool calls detected, attempting continuation", {
                        "tool_calls_count": len(last_message.tool_calls)
                    }, "B")
                    # #endregion
                    
                    # Log tool call details
                    for i, tool_call in enumerate(last_message.tool_calls):
                        # #region agent log
                        tool_call_info = {
                            "index": i,
                            "tool_call_type": str(type(tool_call)),
                            "has_name": hasattr(tool_call, 'name'),
                            "name": getattr(tool_call, 'name', None),
                            "has_args": hasattr(tool_call, 'args'),
                            "args": str(getattr(tool_call, 'args', None))[:500] if hasattr(tool_call, 'args') else None
                        }
                        _debug_log("chat_agent.py:478", f"tool_call {i}", tool_call_info, "TOOL")
                        # #endregion
                    
                    # Try to continue agent execution
                    try:
                        # Continue with the current state
                        continued_result = self.agent.invoke({"messages": messages})
                        # #region agent log
                        _debug_log("chat_agent.py:485", "agent continuation result", {
                            "has_messages": isinstance(continued_result, dict) and "messages" in continued_result,
                            "messages_count": len(continued_result.get("messages", [])) if isinstance(continued_result, dict) else 0
                        }, "B")
                        # #endregion
                        
                        # Recursively extract from continued result
                        return self._extract_response(continued_result)
                    except Exception as e:
                        # #region agent log
                        _debug_log("chat_agent.py:494", "agent continuation failed", {"error": str(e)}, "B")
                        # #endregion
                        logger.warning(f"Failed to continue agent execution: {e}")
                
                # Strategy 3: Check ToolMessage as fallback
                from langchain_core.messages import ToolMessage
                for msg in reversed(messages):
                    if isinstance(msg, ToolMessage):
                        if hasattr(msg, 'content') and msg.content:
                            # #region agent log
                            _debug_log("chat_agent.py:503", "found ToolMessage content", {"content_preview": str(msg.content)[:200]}, "B")
                            # #endregion
                            # Try to parse ToolMessage content
                            try:
                                tool_result = json.loads(msg.content) if isinstance(msg.content, str) else msg.content
                                if isinstance(tool_result, dict) and "result" in tool_result:
                                    return str(tool_result["result"])
                                return str(msg.content)
                            except:
                                return str(msg.content)
        
        # Strategy 4: Check for output key
        if isinstance(result, dict) and "output" in result:
            output = result["output"]
            # #region agent log
            _debug_log("chat_agent.py:516", "found output key", {"output_preview": str(output)[:200]}, "B")
            # #endregion
            return str(output) if output else None
        
        # Strategy 5: String representation as last resort
        # #region agent log
        _debug_log("chat_agent.py:522", "using string representation", {"result_str": str(result)[:200]}, "B")
        # #endregion
        
        # If we get here, we couldn't extract any meaningful content
        # Check if there were reasoning tokens - if so, provide helpful message
        if isinstance(result, dict) and "messages" in result:
            messages = result.get("messages", [])
            for msg in reversed(messages):
                if hasattr(msg, 'response_metadata') and msg.response_metadata:
                    metadata = msg.response_metadata
                    token_usage = metadata.get('token_usage', {}) if isinstance(metadata, dict) else {}
                    completion_details = token_usage.get('completion_tokens_details', {}) if isinstance(token_usage, dict) else {}
                    reasoning_tokens = completion_details.get('reasoning_tokens', 0) if isinstance(completion_details, dict) else 0
                    if reasoning_tokens > 0:
                        # #region agent log
                        _debug_log("chat_agent.py:535", "reasoning tokens found in final fallback", {"reasoning_tokens": reasoning_tokens}, "B")
                        # #endregion
                        return (
                            "I processed your request, but the model's reasoning mode produced an empty response. "
                            "The model used reasoning tokens but didn't generate final content. "
                            "Please try rephrasing your query or the system may need configuration adjustments."
                        )
        
        return str(result)
    
    def _generate_fallback_response(self, user_query: str, result: Any) -> str:
        """Generate a helpful fallback response when extraction fails."""
        # #region agent log
        _debug_log("chat_agent.py:528", "generating fallback response", {"user_query": user_query}, "B")
        # #endregion
        
        # Try to extract ticker from query
        ticker = self.identify_ticker(user_query)
        
        if ticker:
            return (
                f"I received your request about {ticker}, but I'm having trouble processing it right now. "
                f"Please try rephrasing your question or ask for specific information about {ticker}."
            )
        else:
            return (
                "I received your request, but I'm having trouble processing it right now. "
                "Please try rephrasing your question or asking for specific information."
            )
            logger.error(f"Error in Chat Agent: {e}")
            
            # Provide helpful error messages for common issues
            error_str = str(e)
            if "403" in error_str and "not available in your region" in error_str:
                return (
                    f"I encountered an error: The model '{self.model if hasattr(self, 'model') else 'openai/gpt-4o-mini'}' is not available in your region.\n\n"
                    f"Please try using a different model by running:\n"
                    f"python main.py --model <model-name>\n\n"
                    f"Some alternatives available on OpenRouter:\n"
                    f"- deepseek/deepseek-chat-v3-0324:free (free tier)\n"
                    f"- google/gemini-pro\n"
                    f"- anthropic/claude-3-haiku\n"
                    f"- meta-llama/llama-3.1-8b-instruct:free\n\n"
                    f"See https://openrouter.ai/models for all available models."
                )
            
            return f"I encountered an error processing your query: {str(e)}"

