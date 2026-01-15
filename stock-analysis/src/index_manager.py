"""Index Manager - Handles index initialization and updates"""

import json
import logging
from pathlib import Path
from typing import Dict, Any, Optional
from datetime import datetime

from .kb_tools.index_tools import IndexTools
from .kb_tools.report_tools import ReportTools

logger = logging.getLogger(__name__)


class IndexManager:
    """Manages graph-based index system initialization and updates."""
    
    def __init__(self, knowledge_base_dir: Path):
        """
        Initialize Index Manager.
        
        Args:
            knowledge_base_dir: Root directory of the knowledge base
        """
        self.kb_dir = Path(knowledge_base_dir)
        self.index_tools = IndexTools(self.kb_dir)
        self.report_tools = ReportTools(self.kb_dir)
    
    def initialize_root_index(self) -> Dict[str, Any]:
        """Initialize or update the root index."""
        root_index = self.index_tools.read_index(node_id="root")
        
        if not root_index:
            # Create new root index
            root_index = {
                "node_id": "root",
                "node_type": "root",
                "summary": "Knowledge base containing stock analysis reports.",
                "last_updated": datetime.now().isoformat(),
                "stock_count": 0,
                "stocks": [],
                "topics": []
            }
        
        # Scan knowledge base for stocks
        stocks = []
        for ticker_dir in self.kb_dir.iterdir():
            if not ticker_dir.is_dir() or ticker_dir.name.startswith("_"):
                continue
            
            ticker = ticker_dir.name
            most_recent_report = self.report_tools.read_report(ticker)
            
            if most_recent_report:
                analysis = most_recent_report.get("analysis", {})
                meta = analysis.get("meta", {})
                
                stocks.append({
                    "ticker": ticker,
                    "company_name": meta.get("company_name", ticker),
                    "latest_report_date": most_recent_report.get("analysis_date", ""),
                    "stock_index_id": f"{ticker}_stock_index",
                    "summary": analysis.get("executive_summary", {}).get("summary", "")[:100] if analysis.get("executive_summary") else ""
                })
        
        root_index["stocks"] = stocks
        root_index["stock_count"] = len(stocks)
        root_index["last_updated"] = datetime.now().isoformat()
        
        # Save root index (create if doesn't exist, update if exists)
        if self.index_tools.read_index(node_id="root"):
            self.index_tools.update_index("root", root_index)
        else:
            self.index_tools.create_index_node("root", root_index)
        
        return root_index
    
    def update_stock_index(self, ticker: str, report: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Update or create stock index after new report ingestion.
        
        Args:
            ticker: Stock ticker symbol
            report: Report dictionary
            
        Returns:
            Updated stock index node
        """
        node_id = f"{ticker.upper().replace(':', '_')}_stock_index"
        stock_index = self.index_tools.read_index(node_id=node_id)
        
        analysis = report.get("analysis", {})
        meta = analysis.get("meta", {})
        analysis_date = report.get("analysis_date", "")
        
        if not stock_index:
            # Create new stock index
            stock_index = {
                "node_id": node_id,
                "node_type": "stock",
                "ticker": ticker.upper().replace(":", "_"),
                "company_name": meta.get("company_name", ticker),
                "summary": "",
                "latest_report_date": analysis_date,
                "reports": [],
                "related_topics": [],
                "related_stocks": [],
                "last_updated": datetime.now().isoformat()
            }
        
        # Update summary from executive summary
        exec_summary = analysis.get("executive_summary", {})
        if exec_summary:
            stock_index["summary"] = exec_summary.get("summary", "")[:200]
        
        # Add/update report entry
        report_entry = {
            "date": analysis_date,
            "file_path": f"{ticker.upper().replace(':', '_')}/{analysis_date[:4]}/{ticker.upper().replace(':', '_')}_{analysis_date}.json",
            "summary": exec_summary.get("summary", "")[:150] if exec_summary else ""
        }
        
        # Update or add report
        reports = stock_index.get("reports", [])
        existing_idx = next((i for i, r in enumerate(reports) if r.get("date") == analysis_date), None)
        if existing_idx is not None:
            reports[existing_idx] = report_entry
        else:
            reports.append(report_entry)
        
        stock_index["reports"] = sorted(reports, key=lambda x: x.get("date", ""), reverse=True)
        stock_index["latest_report_date"] = analysis_date
        stock_index["last_updated"] = datetime.now().isoformat()
        
        # Extract related topics from report
        industry = analysis.get("industry_and_competition", {})
        if industry:
            # Extract sector/industry info for topic links
            industry_desc = industry.get("industry_description", "")
            # Simple topic extraction (can be enhanced)
            if "technology" in industry_desc.lower():
                if "topic_technology" not in stock_index.get("related_topics", []):
                    stock_index.setdefault("related_topics", []).append("topic_technology")
        
        # Extract related stocks (competitors)
        competitors = industry.get("key_competitors", []) if industry else []
        related_stocks = []
        for comp in competitors[:3]:  # Top 3 competitors
            comp_name = comp.get("name", "")
            # Map to ticker if possible (simplified)
            if "Microsoft" in comp_name:
                related_stocks.append("MSFT")
            elif "Google" in comp_name or "Alphabet" in comp_name:
                related_stocks.append("GOOGL")
            elif "Amazon" in comp_name:
                related_stocks.append("AMZN")
        
        stock_index["related_stocks"] = list(set(related_stocks))
        
        # Save stock index (create if doesn't exist, update if exists)
        if self.index_tools.read_index(node_id=node_id):
            self.index_tools.update_index(node_id, stock_index)
        else:
            self.index_tools.create_index_node("stock", stock_index)
        
        return stock_index
    
    def update_root_index_stock(self, ticker: str, report: Dict[str, Any]) -> None:
        """Update root index with new/updated stock entry."""
        root_index = self.index_tools.read_index(node_id="root")
        if not root_index:
            root_index = self.initialize_root_index()
        
        analysis = report.get("analysis", {})
        meta = analysis.get("meta", {})
        analysis_date = report.get("analysis_date", "")
        
        # Find or create stock entry
        stocks = root_index.get("stocks", [])
        stock_entry = next((s for s in stocks if s.get("ticker") == ticker.upper().replace(":", "_")), None)
        
        if stock_entry:
            stock_entry["latest_report_date"] = analysis_date
            stock_entry["summary"] = analysis.get("executive_summary", {}).get("summary", "")[:100] if analysis.get("executive_summary") else ""
        else:
            stocks.append({
                "ticker": ticker.upper().replace(":", "_"),
                "company_name": meta.get("company_name", ticker),
                "latest_report_date": analysis_date,
                "stock_index_id": f"{ticker.upper().replace(':', '_')}_stock_index",
                "summary": analysis.get("executive_summary", {}).get("summary", "")[:100] if analysis.get("executive_summary") else ""
            })
        
        root_index["stocks"] = stocks
        root_index["stock_count"] = len(stocks)
        root_index["last_updated"] = datetime.now().isoformat()
        
        self.index_tools.update_index("root", root_index)

