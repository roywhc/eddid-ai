#!/usr/bin/env python3
"""
Stock Analysis Report Generator using Perplexity API

This module generates comprehensive stock analysis reports using the Perplexity API
and stores them in a local knowledge base.
"""

import os
import json
import argparse
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any
from dotenv import load_dotenv

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

# Load environment variables
load_dotenv()


class StockAnalysisGenerator:
    """Generates stock analysis reports using Perplexity API."""
    
    def __init__(self, api_key: Optional[str] = None, knowledge_base_dir: str = "./knowledge_base"):
        """
        Initialize the Stock Analysis Generator.
        
        Args:
            api_key: Perplexity API key. If None, reads from PERPLEXITY_API_KEY env var.
            knowledge_base_dir: Directory to store analysis reports.
        """
        self.api_key = api_key or os.getenv("PERPLEXITY_API_KEY")
        if not self.api_key:
            raise ValueError(
                "Perplexity API key is required. "
                "Set PERPLEXITY_API_KEY environment variable or pass api_key parameter."
            )
        
        # Initialize client based on available SDK
        if PERPLEXITY_SDK_AVAILABLE:
            self.client = Perplexity(api_key=self.api_key)
        else:
            # Use OpenAI compatibility mode
            self.client = OpenAI(
                api_key=self.api_key,
                base_url="https://api.perplexity.ai"
            )
        self.knowledge_base_dir = Path(knowledge_base_dir)
        self.knowledge_base_dir.mkdir(parents=True, exist_ok=True)
        
        # Load the system prompt
        prompt_file = Path(__file__).parent / "docs" / "perplexity-stock-analysis-prompt.md"
        if prompt_file.exists():
            with open(prompt_file, "r", encoding="utf-8") as f:
                self.system_prompt = f.read()
        else:
            raise FileNotFoundError(f"Prompt file not found: {prompt_file}")
    
    def _build_user_query(self, ticker: str, analysis_date: str, focus_areas: Optional[str] = None) -> str:
        """
        Build the user query from ticker, date, and optional focus areas.
        
        Args:
            ticker: Stock ticker symbol (e.g., AAPL, MSFT, HKEX:9988)
            analysis_date: Analysis date in YYYY-MM-DD format
            focus_areas: Optional specific focus areas or metrics
            
        Returns:
            Formatted user query string
        """
        query = f"Analyze {ticker} as of {analysis_date}."
        if focus_areas:
            query += f" Focus on {focus_areas}."
        return query
    
    def _get_storage_path(self, ticker: str, analysis_date: str) -> Path:
        """
        Get the storage path for a report.
        
        Args:
            ticker: Stock ticker symbol
            analysis_date: Analysis date in YYYY-MM-DD format
            
        Returns:
            Path object for the report file
        """
        # Normalize ticker (remove colons, convert to uppercase)
        normalized_ticker = ticker.replace(":", "_").upper()
        year = analysis_date[:4]
        
        # Create directory structure: knowledge_base/{ticker}/{year}/
        ticker_dir = self.knowledge_base_dir / normalized_ticker / year
        ticker_dir.mkdir(parents=True, exist_ok=True)
        
        # File name: {ticker}_{date}.json
        filename = f"{normalized_ticker}_{analysis_date}.json"
        return ticker_dir / filename
    
    def generate_analysis(
        self,
        ticker: str,
        analysis_date: Optional[str] = None,
        focus_areas: Optional[str] = None,
        model: str = "sonar-pro",
        use_streaming: bool = False
    ) -> Dict[str, Any]:
        """
        Generate a stock analysis report using Perplexity API.
        
        Args:
            ticker: Stock ticker symbol
            analysis_date: Analysis date in YYYY-MM-DD format (defaults to today)
            focus_areas: Optional specific focus areas or metrics
            model: Perplexity model to use (default: sonar-pro)
            use_streaming: Whether to use streaming responses
            
        Returns:
            Dictionary containing the analysis report and metadata
        """
        # Default to today's date if not provided
        if analysis_date is None:
            analysis_date = datetime.now().strftime("%Y-%m-%d")
        
        user_query = self._build_user_query(ticker, analysis_date, focus_areas)
        
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": user_query}
        ]
        
        print(f"Generating analysis for {ticker} as of {analysis_date}...")
        print(f"Using model: {model}")
        if focus_areas:
            print(f"Focus areas: {focus_areas}")
        
        try:
            if use_streaming:
                return self._generate_streaming(messages, model, ticker, analysis_date)
            else:
                return self._generate_non_streaming(messages, model, ticker, analysis_date)
        except Exception as e:
            error_type = type(e).__name__
            if PERPLEXITY_SDK_AVAILABLE:
                if isinstance(e, perplexity.RateLimitError):
                    retry_after = getattr(e.response, 'headers', {}).get('Retry-After', 'unknown') if hasattr(e, 'response') else 'unknown'
                    print(f"Rate limit exceeded. Retry after: {retry_after}")
                    raise
                elif isinstance(e, perplexity.AuthenticationError):
                    print("Authentication failed. Please check your API key.")
                    raise
                elif isinstance(e, perplexity.APIStatusError):
                    status_code = getattr(e, 'status_code', 'unknown')
                    message = getattr(e, 'message', str(e))
                    print(f"API error: {status_code} - {message}")
                    raise
            else:
                # OpenAI compatibility mode error handling
                if hasattr(e, 'status_code'):
                    if e.status_code == 429:
                        print(f"Rate limit exceeded. {str(e)}")
                        raise
                    elif e.status_code == 401 or e.status_code == 403:
                        print("Authentication failed. Please check your API key.")
                        raise
                    else:
                        print(f"API error: {e.status_code} - {str(e)}")
                        raise
            print(f"Unexpected error: {error_type}: {e}")
            raise
    
    def _generate_non_streaming(
        self,
        messages: list,
        model: str,
        ticker: str,
        analysis_date: str
    ) -> Dict[str, Any]:
        """Generate analysis using non-streaming API."""
        response = self.client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.2,  # Lower temperature for more consistent, factual output
            max_tokens=4000,  # Allow for comprehensive reports
            return_related_questions=False
        )
        
        content = response.choices[0].message.content
        
        # Try to parse as JSON
        try:
            analysis_json = json.loads(content)
        except json.JSONDecodeError:
            # If not valid JSON, wrap it in a structure
            print("Warning: Response is not valid JSON. Storing as raw content.")
            analysis_json = {
                "raw_content": content,
                "parse_error": "Response was not valid JSON"
            }
        
        result = {
            "ticker": ticker,
            "analysis_date": analysis_date,
            "generated_at": datetime.now().isoformat(),
            "model": model,
            "analysis": analysis_json,
            "usage": {
                "prompt_tokens": response.usage.prompt_tokens if response.usage else None,
                "completion_tokens": response.usage.completion_tokens if response.usage else None,
                "total_tokens": response.usage.total_tokens if response.usage else None
            }
        }
        
        return result
    
    def _generate_streaming(
        self,
        messages: list,
        model: str,
        ticker: str,
        analysis_date: str
    ) -> Dict[str, Any]:
        """Generate analysis using streaming API."""
        stream = self.client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.2,
            max_tokens=4000,
            stream=True,
            return_related_questions=False
        )
        
        content = ""
        usage_info = None
        
        print("Streaming response...")
        for chunk in stream:
            if chunk.choices[0].delta.content:
                chunk_content = chunk.choices[0].delta.content
                content += chunk_content
                print(chunk_content, end="", flush=True)
            
            if hasattr(chunk, 'usage') and chunk.usage:
                usage_info = chunk.usage
        
        print("\n")  # New line after streaming
        
        # Try to parse as JSON
        try:
            analysis_json = json.loads(content)
        except json.JSONDecodeError:
            print("Warning: Response is not valid JSON. Storing as raw content.")
            analysis_json = {
                "raw_content": content,
                "parse_error": "Response was not valid JSON"
            }
        
        result = {
            "ticker": ticker,
            "analysis_date": analysis_date,
            "generated_at": datetime.now().isoformat(),
            "model": model,
            "analysis": analysis_json,
            "usage": {
                "prompt_tokens": usage_info.prompt_tokens if usage_info else None,
                "completion_tokens": usage_info.completion_tokens if usage_info else None,
                "total_tokens": usage_info.total_tokens if usage_info else None
            }
        }
        
        return result
    
    def save_report(self, report: Dict[str, Any]) -> Path:
        """
        Save a report to the knowledge base.
        
        Args:
            report: Report dictionary from generate_analysis()
            
        Returns:
            Path to the saved file
        """
        ticker = report["ticker"]
        analysis_date = report["analysis_date"]
        storage_path = self._get_storage_path(ticker, analysis_date)
        
        with open(storage_path, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        print(f"Report saved to: {storage_path}")
        return storage_path
    
    def load_report(self, ticker: str, analysis_date: str) -> Optional[Dict[str, Any]]:
        """
        Load a report from the knowledge base.
        
        Args:
            ticker: Stock ticker symbol
            analysis_date: Analysis date in YYYY-MM-DD format
            
        Returns:
            Report dictionary if found, None otherwise
        """
        storage_path = self._get_storage_path(ticker, analysis_date)
        
        if not storage_path.exists():
            return None
        
        with open(storage_path, "r", encoding="utf-8") as f:
            return json.load(f)
    
    def list_reports(self, ticker: Optional[str] = None) -> list:
        """
        List all available reports in the knowledge base.
        
        Args:
            ticker: Optional ticker to filter by
            
        Returns:
            List of report metadata dictionaries
        """
        reports = []
        
        if ticker:
            normalized_ticker = ticker.replace(":", "_").upper()
            ticker_dir = self.knowledge_base_dir / normalized_ticker
            if not ticker_dir.exists():
                return reports
            search_dirs = [ticker_dir]
        else:
            search_dirs = [d for d in self.knowledge_base_dir.iterdir() if d.is_dir()]
        
        for ticker_dir in search_dirs:
            for year_dir in ticker_dir.iterdir():
                if not year_dir.is_dir():
                    continue
                for report_file in year_dir.glob("*.json"):
                    try:
                        with open(report_file, "r", encoding="utf-8") as f:
                            report = json.load(f)
                            reports.append({
                                "ticker": report.get("ticker"),
                                "analysis_date": report.get("analysis_date"),
                                "generated_at": report.get("generated_at"),
                                "file_path": str(report_file)
                            })
                    except (json.JSONDecodeError, KeyError):
                        continue
        
        return sorted(reports, key=lambda x: x.get("analysis_date", ""), reverse=True)


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Generate and manage stock analysis reports using Perplexity API"
    )
    
    subparsers = parser.add_subparsers(dest="command", help="Command to execute")
    
    # Generate command
    gen_parser = subparsers.add_parser("generate", help="Generate a new analysis report")
    gen_parser.add_argument("ticker", help="Stock ticker symbol (e.g., AAPL, MSFT, HKEX:9988)")
    gen_parser.add_argument("date", nargs="?", default=None, help="Analysis date in YYYY-MM-DD format (defaults to today)")
    gen_parser.add_argument("--focus", help="Optional focus areas or metrics")
    gen_parser.add_argument("--model", default="sonar-pro", help="Perplexity model to use")
    gen_parser.add_argument("--stream", action="store_true", help="Use streaming responses")
    gen_parser.add_argument("--kb-dir", default="./knowledge_base", help="Knowledge base directory")
    gen_parser.add_argument("--no-save", action="store_true", help="Don't save to knowledge base")
    
    # Load command
    load_parser = subparsers.add_parser("load", help="Load an existing report")
    load_parser.add_argument("ticker", help="Stock ticker symbol")
    load_parser.add_argument("date", nargs="?", default=None, help="Analysis date in YYYY-MM-DD format (defaults to today)")
    load_parser.add_argument("--kb-dir", default="./knowledge_base", help="Knowledge base directory")
    
    # List command
    list_parser = subparsers.add_parser("list", help="List all reports")
    list_parser.add_argument("--ticker", help="Filter by ticker symbol")
    list_parser.add_argument("--kb-dir", default="./knowledge_base", help="Knowledge base directory")
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    try:
        kb_dir = getattr(args, "kb_dir", "./knowledge_base")
        generator = StockAnalysisGenerator(knowledge_base_dir=kb_dir)
        
        if args.command == "generate":
            # Use today's date if not provided
            analysis_date = args.date or datetime.now().strftime("%Y-%m-%d")
            report = generator.generate_analysis(
                ticker=args.ticker,
                analysis_date=analysis_date,
                focus_areas=getattr(args, "focus", None),
                model=args.model,
                use_streaming=args.stream
            )
            
            if not args.no_save:
                generator.save_report(report)
            else:
                print("\n" + "="*80)
                print("REPORT (not saved):")
                print("="*80)
                print(json.dumps(report, indent=2))
        
        elif args.command == "load":
            # Use today's date if not provided
            analysis_date = args.date or datetime.now().strftime("%Y-%m-%d")
            report = generator.load_report(ticker=args.ticker, analysis_date=analysis_date)
            if report:
                print(json.dumps(report, indent=2))
            else:
                print(f"Report not found for {args.ticker} on {analysis_date}")
        
        elif args.command == "list":
            reports = generator.list_reports(ticker=getattr(args, "ticker", None))
            if reports:
                print(f"Found {len(reports)} report(s):\n")
                for report in reports:
                    print(f"  {report['ticker']} - {report['analysis_date']} ({report['generated_at']})")
                    print(f"    {report['file_path']}\n")
            else:
                print("No reports found.")
    
    except Exception as e:
        print(f"Error: {e}")
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main())

