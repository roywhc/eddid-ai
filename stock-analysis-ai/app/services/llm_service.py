"""
LLM Service - Supports OpenAI, OpenRouter, and Azure OpenAI
"""
from typing import Optional, List, Dict, Any
from openai import AsyncOpenAI
from app.config import settings, LLMProvider
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
        if self.provider == LLMProvider.OPENROUTER:
            if not settings.openrouter_api_key:
                raise ValueError("OpenRouter API key is required when using OpenRouter provider")
            
            self.client = AsyncOpenAI(
                api_key=settings.openrouter_api_key,
                base_url=settings.openrouter_base_url,
                default_headers={
                    "HTTP-Referer": "https://github.com/your-org/agentic-kb",  # Optional: for analytics
                    "X-Title": "Agentic KB System"  # Optional: for analytics
                }
            )
            logger.info(f"Initialized OpenRouter client with model: {self.model}")
        
        elif self.provider == LLMProvider.OPENAI:
            if not settings.openai_api_key:
                raise ValueError("OpenAI API key is required when using OpenAI provider")
            
            self.client = AsyncOpenAI(
                api_key=settings.openai_api_key
            )
            logger.info(f"Initialized OpenAI client with model: {self.model}")
        
        elif self.provider == LLMProvider.AZURE_OPENAI:
            if not settings.azure_openai_api_key:
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
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature or self.temperature,
                max_tokens=max_tokens,
                **kwargs
            )
            
            content = response.choices[0].message.content
            logger.debug(f"LLM response received (provider: {self.provider}, model: {self.model})")
            return content
        
        except Exception as e:
            logger.error(f"LLM API error (provider: {self.provider}): {e}")
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


