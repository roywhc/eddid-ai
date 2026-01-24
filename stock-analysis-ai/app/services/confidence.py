"""Confidence scoring service for retrieval results"""
import logging
from typing import List
from app.models import RetrievalResult
from app.config import settings

logger = logging.getLogger(__name__)


class ConfidenceService:
    """Service for calculating confidence scores from retrieval results"""
    
    def __init__(self):
        """Initialize confidence service"""
        self.threshold = settings.kb_confidence_threshold
        logger.info(f"ConfidenceService initialized with threshold: {self.threshold}")
    
    def calculate_confidence(
        self,
        results: List[RetrievalResult],
        query: str
    ) -> float:
        """
        Calculate confidence score based on retrieval results
        
        Algorithm:
        - Base score from top result relevance
        - Adjust based on number of results (more results = higher confidence if scores are good)
        - Consider score distribution (tight distribution = higher confidence)
        - Return score between 0.0 and 1.0
        
        Args:
            results: List of retrieval results with scores
            query: Original query (for potential future use)
        
        Returns:
            Confidence score between 0.0 and 1.0
        """
        if not results or len(results) == 0:
            logger.debug("No results provided, returning confidence 0.0")
            return 0.0
        
        # Base confidence from top result score
        top_score = results[0].score
        base_confidence = float(top_score)
        
        # Adjust based on number of results
        # More results with good scores increases confidence
        num_results = len(results)
        if num_results >= 3:
            # Multiple good results increases confidence
            avg_score = sum(r.score for r in results[:3]) / min(3, num_results)
            if avg_score > 0.7:
                base_confidence = min(1.0, base_confidence + 0.1)
        elif num_results == 1:
            # Single result is less confident
            base_confidence = base_confidence * 0.9
        
        # Consider score distribution
        # Tight distribution (similar scores) = higher confidence
        if num_results >= 2:
            scores = [r.score for r in results[:5]]  # Top 5 scores
            score_range = max(scores) - min(scores)
            if score_range < 0.2:  # Tight distribution
                base_confidence = min(1.0, base_confidence + 0.05)
            elif score_range > 0.5:  # Wide distribution
                base_confidence = base_confidence * 0.95
        
        # Ensure score is in valid range
        confidence = max(0.0, min(1.0, base_confidence))
        
        logger.debug(
            f"Calculated confidence: {confidence:.2f} "
            f"(top_score: {top_score:.2f}, num_results: {num_results})"
        )
        
        return confidence
    
    def is_above_threshold(self, confidence: float) -> bool:
        """
        Check if confidence is above threshold
        
        Args:
            confidence: Confidence score to check
        
        Returns:
            True if confidence >= threshold, False otherwise
        """
        return confidence >= self.threshold
