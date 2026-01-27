"""Chat API endpoint for RAG queries"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.models import ChatRequest, ChatResponse
from app.services.rag_orchestrator import RAGOrchestrator
from app.services.tool_agent_controller import ToolAgentController
from app.services.session_manager import SessionManager
import logging
import json
from typing import AsyncGenerator

logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize tool agent controller (singleton pattern)
_tool_agent_controller: ToolAgentController = None
_session_manager: SessionManager = None

def get_tool_agent_controller() -> ToolAgentController:
    """Get or create tool agent controller instance"""
    global _tool_agent_controller
    if _tool_agent_controller is None:
        _tool_agent_controller = ToolAgentController()
        logger.info("ToolAgentController initialized for chat API")
    return _tool_agent_controller

def get_session_manager() -> SessionManager:
    """Get or create session manager instance"""
    global _session_manager
    if _session_manager is None:
        _session_manager = SessionManager()
        logger.info("SessionManager initialized for chat API")
    return _session_manager

# Legacy RAG orchestrator (DEPRECATED - only for streaming endpoint)
_orchestrator: RAGOrchestrator = None

def get_orchestrator() -> RAGOrchestrator:
    """Get or create RAG orchestrator instance (legacy - DEPRECATED, only for streaming)"""
    global _orchestrator
    if _orchestrator is None:
        logger.warning("⚠️ DEPRECATED: RAGOrchestrator is being initialized (legacy, only for streaming)")
        _orchestrator = RAGOrchestrator()
        logger.info("RAGOrchestrator initialized for chat API (legacy - streaming only)")
    return _orchestrator

@router.post("/query")
async def chat_query(request: ChatRequest) -> ChatResponse:
    """
    User chat query endpoint with RAG (Retrieval-Augmented Generation)
    
    Processes queries through the full RAG pipeline:
    1. Retrieves relevant chunks from internal knowledge base
    2. Calculates confidence score
    3. Generates answer using LLM with retrieved context
    4. Returns answer with citations and metadata
    
    Args:
        request: ChatRequest with query and optional session info
    
    Returns:
        ChatResponse with answer, citations, confidence score, and metadata
    
    Raises:
        HTTPException: If processing fails
    """
    try:
        # Validate request
        if not request.query or not request.query.strip():
            raise HTTPException(
                status_code=400,
                detail="Query cannot be empty"
            )
        
        if len(request.query) > 5000:
            raise HTTPException(
                status_code=400,
                detail="Query exceeds maximum length of 5000 characters"
            )
        
        logger.info(f"🔧 TOOL-BASED FLOW: Processing chat query (session: {request.session_id or 'new'})")
        logger.info(f"🔧 TOOL-BASED FLOW: Query='{request.query[:100]}...'")
        
        # Get or create session ID
        session_manager = get_session_manager()
        session_id = request.session_id or session_manager.create_session()
        
        # Maintain conversation context across tool calls
        if request.conversation_history:
            # Update session with conversation history
            for msg in request.conversation_history:
                session_manager.add_message(session_id, msg)
        
        # Process query through tool-based agent controller
        logger.info(f"🔧 TOOL-BASED FLOW: Using ToolAgentController (NOT legacy RAGOrchestrator)")
        try:
            controller = get_tool_agent_controller()
            logger.info(f"🔧 TOOL-BASED FLOW: ToolAgentController obtained successfully")
            response = await controller.process_query(request, session_id)
            logger.info(f"🔧 TOOL-BASED FLOW: ToolAgentController.process_query completed successfully")
        except Exception as e:
            logger.error(f"🔧 TOOL-BASED FLOW: ❌ Error in ToolAgentController: {e}", exc_info=True)
            logger.error(f"🔧 TOOL-BASED FLOW: ❌ DO NOT FALLBACK TO OLD FLOW - This is a critical error")
            raise HTTPException(
                status_code=500,
                detail=f"Tool-based flow error: {str(e)}"
            )
        
        # Maintain context after tool calls
        tool_calls = []  # Will be populated from controller if needed
        session_manager.maintain_context(session_id, tool_calls)
        
        logger.info(
            f"Query processed successfully "
            f"(session: {response.session_id}, confidence: {response.confidence_score:.2f})"
        )
        
        return response
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing chat query: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

@router.post("/query/stream")
async def chat_query_stream(request: ChatRequest):
    """
    Streaming chat query endpoint with RAG
    
    Returns Server-Sent Events (SSE) stream with answer chunks as they are generated.
    """
    try:
        # Validate request
        if not request.query or not request.query.strip():
            raise HTTPException(
                status_code=400,
                detail="Query cannot be empty"
            )
        
        if len(request.query) > 5000:
            raise HTTPException(
                status_code=400,
                detail="Query exceeds maximum length of 5000 characters"
            )
        
        logger.info(f"🔧 TOOL-BASED FLOW (STREAMING): Processing streaming chat query (session: {request.session_id or 'new'})")
        logger.info(f"🔧 TOOL-BASED FLOW (STREAMING): Query='{request.query[:100]}...'")
        
        # Get or create session ID
        session_manager = get_session_manager()
        session_id = request.session_id or session_manager.create_session()
        
        # Maintain conversation context
        if request.conversation_history:
            for msg in request.conversation_history:
                session_manager.add_message(session_id, msg)
        
        async def generate_stream() -> AsyncGenerator[str, None]:
            """Generate SSE stream"""
            try:
                # Use ToolAgentController for streaming (tool-based flow)
                logger.info(f"🔧 TOOL-BASED FLOW (STREAMING): Using ToolAgentController (NOT legacy RAGOrchestrator)")
                controller = get_tool_agent_controller()
                
                # Process query and stream response
                async for chunk in controller.process_query_stream(request, session_id):
                    # Format as SSE
                    yield f"data: {json.dumps(chunk)}\n\n"
                
                # Send end marker
                yield "data: [DONE]\n\n"
            except Exception as e:
                logger.error(f"🔧 TOOL-BASED FLOW (STREAMING): ❌ Error in streaming: {e}", exc_info=True)
                error_chunk = {"type": "error", "message": str(e)}
                yield f"data: {json.dumps(error_chunk)}\n\n"
        
        return StreamingResponse(
            generate_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"  # Disable nginx buffering
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing streaming chat query: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

