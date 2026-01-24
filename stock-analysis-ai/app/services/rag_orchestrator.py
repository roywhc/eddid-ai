"""RAG orchestrator for coordinating retrieval, LLM, and response formatting"""
import logging
import time
from typing import List
from datetime import datetime
from app.services.retrieval import RetrievalService
from app.services.confidence import ConfidenceService
from app.services.session_manager import SessionManager
from app.services.llm_service import LLMService
from app.services.external_knowledge import PerplexityService
from app.services.kb_curator import KBCuratorService
from app.config import settings
from app.models import ChatRequest, ChatResponse, ChatMessage, Citation, RetrievalResult
from app.utils.aiops_logger import get_aiops_logger

logger = logging.getLogger(__name__)


class RAGOrchestrator:
    """Orchestrates the RAG pipeline: retrieval, LLM generation, and response formatting"""
    
    def __init__(self):
        """Initialize RAG orchestrator with all required services"""
        self.retrieval_service = RetrievalService()
        self.confidence_service = ConfidenceService()
        self.session_manager = SessionManager()
        self.llm_service = LLMService()
        self.perplexity_service = PerplexityService()
        self.kb_curator = KBCuratorService()
        self.aiops_logger = get_aiops_logger()
        logger.info("RAGOrchestrator initialized with Perplexity integration and KB curator")
    
    async def process_query(self, request: ChatRequest) -> ChatResponse:
        """
        Process a chat query through the full RAG pipeline
        
        Args:
            request: ChatRequest with query and optional session info
        
        Returns:
            ChatResponse with answer, citations, and metadata
        
        Raises:
            Exception: If any step in the pipeline fails
        """
        start_time = time.time()
        session_id = request.session_id
        
        # Start AIOps logging
        query_id = self.aiops_logger.start_query(
            query=request.query,
            session_id=session_id,
            use_external_kb=request.use_external_kb,
            include_sources=request.include_sources
        )
        
        try:
            # Get or create session
            if not session_id:
                session_id = self.session_manager.create_session()
                logger.debug(f"Created new session: {session_id}")
            else:
                # Ensure session exists
                _ = self.session_manager.get_history(session_id)
            
            # Get conversation history
            conversation_history = request.conversation_history or []
            if not conversation_history:
                # Try to get from session manager
                conversation_history = self.session_manager.get_history(session_id)
            
            # Step 1: Retrieve from internal KB
            # For Phase 3, we use a default kb_id. In Phase 5, this will be configurable
            kb_id = "default_kb"  # TODO: Make configurable per request
            logger.debug(f"Retrieving from KB: {kb_id}")
            
            retrieval_results = await self.retrieval_service.retrieve(
                query=request.query,
                kb_id=kb_id,
                top_k=5
            )
            
            # Step 2: Calculate confidence score
            confidence_score = self.confidence_service.calculate_confidence(
                retrieval_results,
                request.query
            )
            logger.debug(f"Confidence score: {confidence_score:.2f}")
            
            # Log KB search results (after confidence calculation)
            self.aiops_logger.log_kb_search(
                query=request.query,
                kb_id=kb_id,
                results=[
                    {
                        "chunk_id": r.chunk_id,
                        "score": r.score,
                        "content": r.content,
                        "metadata": {
                            "doc_id": r.metadata.doc_id,
                            "section_title": r.metadata.section_title,
                            "section_path": r.metadata.section_path
                        }
                    }
                    for r in retrieval_results
                ],
                confidence_score=confidence_score
            )
            
            # Step 3: Query external knowledge if needed
            external_result = None
            used_external_kb = False
            
            should_query_external = (
                request.use_external_kb and 
                (confidence_score < settings.kb_confidence_threshold or len(retrieval_results) == 0)
            )
            
            if should_query_external:
                try:
                    logger.info(f"Confidence below threshold ({confidence_score:.2f} < {settings.kb_confidence_threshold}), querying external knowledge")
                    
                    # Prepare additional context from internal KB if available
                    additional_context = None
                    if retrieval_results:
                        context_text = "\n".join([r.content[:500] for r in retrieval_results[:3]])
                        additional_context = f"Internal knowledge base context:\n{context_text}"
                    
                    perplexity_start = time.time()
                    external_result = await self.perplexity_service.search(
                        query=request.query,
                        additional_context=additional_context
                    )
                    perplexity_time = (time.time() - perplexity_start) * 1000
                    used_external_kb = True
                    logger.info(f"External knowledge retrieved ({len(external_result.citations)} citations)")
                    
                    # Log Perplexity query
                    self.aiops_logger.log_perplexity_query(
                        query=request.query,
                        additional_context=additional_context,
                        response={
                            "answer": external_result.answer,
                            "citations": external_result.citations
                        },
                        query_time_ms=perplexity_time
                    )
                
                except Exception as e:
                    logger.warning(f"External knowledge query failed, using internal KB only: {e}")
                    # Log error
                    self.aiops_logger.log_error(
                        error_type="PerplexityError",
                        error_message=str(e)
                    )
                    # Continue with internal KB only
                    used_external_kb = False
            
            # Step 4: Generate answer using LLM with combined context
            # Combine internal and external context
            combined_context = list(retrieval_results)
            if external_result:
                # Add external knowledge as context
                # We'll pass it separately to the LLM service
                pass
            
            answer = await self.llm_service.generate_answer(
                query=request.query,
                context=retrieval_results,
                conversation_history=conversation_history,
                external_context=external_result
            )
            
            # Step 5: Extract citations from both internal and external sources
            citations = self._extract_citations(retrieval_results)
            if external_result:
                external_citations = self.perplexity_service.convert_to_citations(
                    external_result.citations
                )
                citations.extend(external_citations)
                logger.debug(f"Combined {len(citations)} citations (internal + external)")
            
            # Step 6: Store messages in session history
            user_message = ChatMessage(
                role="user",
                content=request.query,
                timestamp=datetime.utcnow()
            )
            self.session_manager.add_message(session_id, user_message)
            
            assistant_message = ChatMessage(
                role="assistant",
                content=answer,
                timestamp=datetime.utcnow()
            )
            self.session_manager.add_message(session_id, assistant_message)
            
            # Step 7: Calculate processing time
            processing_time = (time.time() - start_time) * 1000  # Convert to milliseconds
            
            # Step 8: Generate candidate entry if external KB was used
            candidate_id = None
            if used_external_kb and external_result:
                try:
                    candidate_id = self.kb_curator.generate_and_save_candidate(
                        query=request.query,
                        answer=answer,
                        citations=citations,
                        kb_id=kb_id
                    )
                    if candidate_id:
                        logger.info(f"Generated candidate entry: {candidate_id}")
                except Exception as e:
                    logger.warning(f"Failed to generate candidate entry: {e}")
                    # Don't fail the request if candidate generation fails
            
            # Step 9: Build response
            response = ChatResponse(
                session_id=session_id,
                query=request.query,
                answer=answer,
                sources=citations if request.include_sources else [],
                confidence_score=confidence_score,
                used_internal_kb=len(retrieval_results) > 0,
                used_external_kb=used_external_kb,
                processing_time_ms=processing_time,
                timestamp=datetime.utcnow()
            )
            
            # Log final response
            citation_dicts = []
            for c in citations:
                if hasattr(c, 'dict'):
                    citation_dicts.append(c.dict())
                elif hasattr(c, '__dict__'):
                    citation_dicts.append(c.__dict__)
                elif isinstance(c, dict):
                    citation_dicts.append(c)
                else:
                    # Fallback: try to extract common fields
                    citation_dicts.append({
                        "source": getattr(c, 'source', None),
                        "document_id": getattr(c, 'document_id', None),
                        "document_title": getattr(c, 'document_title', None),
                        "url": getattr(c, 'url', None),
                        "relevance_score": getattr(c, 'relevance_score', None)
                    })
            
            self.aiops_logger.log_final_response(
                query=request.query,
                answer=answer,
                session_id=session_id,
                confidence_score=confidence_score,
                used_internal_kb=len(retrieval_results) > 0,
                used_external_kb=used_external_kb,
                citations=citation_dicts,
                processing_time_ms=processing_time,
                candidate_id=candidate_id if used_external_kb and external_result else None
            )
            
            logger.info(
                f"Processed query for session {session_id} "
                f"(confidence: {confidence_score:.2f}, time: {processing_time:.1f}ms, "
                f"internal: {len(retrieval_results) > 0}, external: {used_external_kb})"
            )
            
            # End AIOps logging
            self.aiops_logger.end_query()
            
            return response
        
        except Exception as e:
            logger.error(f"Error processing query: {e}", exc_info=True)
            # Log error
            self.aiops_logger.log_error(
                error_type=type(e).__name__,
                error_message=str(e)
            )
            # End AIOps logging even on error
            self.aiops_logger.end_query()
            raise
    
    def _extract_citations(self, results: List[RetrievalResult]) -> List[Citation]:
        """
        Extract citations from retrieval results
        
        Args:
            results: List of RetrievalResult objects
        
        Returns:
            List of Citation objects
        """
        citations = []
        
        for result in results:
            metadata = result.metadata
            
            citation = Citation(
                source="internal",
                document_id=metadata.doc_id,
                document_title=metadata.section_title or metadata.doc_id,
                section=metadata.section_path,
                url=None,  # Internal KB doesn't have URLs
                relevance_score=result.score,
                snippet=result.content[:200] if len(result.content) > 200 else result.content
            )
            
            citations.append(citation)
        
        return citations
