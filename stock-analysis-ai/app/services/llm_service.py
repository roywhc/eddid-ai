"""
LLM Service - Supports OpenAI, OpenRouter, and Azure OpenAI
"""
from typing import Optional, List, Dict, Any
from openai import AsyncOpenAI
from app.config import settings, LLMProvider
from app.utils.stock_analysis_detector import StockAnalysisDetector
from app.utils.prompt_templates import PromptTemplates
import logging

logger = logging.getLogger(__name__)


class LLMService:
    """Unified LLM service supporting multiple providers"""
    
    def __init__(self):
        self.client: Optional[AsyncOpenAI] = None
        self.provider = settings.llm_provider
        self.model = settings.llm_model
        self.temperature = settings.llm_temperature
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize the appropriate LLM client based on provider"""
        # For testing, allow initialization without API key (will fail on actual API call)
        import os
        test_mode = os.getenv("TEST_MODE", "false").lower() == "true"
        
        if self.provider == LLMProvider.OPENROUTER:
            if not settings.openrouter_api_key and not test_mode:
                raise ValueError("OpenRouter API key is required when using OpenRouter provider")
            
            # Use dummy key for testing if not provided
            api_key = settings.openrouter_api_key or "test-key"
            base_url = settings.openrouter_base_url
            
            logger.info(f"Initializing OpenRouter client:")
            logger.info(f"  - Base URL: {base_url}")
            logger.info(f"  - Model: {self.model}")
            logger.info(f"  - API Key: {'*' * 10 if api_key and api_key != 'test-key' else 'NOT SET'}")
            
            self.client = AsyncOpenAI(
                api_key=api_key,
                base_url=base_url,
                default_headers={
                    "HTTP-Referer": "https://github.com/your-org/agentic-kb",  # Optional: for analytics
                    "X-Title": "Agentic KB System"  # Optional: for analytics
                }
            )
            logger.info(f"✅ OpenRouter client initialized successfully with model: {self.model}")
        
        elif self.provider == LLMProvider.OPENAI:
            if not settings.openai_api_key and not test_mode:
                raise ValueError("OpenAI API key is required when using OpenAI provider")
            
            # Use dummy key for testing if not provided
            api_key = settings.openai_api_key or "test-key"
            self.client = AsyncOpenAI(
                api_key=api_key
            )
            logger.info(f"Initialized OpenAI client with model: {self.model}")
        
        elif self.provider == LLMProvider.AZURE_OPENAI:
            if not settings.azure_openai_api_key and not test_mode:
                raise ValueError("Azure OpenAI API key is required when using Azure OpenAI provider")
            
            # Azure OpenAI requires different configuration
            # This is a placeholder - Azure setup would need additional config
            raise NotImplementedError("Azure OpenAI support not yet implemented")
        
        else:
            raise ValueError(f"Unknown LLM provider: {self.provider}")
    
    async def chat(
        self,
        messages: List[Dict[str, str]],
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> str:
        """
        Send a chat completion request
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            temperature: Override default temperature
            max_tokens: Maximum tokens in response
            **kwargs: Additional parameters for the API call
        
        Returns:
            Response content string
        """
        if not self.client:
            raise RuntimeError("LLM client not initialized")
        
        # Verify configuration before making request
        if self.provider == LLMProvider.OPENROUTER:
            # Get actual base URL from client (AsyncOpenAI stores it in _client._base_url)
            actual_base_url = None
            try:
                if hasattr(self.client, '_client') and hasattr(self.client._client, '_base_url'):
                    actual_base_url = str(self.client._client._base_url)
                elif hasattr(self.client, 'base_url'):
                    actual_base_url = str(self.client.base_url)
            except Exception:
                pass
            
            # Log configuration verification
            logger.info(f"🔍 Verifying OpenRouter configuration:")
            logger.info(f"  - Configured base URL: {settings.openrouter_base_url}")
            logger.info(f"  - Actual client base URL: {actual_base_url or 'Could not determine'}")
            logger.info(f"  - Model: {self.model}")
            logger.info(f"  - Provider setting: {self.provider.value}")
            
            if actual_base_url:
                if "openrouter.ai" not in actual_base_url:
                    logger.error(f"❌ CRITICAL: Base URL doesn't contain 'openrouter.ai': {actual_base_url}")
                    logger.error(f"   Expected: {settings.openrouter_base_url}")
                    logger.error(f"   This means OpenRouter is NOT being used correctly!")
                else:
                    logger.info(f"✅ Verified OpenRouter base URL: {actual_base_url}")
            
            # Verify model name format (OpenRouter uses provider/model format)
            if "/" not in self.model:
                logger.warning(f"⚠️  Model name format might be incorrect: {self.model}")
                logger.warning(f"   Expected format for OpenRouter: provider/model-name (e.g., deepseek/deepseek-v3.2)")
            else:
                logger.info(f"✅ Model name format correct: {self.model}")
        
        try:
            # Log the request details for debugging
            logger.info(f"Making LLM API call:")
            logger.info(f"  - Provider: {self.provider.value}")
            logger.info(f"  - Model: {self.model}")
            logger.info(f"  - Base URL: {getattr(self.client, 'base_url', 'N/A')}")
            logger.info(f"  - Messages count: {len(messages)}")
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature or self.temperature,
                max_tokens=max_tokens,
                **kwargs
            )
            
            content = response.choices[0].message.content
            logger.info(f"✅ LLM response received (provider: {self.provider.value}, model: {self.model})")
            logger.debug(f"Response length: {len(content)} characters")
            return content
        
        except Exception as e:
            logger.error(f"❌ LLM API error:")
            logger.error(f"  - Provider: {self.provider.value}")
            logger.error(f"  - Model: {self.model}")
            logger.error(f"  - Base URL: {getattr(self.client, 'base_url', 'N/A')}")
            logger.error(f"  - Error type: {type(e).__name__}")
            logger.error(f"  - Error message: {str(e)}")
            raise
    
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> str:
        """
        Generate a response from a prompt
        
        Args:
            prompt: User prompt
            system_prompt: Optional system prompt
            temperature: Override default temperature
            max_tokens: Maximum tokens in response
            **kwargs: Additional parameters
        
        Returns:
            Generated text
        """
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        return await self.chat(messages, temperature=temperature, max_tokens=max_tokens, **kwargs)
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the current model configuration"""
        return {
            "provider": self.provider.value,
            "model": self.model,
            "temperature": self.temperature,
            "base_url": getattr(self.client, "base_url", None) if self.client else None
        }
    
    async def generate_answer(
        self,
        query: str,
        context: List,
        conversation_history: List = None,
        external_context = None
    ) -> str:
        """
        Generate answer using RAG (Retrieval-Augmented Generation) with context
        
        Args:
            query: User query
            context: List of RetrievalResult objects from vector store
            conversation_history: List of ChatMessage objects for conversation context
            external_context: Optional ExternalKnowledgeResult from Perplexity
        
        Returns:
            Generated answer string
        """
        if conversation_history is None:
            conversation_history = []
        
        # Build system prompt with context (pass query for stock analysis detection)
        system_prompt = self._build_rag_system_prompt(context, external_context, query=query)
        
        # Build messages with conversation history
        messages = []
        
        # Add system prompt
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        
        # Add conversation history
        for msg in conversation_history:
            messages.append({
                "role": msg.role,
                "content": msg.content
            })
        
        # Add current query
        messages.append({"role": "user", "content": query})
        
        # Generate answer
        try:
            answer = await self.chat(messages, temperature=self.temperature)
            logger.debug(f"Generated answer for query: {query[:50]}...")
            return answer
        except Exception as e:
            logger.error(f"Error generating answer: {e}", exc_info=True)
            raise
    
    def _build_rag_system_prompt(self, context: List, external_context = None, query: str = "") -> str:
        """
        Build system prompt with retrieved context for RAG
        
        Args:
            context: List of RetrievalResult objects
            external_context: Optional ExternalKnowledgeResult from Perplexity
            query: User query string (for stock analysis detection)
        
        Returns:
            System prompt string with context
        """
        has_internal = context and len(context) > 0
        has_external = external_context is not None
        
        # Check if this is a stock analysis query without explicit requirements
        is_stock_analysis = False
        stock_info = None
        
        if query:
            is_stock_analysis = (
                StockAnalysisDetector.is_stock_analysis_query(query) and
                not StockAnalysisDetector.has_explicit_requirements(query)
            )
            
            if is_stock_analysis:
                stock_info = StockAnalysisDetector.get_analysis_info(query)
                logger.info(f"Detected stock analysis query for ticker: {stock_info.get('ticker', 'N/A')}")
        
        # Use stock analysis template if applicable
        if is_stock_analysis and stock_info:
            base_prompt = PromptTemplates.format_stock_template(
                ticker=stock_info.get("ticker"),
                current_date=stock_info.get("current_date"),
                user_enquiry=stock_info.get("user_enquiry")
            )
            
            # Add context sections to the template
            context_sections = []
            if has_internal:
                for i, result in enumerate(context, 1):
                    content = result.content if hasattr(result, 'content') else str(result)
                    context_sections.append(f"\n[Internal Knowledge Base - Context {i}]\n{content}\n")
            
            if has_external:
                context_sections.append(
                    f"\n[External Knowledge Source]\n{external_context.answer}\n"
                )
            
            if context_sections:
                context_text = "\n".join(context_sections)
                prompt = f"{base_prompt}\n\nAdditional Context from Knowledge Sources:{context_text}\n\nUse the above context to inform your analysis. Provide a comprehensive answer without including source citations in your response."
            else:
                prompt = f"{base_prompt}\n\nUse the latest available data from external sources to inform your analysis. Provide a comprehensive answer without including source citations in your response."
            
            return prompt
        
        # Default RAG prompts (non-stock analysis or with explicit requirements)
        if not has_internal and not has_external:
            return (
                "You are a helpful assistant. "
                "Answer questions based on the information provided. "
                "If you don't have specific information, say so clearly."
            )
        
        # Build internal context section
        context_sections = []
        if has_internal:
            for i, result in enumerate(context, 1):
                content = result.content if hasattr(result, 'content') else str(result)
                context_sections.append(f"[Internal Knowledge Base - Context {i}]\n{content}\n")
        
        # Add external context if available
        if has_external:
            context_sections.append(
                f"[External Knowledge Source]\n{external_context.answer}\n"
            )
        
        context_text = "\n".join(context_sections)
        
        # Build prompt based on available sources
        if has_internal and has_external:
            prompt = (
                "You are a helpful assistant that answers questions based on both internal knowledge base "
                "and external knowledge sources. Use the following context to answer the user's question. "
                "Prioritize information from the internal knowledge base when available, but supplement "
                "with external knowledge when needed.\n\n"
                f"{context_text}\n"
                "Answer the user's question based on the context above. "
                "Be accurate, concise, and provide a clear answer without including source citations in your response."
            )
        elif has_internal:
            prompt = (
                "You are a helpful assistant that answers questions based on the provided context from "
                "the internal knowledge base. Use the following context to answer the user's question. "
                "If the context doesn't contain relevant information, say so clearly.\n\n"
                f"{context_text}\n"
                "Answer the user's question based on the context above. "
                "Be accurate, concise, and provide a clear answer without including source citations in your response."
            )
        else:  # has_external only
            prompt = (
                "You are a helpful assistant that answers questions based on external knowledge sources. "
                "Use the following context to answer the user's question.\n\n"
                f"{context_text}\n"
                "Answer the user's question based on the context above. "
                "Be accurate, concise, and provide a clear answer without including source citations in your response."
            )
        
        return prompt


