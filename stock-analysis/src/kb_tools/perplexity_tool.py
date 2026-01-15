"""Perplexity Research Tool - External API integration for report generation"""

import os
import json
import logging
from pathlib import Path
from typing import Optional, Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)

# Try to import Perplexity SDK, fallback to OpenAI compatibility mode
try:
    from perplexity import Perplexity
    import perplexity
    PERPLEXITY_SDK_AVAILABLE = True
except ImportError:
    try:
        from openai import OpenAI
        PERPLEXITY_SDK_AVAILABLE = False
    except ImportError:
        raise ImportError(
            "Neither 'perplexityai' nor 'openai' package is installed. "
            "Please install: pip install perplexityai"
        )


class PerplexityResearchTool:
    """Tool for generating stock analysis reports using Perplexity API."""
    
    def __init__(self, api_key: Optional[str] = None, knowledge_base_dir: Path = None, prompt_file: Optional[Path] = None):
        """
        Initialize Perplexity Research Tool.
        
        Args:
            api_key: Perplexity API key (defaults to PERPLEXITY_API_KEY env var)
            knowledge_base_dir: Knowledge base directory for storing reports
            prompt_file: Path to system prompt file
        """
        self.api_key = api_key or os.getenv("PERPLEXITY_API_KEY")
        if not self.api_key:
            raise ValueError(
                "Perplexity API key is required. "
                "Set PERPLEXITY_API_KEY environment variable or pass api_key parameter."
            )
        
        # Initialize client
        if PERPLEXITY_SDK_AVAILABLE:
            self.client = Perplexity(api_key=self.api_key)
        else:
            self.client = OpenAI(
                api_key=self.api_key,
                base_url="https://api.perplexity.ai"
            )
        
        self.kb_dir = Path(knowledge_base_dir) if knowledge_base_dir else None
        
        # Load system prompt
        if prompt_file and prompt_file.exists():
            with open(prompt_file, "r", encoding="utf-8") as f:
                self.system_prompt = f.read()
        else:
            # Default prompt location
            default_prompt = Path(__file__).parent.parent.parent / "docs" / "perplexity-stock-analysis-prompt.md"
            if default_prompt.exists():
                with open(default_prompt, "r", encoding="utf-8") as f:
                    self.system_prompt = f.read()
            else:
                raise FileNotFoundError(f"Prompt file not found: {prompt_file or default_prompt}")
    
    def research(
        self,
        ticker: str,
        date: Optional[str] = None,
        focus_areas: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None,
        model: str = "sonar-pro"
    ) -> Dict[str, Any]:
        """
        Generate a stock analysis report using Perplexity API.
        
        Args:
            ticker: Stock ticker symbol
            date: Analysis date in YYYY-MM-DD format (defaults to today)
            focus_areas: Optional specific focus areas or metrics
            context: Optional context from existing reports
            model: Perplexity model to use
            
        Returns:
            Generated report dictionary
        """
        if date is None:
            date = datetime.now().strftime("%Y-%m-%d")
        
        # Build user query
        query = f"Analyze {ticker} as of {date}."
        if focus_areas:
            query += f" Focus on {focus_areas}."
        if context and context.get("existing_reports"):
            query += f" Context: Previous analysis available."
        
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": query}
        ]
        
        logger.info(f"Generating analysis for {ticker} as of {date} using {model}")
        
        try:
            response = self.client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=0.2,
                max_tokens=4000,
                return_related_questions=False
            )
            
            content = response.choices[0].message.content
            
            # Try to parse as JSON
            try:
                analysis_json = json.loads(content)
            except json.JSONDecodeError:
                logger.warning("Response is not valid JSON. Storing as raw content.")
                analysis_json = {
                    "raw_content": content,
                    "parse_error": "Response was not valid JSON"
                }
            
            result = {
                "ticker": ticker,
                "analysis_date": date,
                "generated_at": datetime.now().isoformat(),
                "model": model,
                "analysis": analysis_json,
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens if response.usage else None,
                    "completion_tokens": response.usage.completion_tokens if response.usage else None,
                    "total_tokens": response.usage.total_tokens if response.usage else None
                }
            }
            
            # Store report if knowledge base directory is provided
            if self.kb_dir:
                self._save_report(result)
            
            return result
            
        except Exception as e:
            error_type = type(e).__name__
            if PERPLEXITY_SDK_AVAILABLE:
                if isinstance(e, perplexity.RateLimitError):
                    logger.error(f"Rate limit exceeded: {e}")
                    raise
                elif isinstance(e, perplexity.AuthenticationError):
                    logger.error("Authentication failed. Please check your API key.")
                    raise
                elif isinstance(e, perplexity.APIStatusError):
                    logger.error(f"API error: {e.status_code} - {e.message}")
                    raise
            else:
                if hasattr(e, 'status_code'):
                    if e.status_code == 429:
                        logger.error(f"Rate limit exceeded: {e}")
                        raise
                    elif e.status_code in (401, 403):
                        logger.error("Authentication failed. Please check your API key.")
                        raise
                    else:
                        logger.error(f"API error: {e.status_code} - {str(e)}")
                        raise
            
            logger.error(f"Unexpected error: {error_type}: {e}")
            raise
    
    def _save_report(self, report: Dict[str, Any]) -> Path:
        """Save report to knowledge base."""
        from .report_tools import ReportTools
        
        report_tools = ReportTools(self.kb_dir)
        return report_tools.save_report(report)

