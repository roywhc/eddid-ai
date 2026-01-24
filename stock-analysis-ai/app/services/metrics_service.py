"""
Metrics Service - Collect and expose system metrics
"""
import logging
import time
from typing import Dict, Any, Optional, List
from collections import defaultdict
from threading import Lock
from app.config import settings

logger = logging.getLogger(__name__)


class MetricsService:
    """Service for collecting and exposing system metrics"""
    
    def __init__(self):
        """Initialize metrics service"""
        self.enabled = getattr(settings, 'metrics_enabled', True)
        self._lock = Lock()
        
        # Counters: metric_name -> value
        self._counters: Dict[str, float] = defaultdict(float)
        
        # Histograms: metric_name -> list of values
        self._histograms: Dict[str, List[float]] = defaultdict(list)
        
        # Gauges: metric_name -> value
        self._gauges: Dict[str, float] = {}
        
        # Labels: metric_name -> dict of label combinations -> value
        self._labeled_counters: Dict[str, Dict[tuple, float]] = defaultdict(lambda: defaultdict(float))
        self._labeled_histograms: Dict[str, Dict[tuple, List[float]]] = defaultdict(lambda: defaultdict(list))
        self._labeled_gauges: Dict[str, Dict[tuple, float]] = defaultdict(dict)
        
        logger.info(f"MetricsService initialized (enabled: {self.enabled})")
    
    def increment_counter(self, name: str, value: float = 1.0, labels: Optional[Dict[str, str]] = None):
        """
        Increment a counter metric
        
        Args:
            name: Metric name
            value: Value to increment by (default: 1.0)
            labels: Optional labels for the metric
        """
        if not self.enabled:
            return
        
        with self._lock:
            if labels:
                label_tuple = tuple(sorted(labels.items()))
                self._labeled_counters[name][label_tuple] += value
            else:
                self._counters[name] += value
    
    def record_histogram(self, name: str, value: float, labels: Optional[Dict[str, str]] = None):
        """
        Record a histogram value
        
        Args:
            name: Metric name
            value: Value to record
            labels: Optional labels for the metric
        """
        if not self.enabled:
            return
        
        with self._lock:
            if labels:
                label_tuple = tuple(sorted(labels.items()))
                self._labeled_histograms[name][label_tuple].append(value)
                # Keep only last 1000 values per label combination
                if len(self._labeled_histograms[name][label_tuple]) > 1000:
                    self._labeled_histograms[name][label_tuple] = self._labeled_histograms[name][label_tuple][-1000:]
            else:
                self._histograms[name].append(value)
                # Keep only last 1000 values
                if len(self._histograms[name]) > 1000:
                    self._histograms[name] = self._histograms[name][-1000:]
    
    def set_gauge(self, name: str, value: float, labels: Optional[Dict[str, str]] = None):
        """
        Set a gauge value
        
        Args:
            name: Metric name
            value: Gauge value
            labels: Optional labels for the metric
        """
        if not self.enabled:
            return
        
        with self._lock:
            if labels:
                label_tuple = tuple(sorted(labels.items()))
                self._labeled_gauges[name][label_tuple] = value
            else:
                self._gauges[name] = value
    
    def _calculate_histogram_stats(self, values: List[float]) -> Dict[str, float]:
        """Calculate histogram statistics"""
        if not values:
            return {
                "count": 0,
                "sum": 0.0,
                "min": 0.0,
                "max": 0.0,
                "avg": 0.0,
                "p50": 0.0,
                "p95": 0.0,
                "p99": 0.0
            }
        
        sorted_values = sorted(values)
        count = len(sorted_values)
        total = sum(sorted_values)
        
        return {
            "count": count,
            "sum": total,
            "min": sorted_values[0],
            "max": sorted_values[-1],
            "avg": total / count if count > 0 else 0.0,
            "p50": sorted_values[int(count * 0.50)] if count > 0 else 0.0,
            "p95": sorted_values[int(count * 0.95)] if count > 0 else 0.0,
            "p99": sorted_values[int(count * 0.99)] if count > 0 else 0.0
        }
    
    def get_metrics_prometheus(self) -> str:
        """
        Get metrics in Prometheus format
        
        Returns:
            Prometheus-formatted metrics string
        """
        if not self.enabled:
            return "# Metrics disabled\n"
        
        lines = []
        
        with self._lock:
            # Counters without labels
            for name, value in sorted(self._counters.items()):
                lines.append(f"{name} {value}")
            
            # Counters with labels
            for name, label_dict in sorted(self._labeled_counters.items()):
                for label_tuple, value in sorted(label_dict.items()):
                    label_str = ",".join([f'{k}="{v}"' for k, v in label_tuple])
                    lines.append(f"{name}{{{label_str}}} {value}")
            
            # Histograms without labels
            for name, values in sorted(self._histograms.items()):
                if values:
                    stats = self._calculate_histogram_stats(values)
                    lines.append(f"{name}_count {stats['count']}")
                    lines.append(f"{name}_sum {stats['sum']}")
                    lines.append(f"{name}_avg {stats['avg']}")
                    lines.append(f"{name}_min {stats['min']}")
                    lines.append(f"{name}_max {stats['max']}")
                    lines.append(f"{name}_p50 {stats['p50']}")
                    lines.append(f"{name}_p95 {stats['p95']}")
                    lines.append(f"{name}_p99 {stats['p99']}")
            
            # Histograms with labels
            for name, label_dict in sorted(self._labeled_histograms.items()):
                for label_tuple, values in sorted(label_dict.items()):
                    if values:
                        label_str = ",".join([f'{k}="{v}"' for k, v in label_tuple])
                        stats = self._calculate_histogram_stats(values)
                        lines.append(f"{name}_count{{{label_str}}} {stats['count']}")
                        lines.append(f"{name}_sum{{{label_str}}} {stats['sum']}")
                        lines.append(f"{name}_avg{{{label_str}}} {stats['avg']}")
                        lines.append(f"{name}_p95{{{label_str}}} {stats['p95']}")
                        lines.append(f"{name}_p99{{{label_str}}} {stats['p99']}")
            
            # Gauges without labels
            for name, value in sorted(self._gauges.items()):
                lines.append(f"{name} {value}")
            
            # Gauges with labels
            for name, label_dict in sorted(self._labeled_gauges.items()):
                for label_tuple, value in sorted(label_dict.items()):
                    label_str = ",".join([f'{k}="{v}"' for k, v in label_tuple])
                    lines.append(f"{name}{{{label_str}}} {value}")
        
        return "\n".join(lines) + "\n"
    
    def get_metrics_summary(self) -> Dict[str, Any]:
        """
        Get metrics summary in JSON format
        
        Returns:
            Dictionary with metrics summary
        """
        if not self.enabled:
            return {"enabled": False}
        
        summary = {
            "enabled": True,
            "counters": {},
            "histograms": {},
            "gauges": {}
        }
        
        with self._lock:
            # Counters
            for name, value in sorted(self._counters.items()):
                summary["counters"][name] = value
            
            for name, label_dict in sorted(self._labeled_counters.items()):
                summary["counters"][name] = {
                    str(dict(label_tuple)): value
                    for label_tuple, value in sorted(label_dict.items())
                }
            
            # Histograms
            for name, values in sorted(self._histograms.items()):
                if values:
                    summary["histograms"][name] = self._calculate_histogram_stats(values)
            
            for name, label_dict in sorted(self._labeled_histograms.items()):
                summary["histograms"][name] = {
                    str(dict(label_tuple)): self._calculate_histogram_stats(values)
                    for label_tuple, values in sorted(label_dict.items())
                    if values
                }
            
            # Gauges
            for name, value in sorted(self._gauges.items()):
                summary["gauges"][name] = value
            
            for name, label_dict in sorted(self._labeled_gauges.items()):
                summary["gauges"][name] = {
                    str(dict(label_tuple)): value
                    for label_tuple, value in sorted(label_dict.items())
                }
        
        return summary
    
    def reset_metrics(self):
        """Reset all metrics (useful for testing)"""
        with self._lock:
            self._counters.clear()
            self._histograms.clear()
            self._gauges.clear()
            self._labeled_counters.clear()
            self._labeled_histograms.clear()
            self._labeled_gauges.clear()
        logger.info("Metrics reset")


# Global instance
_metrics_service: Optional[MetricsService] = None

def get_metrics_service() -> MetricsService:
    """Get or create metrics service instance"""
    global _metrics_service
    if _metrics_service is None:
        _metrics_service = MetricsService()
    return _metrics_service
