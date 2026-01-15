"""Index Tools - CRUD operations on graph-based index nodes"""

import json
import logging
from pathlib import Path
from typing import Optional, Dict, Any, List
from datetime import datetime
import tempfile
import shutil

logger = logging.getLogger(__name__)


class IndexTools:
    """Tools for managing graph-based index nodes in the knowledge base."""
    
    def __init__(self, knowledge_base_dir: Path):
        """
        Initialize Index Tools.
        
        Args:
            knowledge_base_dir: Root directory of the knowledge base
        """
        self.kb_dir = Path(knowledge_base_dir)
        self.indexes_dir = self.kb_dir / "_indexes"
        self.indexes_dir.mkdir(parents=True, exist_ok=True)
        
        # Ensure subdirectories exist
        (self.indexes_dir / "topics").mkdir(exist_ok=True)
        (self.indexes_dir / "stocks").mkdir(exist_ok=True)
        (self.indexes_dir / "dates").mkdir(exist_ok=True)
    
    def read_index(self, node_id: Optional[str] = None, node_path: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Read an index node from the knowledge base.
        
        Args:
            node_id: Unique node identifier (e.g., "AAPL_stock_index", "root")
            node_path: Relative path to index file (e.g., "stocks/AAPL.json", "root.json")
            
        Returns:
            Index node dictionary or None if not found
        """
        if node_path:
            file_path = self.indexes_dir / node_path
        elif node_id:
            # Determine path from node_id
            if node_id == "root":
                file_path = self.indexes_dir / "root.json"
            elif node_id.endswith("_stock_index"):
                ticker = node_id.replace("_stock_index", "")
                file_path = self.indexes_dir / "stocks" / f"{ticker}.json"
            elif node_id.startswith("topic_"):
                topic_name = node_id.replace("topic_", "")
                file_path = self.indexes_dir / "topics" / f"{topic_name}.json"
            elif node_id.startswith("date_"):
                date_str = node_id.replace("date_", "").replace("-", "_")
                file_path = self.indexes_dir / "dates" / f"{date_str}.json"
            else:
                logger.warning(f"Unknown node_id format: {node_id}")
                return None
        else:
            logger.error("Either node_id or node_path must be provided")
            return None
        
        if not file_path.exists():
            logger.debug(f"Index file not found: {file_path}")
            return None
        
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError) as e:
            logger.error(f"Error reading index file {file_path}: {e}")
            return None
    
    def search_index(self, query_text: str, node_type: Optional[str] = None, max_results: int = 10) -> List[Dict[str, Any]]:
        """
        Search index nodes by text query.
        
        Args:
            query_text: Search query
            node_type: Optional filter by node type (root, topic, stock, date)
            max_results: Maximum number of results to return
            
        Returns:
            List of matching index nodes with relevance scores
        """
        results = []
        query_lower = query_text.lower()
        
        # Search all index files
        search_paths = []
        if node_type is None or node_type == "root":
            search_paths.append(self.indexes_dir / "root.json")
        if node_type is None or node_type == "topic":
            search_paths.extend(self.indexes_dir.glob("topics/*.json"))
        if node_type is None or node_type == "stock":
            search_paths.extend(self.indexes_dir.glob("stocks/*.json"))
        if node_type is None or node_type == "date":
            search_paths.extend(self.indexes_dir.glob("dates/*.json"))
        
        for file_path in search_paths:
            if not file_path.exists():
                continue
            
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    node = json.load(f)
                    
                # Simple text matching for now (can be enhanced with embeddings later)
                relevance_score = self._calculate_relevance(node, query_lower)
                if relevance_score > 0:
                    results.append({
                        "node_id": node.get("node_id"),
                        "node_type": node.get("node_type"),
                        "relevance_score": relevance_score,
                        "summary": node.get("summary", ""),
                        "node": node
                    })
            except (json.JSONDecodeError, IOError) as e:
                logger.warning(f"Error reading index file {file_path}: {e}")
                continue
        
        # Sort by relevance and return top results
        results.sort(key=lambda x: x["relevance_score"], reverse=True)
        return results[:max_results]
    
    def _calculate_relevance(self, node: Dict[str, Any], query: str) -> float:
        """Calculate relevance score for a node against a query."""
        score = 0.0
        text_fields = [
            node.get("summary", ""),
            node.get("topic_name", ""),
            node.get("ticker", ""),
            node.get("company_name", ""),
        ]
        
        combined_text = " ".join(str(f) for f in text_fields).lower()
        query_words = query.split()
        
        for word in query_words:
            if word in combined_text:
                score += 1.0
        
        # Normalize by query length
        return score / max(len(query_words), 1)
    
    def update_index(self, node_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Update an existing index node.
        
        Args:
            node_id: Node identifier
            updates: Partial node data to update
            
        Returns:
            Updated index node or None if update failed
        """
        node = self.read_index(node_id=node_id)
        if not node:
            logger.warning(f"Cannot update non-existent node: {node_id}")
            return None
        
        # Merge updates
        node.update(updates)
        node["last_updated"] = datetime.now().isoformat()
        
        # Determine file path
        if node_id == "root":
            file_path = self.indexes_dir / "root.json"
        elif node_id.endswith("_stock_index"):
            ticker = node_id.replace("_stock_index", "")
            file_path = self.indexes_dir / "stocks" / f"{ticker}.json"
        elif node_id.startswith("topic_"):
            topic_name = node_id.replace("topic_", "")
            file_path = self.indexes_dir / "topics" / f"{topic_name}.json"
        elif node_id.startswith("date_"):
            date_str = node_id.replace("date_", "").replace("-", "_")
            file_path = self.indexes_dir / "dates" / f"{date_str}.json"
        else:
            logger.error(f"Unknown node_id format: {node_id}")
            return None
        
        # Atomic write
        try:
            with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8', dir=file_path.parent, delete=False) as f:
                json.dump(node, f, indent=2, ensure_ascii=False)
                temp_path = Path(f.name)
            
            shutil.move(str(temp_path), str(file_path))
            logger.info(f"Updated index node: {node_id}")
            return node
        except (IOError, json.JSONEncodeError) as e:
            logger.error(f"Error updating index node {node_id}: {e}")
            if temp_path.exists():
                temp_path.unlink()
            return None
    
    def create_index_node(self, node_type: str, node_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Create a new index node.
        
        Args:
            node_type: Type of node (root, topic, stock, date, cross_ref)
            node_data: Node data dictionary
            
        Returns:
            Created node with generated node_id or None if creation failed
        """
        # Generate node_id if not provided
        if "node_id" not in node_data:
            if node_type == "stock":
                ticker = node_data.get("ticker", "").upper()
                node_data["node_id"] = f"{ticker}_stock_index"
            elif node_type == "topic":
                topic_name = node_data.get("topic_name", "").lower().replace(" ", "_")
                node_data["node_id"] = f"topic_{topic_name}"
            elif node_type == "date":
                date_str = node_data.get("date_range", "").replace("-", "_")
                node_data["node_id"] = f"date_{date_str}"
            else:
                node_data["node_id"] = f"{node_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        node_data["node_type"] = node_type
        node_data["last_updated"] = datetime.now().isoformat()
        
        # Determine file path
        node_id = node_data["node_id"]
        if node_type == "root":
            file_path = self.indexes_dir / "root.json"
        elif node_type == "stock":
            ticker = node_data.get("ticker", "").upper()
            file_path = self.indexes_dir / "stocks" / f"{ticker}.json"
        elif node_type == "topic":
            topic_name = node_data.get("topic_name", "").lower().replace(" ", "_")
            file_path = self.indexes_dir / "topics" / f"{topic_name}.json"
        elif node_type == "date":
            date_str = node_data.get("date_range", "").replace("-", "_")
            file_path = self.indexes_dir / "dates" / f"{date_str}.json"
        else:
            logger.error(f"Unknown node_type: {node_type}")
            return None
        
        # Atomic write
        try:
            with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8', dir=file_path.parent, delete=False) as f:
                json.dump(node_data, f, indent=2, ensure_ascii=False)
                temp_path = Path(f.name)
            
            shutil.move(str(temp_path), str(file_path))
            logger.info(f"Created index node: {node_id}")
            return node_data
        except (IOError, json.JSONEncodeError) as e:
            logger.error(f"Error creating index node {node_id}: {e}")
            if temp_path.exists():
                temp_path.unlink()
            return None

