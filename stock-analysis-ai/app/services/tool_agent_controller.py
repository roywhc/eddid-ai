"""
Tool Agent Controller - Orchestrates tool-based RAG flow
LLM makes decisions about which tools to call and how to use them
"""
import logging
import uuid
import json
import time
from typing import List, Dict, Any, Optional
from datetime import datetime

from app.services.llm_service import LLMService
from app.services.tool_validator import ToolValidator
from app.services.tool_enforcer import ToolEnforcer
from app.services.tools.tool_definitions import get_tool_definitions
from app.services.tools.knowledge_base_tool import KnowledgeBaseTool
from app.services.tools.response_generator_tool import ResponseGeneratorTool
from app.services.tools.perplexity_tool import PerplexityTool
from app.services.tools.index_keywords_tool import IndexKeywordsTool
from app.utils.aiops_logger import get_aiops_logger
from app.utils.prompt_templates import PromptTemplates
from app.models import ChatRequest, ChatResponse, Citation
from app.services.metrics_service import get_metrics_service

logger = logging.getLogger(__name__)


class ToolAgentController:
    """
    Controller for tool-based agentic RAG flow
    
    The LLM orchestrates tool calls:
    1. LLM decides tool call parameters
    2. Knowledge base tool usage is mandatory
    3. LLM evaluates KB sufficiency and decides on Perplexity
    4. LLM uses tool call to generate final response
    """
    
    def __init__(self):
        """Initialize tool agent controller"""
        logger.info("🔧 TOOL-BASED FLOW: Initializing ToolAgentController...")
        try:
            self.llm_service = LLMService()
            logger.info("🔧 TOOL-BASED FLOW: LLMService initialized")
            self.validator = ToolValidator()
            logger.info("🔧 TOOL-BASED FLOW: ToolValidator initialized")
            self.enforcer = ToolEnforcer()
            logger.info("🔧 TOOL-BASED FLOW: ToolEnforcer initialized")
            self.aiops_logger = get_aiops_logger()
            logger.info("🔧 TOOL-BASED FLOW: AIOpsLogger initialized")
            self.metrics = get_metrics_service()
            logger.info("🔧 TOOL-BASED FLOW: MetricsService initialized")
            self.kb_tool = KnowledgeBaseTool()
            logger.info("🔧 TOOL-BASED FLOW: KnowledgeBaseTool initialized")
            self.response_tool = ResponseGeneratorTool()
            logger.info("🔧 TOOL-BASED FLOW: ResponseGeneratorTool initialized")
            self.perplexity_tool = PerplexityTool()
            logger.info("🔧 TOOL-BASED FLOW: PerplexityTool initialized")
            self.index_keywords_tool = IndexKeywordsTool()
            logger.info("🔧 TOOL-BASED FLOW: IndexKeywordsTool initialized")
            self.tool_definitions = get_tool_definitions()
            logger.info(f"🔧 TOOL-BASED FLOW: Loaded {len(self.tool_definitions)} tool definition(s)")
            logger.info("🔧 TOOL-BASED FLOW: ✅ ToolAgentController initialized successfully")
        except Exception as e:
            logger.error(f"🔧 TOOL-BASED FLOW: ❌ Failed to initialize ToolAgentController: {e}", exc_info=True)
            raise
    
    async def process_query(
        self,
        request: ChatRequest,
        session_id: str
    ) -> ChatResponse:
        """
        Process a query using tool-based agentic flow
        
        Args:
            request: Chat request with query and optional history
            session_id: Session ID for conversation context
        
        Returns:
            ChatResponse with answer and metadata
        """
        query_id = self.aiops_logger.start_query(
            request.query,
            session_id=session_id
        )
        
        start_time = time.time()
        all_tool_calls: List[Dict[str, Any]] = []
        kb_results = None
        perplexity_results = None
        final_response_data = None
        used_internal_kb = False
        used_external_kb = False
        all_citations: List[Citation] = []
        
        try:
            logger.info(f"🔧 TOOL-BASED FLOW: ========== STARTING TOOL-BASED FLOW ==========")
            logger.info(f"🔧 TOOL-BASED FLOW: Starting tool-based query processing")
            logger.info(f"🔧 TOOL-BASED FLOW: Query ID={query_id}, Session={session_id}")
            logger.info(f"🔧 TOOL-BASED FLOW: Query='{request.query[:200]}...'")
            logger.info(f"🔧 TOOL-BASED FLOW: This is ToolAgentController.process_query - NOT RAGOrchestrator")
            
            # Build system prompt with tool definitions
            system_prompt = PromptTemplates.get_tool_based_system_prompt()
            logger.debug(f"🔧 TOOL-BASED FLOW: System prompt length={len(system_prompt)}")
            logger.debug(f"🔧 TOOL-BASED FLOW: Available tools={[t['function']['name'] for t in self.tool_definitions]}")
            
            # Build messages
            messages = [{"role": "system", "content": system_prompt}]
            
            # Add conversation history if provided
            if request.conversation_history:
                logger.info(f"🔧 TOOL-BASED FLOW: Adding {len(request.conversation_history)} conversation history messages")
                for msg in request.conversation_history:
                    messages.append({
                        "role": msg.role,
                        "content": msg.content
                    })
            
            # Add user query
            messages.append({"role": "user", "content": request.query})
            logger.info(f"🔧 TOOL-BASED FLOW: Total messages={len(messages)} (system + history + user)")
            
            # Call LLM with tool calling enabled
            max_iterations = 5  # Prevent infinite loops
            iteration = 0
            llm_call_count = 0
            
            while iteration < max_iterations:
                iteration += 1
                logger.info(f"🔧 TOOL-BASED FLOW: Iteration {iteration}/{max_iterations}: Calling LLM with {len(self.tool_definitions)} tool(s)")
                
                # Record LLM call metrics
                llm_call_start = time.time()
                
                # Call LLM with tools
                logger.info(f"🔧 TOOL-BASED FLOW: Calling LLM with {len(self.tool_definitions)} tool definition(s)")
                logger.debug(f"🔧 TOOL-BASED FLOW: Tool definitions: {[t['function']['name'] for t in self.tool_definitions]}")
                
                # Determine tool_choice: use "required" to force tool calls (except when we already have response)
                # Use "required" for initial calls and when we need tool execution
                # Use "auto" only if we're in a retry scenario after getting a direct response
                tool_choice_value = "required" if not final_response_data else "auto"
                
                logger.info(f"🔧 TOOL-BASED FLOW: Using tool_choice='{tool_choice_value}' to enforce tool usage")
                
                llm_response = await self.llm_service.chat(
                    messages=messages,
                    tools=self.tool_definitions,
                    tool_choice=tool_choice_value  # Force tool calls with "required"
                )
                
                logger.info(f"🔧 TOOL-BASED FLOW: LLM response type: {type(llm_response)}")
                if isinstance(llm_response, dict):
                    logger.info(f"🔧 TOOL-BASED FLOW: LLM response keys: {list(llm_response.keys())}")
                
                # Check if response contains tool calls
                if isinstance(llm_response, dict) and "tool_calls" in llm_response:
                    tool_calls = llm_response["tool_calls"]
                    logger.info(f"🔧 TOOL-BASED FLOW: ✅ LLM returned {len(tool_calls)} tool call(s)")
                    for i, tc in enumerate(tool_calls, 1):
                        tool_name = tc["function"]["name"]
                        logger.info(f"🔧 TOOL-BASED FLOW:   Tool Call {i}: {tool_name} (id={tc.get('id', 'N/A')})")
                    
                    # Add assistant message with tool calls to conversation
                    messages.append({
                        "role": "assistant",
                        "content": llm_response.get("content", ""),
                        "tool_calls": tool_calls
                    })
                    
                    # Execute each tool call
                    tool_results = []
                    for idx, tool_call in enumerate(tool_calls, 1):
                        tool_name = tool_call["function"]["name"]
                        logger.info(f"🔧 TOOL-BASED FLOW: 🔨 Executing tool call {idx}/{len(tool_calls)}: {tool_name}")
                        try:
                            arguments = json.loads(tool_call["function"]["arguments"])
                            logger.info(f"🔧 TOOL-BASED FLOW:   Arguments: {json.dumps(arguments, indent=2)}")
                        except json.JSONDecodeError:
                            logger.error(f"🔧 TOOL-BASED FLOW: ❌ Invalid JSON in tool call arguments: {tool_call['function']['arguments']}")
                            arguments = {}
                        
                        # Validate tool call
                        is_valid, error = self.validator.validate_tool_name(tool_name)
                        if not is_valid:
                            logger.error(f"Invalid tool name: {error}")
                            tool_results.append({
                                "tool_call_id": tool_call["id"],
                                "role": "tool",
                                "name": tool_name,
                                "content": json.dumps({"error": error})
                            })
                            continue
                        
                        # Validate parameters
                        is_valid, error = self.validator.validate_parameters(arguments, tool_name)
                        if not is_valid:
                            logger.error(f"Invalid parameters for {tool_name}: {error}")
                            tool_results.append({
                                "tool_call_id": tool_call["id"],
                                "role": "tool",
                                "name": tool_name,
                                "content": json.dumps({"error": error})
                            })
                            continue
                        
                        # Track tool call
                        all_tool_calls.append({
                            "name": tool_name,
                            "parameters": arguments
                        })
                        logger.info(f"🔧 TOOL-BASED FLOW: 📝 Tracked tool call: {tool_name} (total calls: {len(all_tool_calls)})")
                        
                        # Execute tool
                        tool_start = time.time()
                        try:
                            if tool_name == "knowledge_base_search":
                                query_param = arguments.get("query", "")
                                kb_id_param = arguments.get("kb_id", "default")
                                top_k_param = arguments.get("top_k", 5)
                                logger.info(f"🔧 TOOL-BASED FLOW: 🔍 Calling KnowledgeBaseTool.execute(query='{query_param}', kb_id={kb_id_param}, top_k={top_k_param})")
                                result = await self.kb_tool.execute(
                                    query=query_param,
                                    kb_id=kb_id_param,
                                    top_k=top_k_param
                                )
                                kb_results = result
                                used_internal_kb = True
                                logger.info(f"🔧 TOOL-BASED FLOW: ✅ KnowledgeBaseTool returned {result.get('result_count', 0)} results")
                                
                                # Extract citations
                                if result.get("citations"):
                                    for cit_dict in result["citations"]:
                                        all_citations.append(Citation(**cit_dict))
                            
                            elif tool_name == "perplexity_search":
                                query_param = arguments.get("query", "")
                                additional_context = arguments.get("additional_context")
                                logger.info(f"🔧 TOOL-BASED FLOW: 🌐 Calling PerplexityTool.execute(query='{query_param[:100]}...')")
                                
                                try:
                                    result = await self.perplexity_tool.execute(
                                        query=query_param,
                                        additional_context=additional_context
                                    )
                                    perplexity_results = result
                                    used_external_kb = True
                                    logger.info(f"🔧 TOOL-BASED FLOW: ✅ PerplexityTool returned answer (length={len(result.get('answer', ''))}, citations={result.get('citation_count', 0)})")
                                    
                                    # Extract citations
                                    if result.get("citations"):
                                        for cit_dict in result["citations"]:
                                            all_citations.append(Citation(**cit_dict))
                                    
                                    # Automatically trigger keyword indexing after Perplexity (if successful)
                                    if result.get("success") and result.get("answer"):
                                        logger.info(f"🔧 TOOL-BASED FLOW: 🔄 Perplexity succeeded, will prompt LLM to index keywords")
                                        # Note: We'll let LLM decide to call index_keywords tool, but we can add a hint
                                        # The system prompt already instructs LLM to index keywords after Perplexity
                                except Exception as e:
                                    logger.error(f"🔧 TOOL-BASED FLOW: ❌ PerplexityTool execution failed: {e}", exc_info=True)
                                    # Handle Perplexity failure gracefully - continue with KB results only
                                    result = {
                                        "success": False,
                                        "error": str(e),
                                        "answer": "",
                                        "citations": [],
                                        "citation_count": 0
                                    }
                                    perplexity_results = result
                                    # Don't set used_external_kb = True if it failed
                            
                            elif tool_name == "index_keywords":
                                keywords_list = arguments.get("keywords", [])
                                query_id_param = arguments.get("query_id", query_id)
                                perplexity_result_id_param = arguments.get("perplexity_result_id")
                                session_id_param = arguments.get("session_id", session_id)
                                logger.info(f"🔧 TOOL-BASED FLOW: 📝 Calling IndexKeywordsTool.execute(keywords={len(keywords_list)})")
                                
                                try:
                                    result = self.index_keywords_tool.execute(
                                        keywords=keywords_list,
                                        query_id=query_id_param,
                                        perplexity_result_id=perplexity_result_id_param,
                                        session_id=session_id_param
                                    )
                                    logger.info(f"🔧 TOOL-BASED FLOW: ✅ IndexKeywordsTool indexed {len(result.get('indexed_keywords', []))} keywords")
                                except Exception as e:
                                    logger.error(f"🔧 TOOL-BASED FLOW: ❌ IndexKeywordsTool execution failed: {e}", exc_info=True)
                                    result = {
                                        "success": False,
                                        "error": str(e),
                                        "indexed_keywords": [],
                                        "invalid_keywords": [],
                                        "duplicate_keywords": []
                                    }
                            
                            elif tool_name == "generate_response":
                                response_text = arguments.get("response", "")
                                logger.info(f"🔧 TOOL-BASED FLOW: 📝 Calling ResponseGeneratorTool.execute(response_length={len(response_text)})")
                                result = self.response_tool.execute(
                                    response=response_text,
                                    sources=arguments.get("sources"),
                                    confidence_score=arguments.get("confidence_score", 0.8),
                                    kb_results=kb_results,
                                    perplexity_results=perplexity_results
                                )
                                final_response_data = result
                                logger.info(f"🔧 TOOL-BASED FLOW: ✅ ResponseGeneratorTool executed successfully")
                                
                                # Extract citations from response tool (already combined KB + Perplexity)
                                if result.get("citations"):
                                    all_citations.clear()  # Clear duplicates, use combined citations
                                    for cit_dict in result["citations"]:
                                        all_citations.append(Citation(**cit_dict))
                            
                            else:
                                logger.warning(f"🔧 TOOL-BASED FLOW: ⚠️ Unknown tool: {tool_name}")
                                result = {"error": f"Unknown tool: {tool_name}"}
                            
                            tool_duration = (time.time() - tool_start) * 1000
                            tool_status = "success" if result.get("success", True) else "failure"
                            logger.info(f"🔧 TOOL-BASED FLOW: ✅ Tool {tool_name} completed in {tool_duration:.2f}ms (status={tool_status})")
                            
                            # Record metrics
                            self.metrics.increment_counter(
                                "tool_calls_total",
                                labels={"tool_name": tool_name, "status": tool_status}
                            )
                            self.metrics.record_histogram(
                                "tool_call_duration_ms",
                                tool_duration,
                                labels={"tool_name": tool_name}
                            )
                            
                            # Log tool call
                            self.aiops_logger.log_tool_call(
                                tool_name=tool_name,
                                parameters=arguments,
                                result=result,
                                status=tool_status,
                                duration_ms=tool_duration
                            )
                            
                            # Add tool result to messages
                            tool_results.append({
                                "tool_call_id": tool_call["id"],
                                "role": "tool",
                                "name": tool_name,
                                "content": json.dumps(result)
                            })
                        
                        except Exception as e:
                            logger.error(f"🔧 TOOL-BASED FLOW: ❌ Error executing tool {tool_name}: {e}", exc_info=True)
                            tool_duration = (time.time() - tool_start) * 1000
                            self.aiops_logger.log_tool_call(
                                tool_name=tool_name,
                                parameters=arguments,
                                result=None,
                                status="failure",
                                duration_ms=tool_duration,
                                error_message=str(e)
                            )
                            tool_results.append({
                                "tool_call_id": tool_call["id"],
                                "role": "tool",
                                "name": tool_name,
                                "content": json.dumps({"error": str(e)})
                            })
                    
                    # Add tool results to messages
                    messages.extend(tool_results)
                    
                    # Check if response tool was called
                    if final_response_data:
                        break
                    
                    # Check mandatory tools
                    all_present, missing, feedback = self.enforcer.check_mandatory_tools(all_tool_calls)
                    if not all_present and iteration < max_iterations:
                        # Add feedback message
                        messages.append({
                            "role": "user",
                            "content": feedback or "Please call the required tools."
                        })
                        continue
                
                else:
                    # No tool calls - LLM returned direct response despite tool_choice="required"
                    logger.warning(f"🔧 TOOL-BASED FLOW: ⚠️ LLM returned direct response (no tool calls) despite tool_choice='required' - type={type(llm_response)}")
                    if isinstance(llm_response, str):
                        logger.warning(f"🔧 TOOL-BASED FLOW: ⚠️ LLM returned plain text instead of tool calls: {llm_response[:200]}...")
                    elif isinstance(llm_response, dict):
                        logger.warning(f"🔧 TOOL-BASED FLOW: ⚠️ LLM response dict keys: {list(llm_response.keys())}")
                    
                    # This should not happen with tool_choice="required", but handle it gracefully
                    # Add strong feedback to force tool usage
                    if iteration < max_iterations:
                        logger.warning(f"🔧 TOOL-BASED FLOW: 🔄 Retrying with explicit tool call requirement")
                        messages.append({
                            "role": "user",
                            "content": (
                                "CRITICAL: You MUST use tool calls to process this query. "
                                "Do NOT return text directly. You must call the knowledge_base_search tool first, "
                                "then evaluate if perplexity_search is needed, then call generate_response tool. "
                                "All responses must go through tool calls."
                            )
                        })
                        # Force tool_choice="required" again
                        continue
                    
                    # If we have a direct response but no tool calls, we still need to enforce
                    # For now, treat as error if no response tool was called
                    if not final_response_data:
                        logger.warning("🔧 TOOL-BASED FLOW: ⚠️ LLM returned direct response without using generate_response tool")
                        # Create a response from the direct content
                        if isinstance(llm_response, str):
                            final_response_data = {
                                "success": True,
                                "response": llm_response,
                                "citations": [],
                                "confidence_score": 0.7
                            }
                    break
            
            # Final validation: ensure response tool was called
            if not final_response_data:
                # Check if we have tool calls but no response
                response_called = any(
                    tc.get("name") == "generate_response" for tc in all_tool_calls
                )
                
                if not response_called:
                    # Retry once for response generation
                    logger.warning("Response generation tool not called, retrying...")
                    messages.append({
                        "role": "user",
                        "content": "You must call the generate_response tool to return the final answer. Do not return the response directly."
                    })
                    
                    # Force tool calls with "required" when retrying for response generation
                    logger.info(f"🔧 TOOL-BASED FLOW: Retrying with tool_choice='required' to force generate_response tool")
                    llm_response = await self.llm_service.chat(
                        messages=messages,
                        tools=self.tool_definitions,
                        tool_choice="required"  # Force tool call
                    )
                    
                    if isinstance(llm_response, dict) and "tool_calls" in llm_response:
                        for tool_call in llm_response["tool_calls"]:
                            tool_name = tool_call["function"]["name"]
                            if tool_name == "generate_response":
                                try:
                                    arguments = json.loads(tool_call["function"]["arguments"])
                                    final_response_data = self.response_tool.execute(
                                        response=arguments.get("response", ""),
                                        sources=arguments.get("sources"),
                                        confidence_score=arguments.get("confidence_score", 0.8),
                                        kb_results=kb_results,
                                        perplexity_results=perplexity_results
                                    )
                                    break
                                except Exception as e:
                                    logger.error(f"Error in retry response generation: {e}")
            
            # Build final response
            if final_response_data:
                answer = final_response_data.get("response", "I apologize, but I encountered an error generating the response.")
                confidence = final_response_data.get("confidence_score", 0.5)
            else:
                answer = "I apologize, but I was unable to generate a proper response. Please try again."
                confidence = 0.0
            
            processing_time = (time.time() - start_time) * 1000
            
            # Record overall metrics
            self.metrics.increment_counter("tool_based_flow_queries_total")
            self.metrics.record_histogram("tool_based_flow_processing_time_ms", processing_time)
            self.metrics.record_histogram("tool_based_flow_tool_calls_per_query", len(all_tool_calls))
            self.metrics.record_histogram("tool_based_flow_llm_calls_per_query", llm_call_count)
            
            if used_internal_kb:
                self.metrics.increment_counter("tool_based_flow_kb_usage_total")
            if used_external_kb:
                self.metrics.increment_counter("tool_based_flow_perplexity_usage_total")
            
            logger.info(f"🔧 TOOL-BASED FLOW: ========== COMPLETING TOOL-BASED FLOW ==========")
            logger.info(f"🔧 TOOL-BASED FLOW: Total tool calls made: {len(all_tool_calls)}")
            logger.info(f"🔧 TOOL-BASED FLOW: LLM calls made: {llm_call_count}")
            logger.info(f"🔧 TOOL-BASED FLOW: Used internal KB: {used_internal_kb}, Used external KB: {used_external_kb}")
            logger.info(f"🔧 TOOL-BASED FLOW: Processing time: {processing_time:.2f}ms")
            
            response = ChatResponse(
                session_id=session_id,
                query=request.query,
                answer=answer,
                sources=all_citations,
                confidence_score=confidence,
                used_internal_kb=used_internal_kb,
                used_external_kb=used_external_kb,
                processing_time_ms=int(processing_time),
                timestamp=datetime.utcnow().isoformat()
            )
            
            # Log final response
            self.aiops_logger.log_final_response(
                query=request.query,
                answer=answer,
                session_id=session_id,
                confidence_score=confidence,
                used_internal_kb=used_internal_kb,
                used_external_kb=used_external_kb,
                citations=[c.dict() for c in all_citations],
                processing_time_ms=processing_time
            )
            
            logger.info(f"🔧 TOOL-BASED FLOW: ========== TOOL-BASED FLOW COMPLETE ==========")
            return response
        
        except Exception as e:
            logger.error(f"🔧 TOOL-BASED FLOW: ❌ CRITICAL ERROR in ToolAgentController: {e}", exc_info=True)
            logger.error(f"🔧 TOOL-BASED FLOW: ❌ This error occurred in tool-based flow, NOT old flow")
            self.aiops_logger.log_error("query_processing_error", str(e))
            raise
        
        finally:
            self.aiops_logger.end_query()
            logger.info(f"🔧 TOOL-BASED FLOW: Query logging ended")
    
    async def process_query_stream(
        self,
        request: ChatRequest,
        session_id: str
    ):
        """
        Process a query using tool-based agentic flow with streaming response
        
        Strategy:
        1. Execute tool calls (non-streaming) to get KB results and decide on Perplexity
        2. Stream the final response generation
        
        Args:
            request: Chat request with query and optional history
            session_id: Session ID for conversation context
        
        Yields:
            Dictionary chunks with streaming data
        """
        query_id = self.aiops_logger.start_query(
            request.query,
            session_id=session_id
        )
        
        start_time = time.time()
        all_tool_calls: List[Dict[str, Any]] = []
        kb_results = None
        perplexity_results = None
        all_citations: List[Citation] = []
        used_internal_kb = False
        used_external_kb = False
        should_stream = False
        
        try:
            logger.info(f"🔧 TOOL-BASED FLOW (STREAMING): ========== STARTING TOOL-BASED STREAMING FLOW ==========")
            logger.info(f"🔧 TOOL-BASED FLOW (STREAMING): Query ID={query_id}, Session={session_id}")
            logger.info(f"🔧 TOOL-BASED FLOW (STREAMING): Query='{request.query[:200]}...'")
            
            # Build system prompt with tool definitions
            system_prompt = PromptTemplates.get_tool_based_system_prompt()
            
            # Build messages
            messages = [{"role": "system", "content": system_prompt}]
            
            # Add conversation history if provided
            if request.conversation_history:
                for msg in request.conversation_history:
                    messages.append({
                        "role": msg.role,
                        "content": msg.content
                    })
            
            # Add user query
            messages.append({"role": "user", "content": request.query})
            
            # Step 1: Execute tool calls (non-streaming) to get KB results
            logger.info(f"🔧 TOOL-BASED FLOW (STREAMING): Executing tool calls (non-streaming phase)")
            
            max_iterations = 5
            iteration = 0
            
            while iteration < max_iterations:
                iteration += 1
                logger.info(f"🔧 TOOL-BASED FLOW (STREAMING): Tool call iteration {iteration}/{max_iterations}")
                
                # Call LLM with tools (non-streaming)
                # Use "required" to force tool calls
                tool_choice_value = "required" if not should_stream else "auto"
                logger.info(f"🔧 TOOL-BASED FLOW (STREAMING): Using tool_choice='{tool_choice_value}'")
                
                llm_response = await self.llm_service.chat(
                    messages=messages,
                    tools=self.tool_definitions,
                    tool_choice=tool_choice_value
                )
                
                # Check if response contains tool calls
                if isinstance(llm_response, dict) and "tool_calls" in llm_response:
                    tool_calls = llm_response["tool_calls"]
                    logger.info(f"🔧 TOOL-BASED FLOW (STREAMING): ✅ LLM returned {len(tool_calls)} tool call(s)")
                    
                    # Add assistant message with tool calls
                    messages.append({
                        "role": "assistant",
                        "content": llm_response.get("content", ""),
                        "tool_calls": tool_calls
                    })
                    
                    # Execute tools
                    tool_results = []
                    for tool_call in tool_calls:
                        tool_name = tool_call["function"]["name"]
                        arguments = json.loads(tool_call["function"]["arguments"])
                        
                        all_tool_calls.append({
                            "name": tool_name,
                            "arguments": arguments
                        })
                        
                        logger.info(f"🔧 TOOL-BASED FLOW (STREAMING): 🔨 Executing tool: {tool_name}")
                        
                        try:
                            if tool_name == "knowledge_base_search":
                                result = await self.kb_tool.execute(**arguments)
                                kb_results = result
                                used_internal_kb = True
                                if "citations" in result:
                                    all_citations.extend([Citation(**c) for c in result["citations"]])
                                tool_results.append({
                                    "tool_call_id": tool_call["id"],
                                    "role": "tool",
                                    "name": tool_name,
                                    "content": json.dumps(result)
                                })
                            elif tool_name == "perplexity_search":
                                query_param = arguments.get("query", "")
                                additional_context = arguments.get("additional_context")
                                logger.info(f"🔧 TOOL-BASED FLOW (STREAMING): 🌐 Calling PerplexityTool.execute(query='{query_param[:100]}...')")
                                
                                try:
                                    result = await self.perplexity_tool.execute(
                                        query=query_param,
                                        additional_context=additional_context
                                    )
                                    perplexity_results = result
                                    used_external_kb = True
                                    if "citations" in result:
                                        all_citations.extend([Citation(**c) for c in result["citations"]])
                                    tool_results.append({
                                        "tool_call_id": tool_call["id"],
                                        "role": "tool",
                                        "name": tool_name,
                                        "content": json.dumps(result)
                                    })
                                except Exception as e:
                                    logger.error(f"🔧 TOOL-BASED FLOW (STREAMING): ❌ PerplexityTool execution failed: {e}", exc_info=True)
                                    result = {
                                        "success": False,
                                        "error": str(e),
                                        "answer": "",
                                        "citations": [],
                                        "citation_count": 0
                                    }
                                    perplexity_results = result
                                    tool_results.append({
                                        "tool_call_id": tool_call["id"],
                                        "role": "tool",
                                        "name": tool_name,
                                        "content": json.dumps(result)
                                    })
                            elif tool_name == "index_keywords":
                                keywords_list = arguments.get("keywords", [])
                                query_id_param = arguments.get("query_id", query_id)
                                perplexity_result_id_param = arguments.get("perplexity_result_id")
                                session_id_param = arguments.get("session_id", session_id)
                                logger.info(f"🔧 TOOL-BASED FLOW (STREAMING): 📝 Calling IndexKeywordsTool.execute(keywords={len(keywords_list)})")
                                
                                try:
                                    result = self.index_keywords_tool.execute(
                                        keywords=keywords_list,
                                        query_id=query_id_param,
                                        perplexity_result_id=perplexity_result_id_param,
                                        session_id=session_id_param
                                    )
                                    tool_results.append({
                                        "tool_call_id": tool_call["id"],
                                        "role": "tool",
                                        "name": tool_name,
                                        "content": json.dumps(result)
                                    })
                                except Exception as e:
                                    logger.error(f"🔧 TOOL-BASED FLOW (STREAMING): ❌ IndexKeywordsTool execution failed: {e}", exc_info=True)
                                    result = {
                                        "success": False,
                                        "error": str(e),
                                        "indexed_keywords": [],
                                        "invalid_keywords": [],
                                        "duplicate_keywords": []
                                    }
                                    tool_results.append({
                                        "tool_call_id": tool_call["id"],
                                        "role": "tool",
                                        "name": tool_name,
                                        "content": json.dumps(result)
                                    })
                            elif tool_name == "generate_response":
                                # Don't execute this tool - we'll stream the response instead
                                logger.info(f"🔧 TOOL-BASED FLOW (STREAMING): ⏭️ Skipping generate_response tool (will stream instead)")
                                should_stream = True
                                # Don't add tool result for generate_response
                            else:
                                result = {"error": f"Unknown tool: {tool_name}"}
                                tool_results.append({
                                    "tool_call_id": tool_call["id"],
                                    "role": "tool",
                                    "name": tool_name,
                                    "content": json.dumps(result)
                                })
                        except Exception as e:
                            logger.error(f"🔧 TOOL-BASED FLOW (STREAMING): ❌ Error executing tool {tool_name}: {e}", exc_info=True)
                            tool_results.append({
                                "tool_call_id": tool_call["id"],
                                "role": "tool",
                                "name": tool_name,
                                "content": json.dumps({"error": str(e)})
                            })
                    
                    # Add tool results to messages
                    if tool_results:
                        messages.extend(tool_results)
                    
                    # If we got KB results and LLM wants to generate response, break to streaming phase
                    if kb_results and should_stream:
                        logger.info(f"🔧 TOOL-BASED FLOW (STREAMING): ✅ KB results obtained, proceeding to streaming phase")
                        break
                    
                    # If we got KB results but no generate_response yet, continue to get response
                    if kb_results and not should_stream:
                        # Check if we should continue or break
                        if iteration >= max_iterations:
                            logger.info(f"🔧 TOOL-BASED FLOW (STREAMING): Max iterations reached, proceeding to streaming")
                            break
                    
                    # Check mandatory tools
                    all_present, missing, feedback = self.enforcer.check_mandatory_tools(all_tool_calls)
                    if not all_present and iteration < max_iterations:
                        messages.append({
                            "role": "user",
                            "content": feedback or "Please call the required tools."
                        })
                        continue
                else:
                    # No tool calls - break to streaming
                    logger.warning(f"🔧 TOOL-BASED FLOW (STREAMING): ⚠️ LLM returned direct response (no tool calls)")
                    break
            
            # Step 2: Stream the final response
            logger.info(f"🔧 TOOL-BASED FLOW (STREAMING): Starting streaming response generation")
            
            # Build context for streaming
            context_text = ""
            if kb_results and "results" in kb_results:
                context_text = "\n".join([
                    f"[{i+1}] {r.get('content', '')[:500]}"
                    for i, r in enumerate(kb_results["results"][:5])
                ])
            
            # Add context to messages for streaming
            if context_text:
                messages.append({
                    "role": "user",
                    "content": f"Based on the knowledge base search results above, please provide a comprehensive answer to: {request.query}"
                })
            
            # Stream the response
            answer_chunks = []
            async for chunk in self.llm_service.chat_stream(messages):
                answer_chunks.append(chunk)
                yield {
                    "type": "chunk",
                    "content": chunk,
                    "session_id": session_id
                }
            
            # Combine chunks into full answer
            full_answer = "".join(answer_chunks)
            
            # Yield final response metadata
            yield {
                "type": "complete",
                "session_id": session_id,
                "answer": full_answer,
                "citations": [c.dict() for c in all_citations],
                "used_internal_kb": used_internal_kb,
                "used_external_kb": used_external_kb,
                "processing_time_ms": int((time.time() - start_time) * 1000)
            }
            
            logger.info(f"🔧 TOOL-BASED FLOW (STREAMING): ========== TOOL-BASED STREAMING FLOW COMPLETE ==========")
        
        except Exception as e:
            logger.error(f"🔧 TOOL-BASED FLOW (STREAMING): ❌ CRITICAL ERROR: {e}", exc_info=True)
            self.aiops_logger.log_error("query_processing_error", str(e))
            yield {
                "type": "error",
                "message": str(e),
                "session_id": session_id
            }
        
        finally:
            self.aiops_logger.end_query()
            logger.info(f"🔧 TOOL-BASED FLOW (STREAMING): Query logging ended")
