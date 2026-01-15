"""Report Tools - Read and search operations on report files"""

import json
import logging
from pathlib import Path
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class ReportTools:
    """Tools for reading and searching stock analysis reports."""
    
    def __init__(self, knowledge_base_dir: Path):
        """
        Initialize Report Tools.
        
        Args:
            knowledge_base_dir: Root directory of the knowledge base
        """
        self.kb_dir = Path(knowledge_base_dir)
    
    def _get_storage_path(self, ticker: str, date: Optional[str] = None) -> Optional[Path]:
        """
        Get the storage path for a report.
        
        Args:
            ticker: Stock ticker symbol
            date: Analysis date in YYYY-MM-DD format (optional)
            
        Returns:
            Path object or None if not found
        """
        normalized_ticker = ticker.replace(":", "_").upper()
        ticker_dir = self.kb_dir / normalized_ticker
        
        if not ticker_dir.exists():
            return None
        
        if date:
            year = date[:4]
            file_path = ticker_dir / year / f"{normalized_ticker}_{date}.json"
            return file_path if file_path.exists() else None
        else:
            # Find most recent report
            most_recent = None
            most_recent_date = None
            
            for year_dir in ticker_dir.iterdir():
                if not year_dir.is_dir():
                    continue
                for report_file in year_dir.glob("*.json"):
                    try:
                        # Extract date from filename
                        filename = report_file.stem
                        if "_" in filename:
                            date_str = filename.split("_", 1)[1]
                            if date_str > (most_recent_date or ""):
                                most_recent = report_file
                                most_recent_date = date_str
                    except Exception:
                        continue
            
            return most_recent
    
    def read_report(self, ticker: str, date: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Read a stock analysis report.
        
        Args:
            ticker: Stock ticker symbol
            date: Analysis date in YYYY-MM-DD format (optional, defaults to most recent)
            
        Returns:
            Full report JSON or None if not found
        """
        file_path = self._get_storage_path(ticker, date)
        if not file_path:
            logger.debug(f"Report not found for {ticker} on {date or 'most recent'}")
            return None
        
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError) as e:
            logger.error(f"Error reading report {file_path}: {e}")
            return None
    
    def search_reports(
        self,
        tickers: Optional[List[str]] = None,
        date_range: Optional[Dict[str, str]] = None,
        topics: Optional[List[str]] = None,
        keywords: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        Search across multiple reports.
        
        Args:
            tickers: Optional list of ticker symbols to filter by
            date_range: Optional dict with 'start' and 'end' dates (YYYY-MM-DD)
            topics: Optional list of topics to search for
            keywords: Optional list of keywords to search for
            
        Returns:
            List of matching reports with excerpts and relevance scores
        """
        results = []
        
        # Determine which ticker directories to search
        if tickers:
            search_dirs = [self.kb_dir / t.replace(":", "_").upper() for t in tickers]
        else:
            search_dirs = [d for d in self.kb_dir.iterdir() if d.is_dir() and not d.name.startswith("_")]
        
        for ticker_dir in search_dirs:
            if not ticker_dir.exists():
                continue
            
            ticker = ticker_dir.name
            
            # Search all reports in this ticker directory
            for year_dir in ticker_dir.iterdir():
                if not year_dir.is_dir():
                    continue
                
                for report_file in year_dir.glob("*.json"):
                    try:
                        # Extract date from filename
                        filename = report_file.stem
                        if "_" not in filename:
                            continue
                        date_str = filename.split("_", 1)[1]
                        
                        # Check date range filter
                        if date_range:
                            start = date_range.get("start")
                            end = date_range.get("end")
                            if start and date_str < start:
                                continue
                            if end and date_str > end:
                                continue
                        
                        # Read report
                        with open(report_file, "r", encoding="utf-8") as f:
                            report = json.load(f)
                        
                        # Check topic/keyword matches
                        relevance_score = 0.0
                        excerpt = ""
                        
                        if topics or keywords:
                            report_text = json.dumps(report, default=str).lower()
                            search_terms = (topics or []) + (keywords or [])
                            
                            for term in search_terms:
                                if term.lower() in report_text:
                                    relevance_score += 1.0
                            
                            # Generate excerpt from relevant section
                            if topics:
                                for topic in topics:
                                    topic_lower = topic.lower()
                                    if topic_lower in ["risk", "risks"] and "risks" in report.get("analysis", {}):
                                        excerpt = str(report["analysis"]["risks"])[:200]
                                    elif topic_lower in ["valuation", "value"] and "valuation" in report.get("analysis", {}):
                                        excerpt = str(report["analysis"]["valuation"])[:200]
                                    elif topic_lower in ["catalyst", "catalysts"] and "catalysts" in report.get("analysis", {}):
                                        excerpt = str(report["analysis"]["catalysts"])[:200]
                        else:
                            # No filters, include all reports
                            relevance_score = 1.0
                            excerpt = report.get("analysis", {}).get("executive_summary", {}).get("summary", "")[:200]
                        
                        if relevance_score > 0 or not (topics or keywords):
                            results.append({
                                "ticker": ticker,
                                "date": date_str,
                                "file_path": str(report_file.relative_to(self.kb_dir)),
                                "excerpt": excerpt,
                                "relevance_score": relevance_score / max(len(topics or []) + len(keywords or []), 1),
                                "report": report
                            })
                    except (json.JSONDecodeError, IOError, KeyError) as e:
                        logger.warning(f"Error processing report {report_file}: {e}")
                        continue
        
        # Sort by relevance and date
        results.sort(key=lambda x: (x["relevance_score"], x["date"]), reverse=True)
        return results
    
    def save_report(self, report: Dict[str, Any]) -> Path:
        """
        Save a report to the knowledge base.
        
        Args:
            report: Report dictionary
            
        Returns:
            Path to the saved file
        """
        ticker = report.get("ticker", "")
        analysis_date = report.get("analysis_date", "")
        
        if not ticker or not analysis_date:
            raise ValueError("Report must have 'ticker' and 'analysis_date' fields")
        
        normalized_ticker = ticker.replace(":", "_").upper()
        year = analysis_date[:4]
        
        ticker_dir = self.kb_dir / normalized_ticker / year
        ticker_dir.mkdir(parents=True, exist_ok=True)
        
        filename = f"{normalized_ticker}_{analysis_date}.json"
        file_path = ticker_dir / filename
        
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Saved report to: {file_path}")
        return file_path

