"""Chat API endpoint for RAG queries"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.models import ChatRequest, ChatResponse
from app.services.rag_orchestrator import RAGOrchestrator
import logging
import json
from typing import AsyncGenerator

logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize RAG orchestrator (singleton pattern)
_orchestrator: RAGOrchestrator = None

def get_orchestrator() -> RAGOrchestrator:
    """Get or create RAG orchestrator instance"""
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = RAGOrchestrator()
        logger.info("RAGOrchestrator initialized for chat API")
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
        
        logger.info(f"Processing chat query (session: {request.session_id or 'new'})")
        
        # Process query through RAG orchestrator
        orchestrator = get_orchestrator()
        response = await orchestrator.process_query(request)
        
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
        
        logger.info(f"Processing streaming chat query (session: {request.session_id or 'new'})")
        
        async def generate_stream() -> AsyncGenerator[str, None]:
            """Generate SSE stream"""
            try:
                orchestrator = get_orchestrator()
                
                # Process query and stream response
                async for chunk in orchestrator.process_query_stream(request):
                    # Format as SSE
                    yield f"data: {json.dumps(chunk)}\n\n"
                
                # Send end marker
                yield "data: [DONE]\n\n"
            except Exception as e:
                logger.error(f"Error in streaming: {e}", exc_info=True)
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

