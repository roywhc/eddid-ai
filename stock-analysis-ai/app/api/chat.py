"""Chat API endpoint for RAG queries"""
from fastapi import APIRouter, HTTPException
from app.models import ChatRequest, ChatResponse
from app.services.rag_orchestrator import RAGOrchestrator
import logging

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

