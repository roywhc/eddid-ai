"""
External Knowledge Service - Perplexity API Integration
"""
from typing import Optional, List, Dict, Any
from openai import AsyncOpenAI
from app.config import settings
from app.models import ExternalKnowledgeResult, Citation
from app.utils.stock_analysis_detector import StockAnalysisDetector
from app.utils.prompt_templates import PromptTemplates
import logging
import time

logger = logging.getLogger(__name__)


class PerplexityService:
    """Perplexity Sonar API integration for external knowledge retrieval"""
    
    def __init__(self):
        """Initialize Perplexity service"""
        if not settings.perplexity_api_key:
            logger.warning("Perplexity API key not set - external knowledge queries will fail")
        
        self.client = AsyncOpenAI(
            api_key=settings.perplexity_api_key or "dummy-key",
            base_url="https://api.perplexity.ai"
        )
        self.model = settings.perplexity_model
        self.timeout = settings.perplexity_timeout
        
        logger.info(f"PerplexityService initialized with model: {self.model}")
    
    async def search(
        self,
        query: str,
        additional_context: Optional[str] = None
    ) -> ExternalKnowledgeResult:
        """
        Search using Perplexity Sonar API
        
        Args:
            query: User query string
            additional_context: Optional context from internal KB to improve search
        
        Returns:
            ExternalKnowledgeResult with answer, citations, and metadata
        
        Raises:
            Exception: If API call fails
        """
        if not settings.perplexity_api_key:
            raise ValueError("Perplexity API key is required for external knowledge queries")
        
        start_time = time.time()
        
        try:
            # Check if this is a stock analysis query
            is_stock_analysis = (
                StockAnalysisDetector.is_stock_analysis_query(query) and
                not StockAnalysisDetector.has_explicit_requirements(query)
            )
            
            # Build system prompt
            if is_stock_analysis:
                stock_info = StockAnalysisDetector.get_analysis_info(query)
                system_prompt = PromptTemplates.format_stock_template(
                    ticker=stock_info.get("ticker"),
                    current_date=stock_info.get("current_date"),
                    user_enquiry=stock_info.get("user_enquiry")
                )
                logger.info(f"Using stock analysis template for query: {query[:50]}...")
            else:
                system_prompt = (
                    "You are a helpful assistant. Provide accurate, well-cited answers. "
                    "Always cite your sources using the provided citations."
                )
            
            # Build user message
            user_message = query
            if additional_context:
                if is_stock_analysis:
                    user_message = f"{query}\n\nAdditional context from internal knowledge base:\n{additional_context}\n\nUse this context to inform your comprehensive stock analysis."
                else:
                    user_message = f"{query}\n\nAdditional context from internal knowledge base:\n{additional_context}"
            
            logger.info(f"Querying Perplexity API for: {query[:50]}...")
            
            # Make API call
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                temperature=settings.llm_temperature,
                timeout=self.timeout
            )
            
            # Extract answer
            answer = response.choices[0].message.content
            
            # Extract citations
            citations = self._extract_citations(response)
            
            query_time = (time.time() - start_time) * 1000  # Convert to milliseconds
            
            logger.info(
                f"Perplexity search completed (time: {query_time:.1f}ms, "
                f"citations: {len(citations)})"
            )
            
            return ExternalKnowledgeResult(
                answer=answer,
                citations=citations,
                raw_response=response.model_dump() if hasattr(response, 'model_dump') else {},
                query_time_ms=query_time
            )
        
        except Exception as e:
            query_time = (time.time() - start_time) * 1000
            logger.error(f"Perplexity API error (time: {query_time:.1f}ms): {e}", exc_info=True)
            raise
    
    def _extract_citations(self, response) -> List[Dict[str, str]]:
        """
        Extract citations from Perplexity response
        
        Args:
            response: OpenAI API response object
        
        Returns:
            List of citation dictionaries
        """
        citations = []
        
        try:
            # Perplexity includes citations in the response
            # Check for citations in various possible locations
            if hasattr(response, 'citations') and response.citations:
                citations = response.citations
            elif hasattr(response, 'choices') and len(response.choices) > 0:
                choice = response.choices[0]
                if hasattr(choice, 'message') and hasattr(choice.message, 'citations'):
                    citations = choice.message.citations
                elif hasattr(choice, 'citations'):
                    citations = choice.citations
            
            # If no structured citations, try to extract from answer text
            if not citations and hasattr(response, 'choices') and len(response.choices) > 0:
                answer = response.choices[0].message.content
                # Perplexity often includes URLs in the answer text
                # This is a basic extraction - can be enhanced
                import re
                url_pattern = r'https?://[^\s\)]+'
                urls = re.findall(url_pattern, answer)
                if urls:
                    citations = [{"url": url, "type": "web"} for url in urls[:10]]  # Limit to 10
            
            # Convert to standard format
            formatted_citations = []
            for citation in citations:
                if isinstance(citation, dict):
                    formatted_citations.append(citation)
                elif isinstance(citation, str):
                    formatted_citations.append({"url": citation, "type": "web"})
            
            logger.debug(f"Extracted {len(formatted_citations)} citations from Perplexity response")
            return formatted_citations
        
        except Exception as e:
            logger.warning(f"Error extracting citations: {e}")
            return []
    
    def convert_to_citations(self, perplexity_citations: List[Dict[str, str]]) -> List[Citation]:
        """
        Convert Perplexity citation format to internal Citation model
        
        Args:
            perplexity_citations: List of citation dicts from Perplexity
        
        Returns:
            List of Citation objects
        """
        citations = []
        
        for idx, cit in enumerate(perplexity_citations):
            citation = Citation(
                source="external",
                document_id=None,
                document_title=cit.get("title") or cit.get("name") or f"Source {idx + 1}",
                section=None,
                url=cit.get("url") or cit.get("link"),
                relevance_score=None,  # Perplexity doesn't provide relevance scores
                snippet=cit.get("snippet") or cit.get("excerpt")
            )
            citations.append(citation)
        
        return citations
