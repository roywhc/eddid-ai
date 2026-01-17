from fastapi import APIRouter
from app.models import ChatRequest, ChatResponse
from datetime import datetime
import time

router = APIRouter()

@router.post("/query")
async def chat_query(request: ChatRequest) -> ChatResponse:
    """User chat query endpoint"""
    
    start_time = time.time()
    
    # TODO: Implement RAG logic in Step 3
    # 1. Retrieve from internal KB
    # 2. Generate answer
    # 3. Check confidence
    # 4. Query Perplexity if needed
    
    processing_time = (time.time() - start_time) * 1000
    
    return ChatResponse(
        session_id=request.session_id or "new",
        query=request.query,
        answer="Answer from KB or Perplexity (to be implemented in Step 3)",
        sources=[],
        confidence_score=0.8,
        used_internal_kb=True,
        used_external_kb=False,
        processing_time_ms=processing_time,
        timestamp=datetime.utcnow()
    )

