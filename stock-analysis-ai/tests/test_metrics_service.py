"""Test metrics service"""
import pytest
from app.services.metrics_service import MetricsService, get_metrics_service


@pytest.fixture
def metrics_service():
    """Create MetricsService instance"""
    service = MetricsService()
    service.reset_metrics()  # Start fresh
    yield service
    service.reset_metrics()


def test_increment_counter(metrics_service):
    """Test counter increment"""
    metrics_service.increment_counter("test_counter")
    metrics_service.increment_counter("test_counter", value=2.0)
    
    prometheus_output = metrics_service.get_metrics_prometheus()
    assert "test_counter 3.0" in prometheus_output


def test_increment_counter_with_labels(metrics_service):
    """Test counter increment with labels"""
    metrics_service.increment_counter("test_counter", labels={"method": "GET", "endpoint": "/api/test"})
    metrics_service.increment_counter("test_counter", labels={"method": "POST", "endpoint": "/api/test"})
    
    prometheus_output = metrics_service.get_metrics_prometheus()
    assert 'test_counter{endpoint="/api/test",method="GET"}' in prometheus_output
    assert 'test_counter{endpoint="/api/test",method="POST"}' in prometheus_output


def test_record_histogram(metrics_service):
    """Test histogram recording"""
    metrics_service.record_histogram("test_histogram", 1.5)
    metrics_service.record_histogram("test_histogram", 2.0)
    metrics_service.record_histogram("test_histogram", 2.5)
    
    summary = metrics_service.get_metrics_summary()
    assert "test_histogram" in summary["histograms"]
    stats = summary["histograms"]["test_histogram"]
    assert stats["count"] == 3
    assert stats["min"] == 1.5
    assert stats["max"] == 2.5
    assert stats["avg"] == 2.0


def test_record_histogram_with_labels(metrics_service):
    """Test histogram recording with labels"""
    metrics_service.record_histogram("test_histogram", 1.0, labels={"type": "A"})
    metrics_service.record_histogram("test_histogram", 2.0, labels={"type": "B"})
    
    summary = metrics_service.get_metrics_summary()
    assert "test_histogram" in summary["histograms"]
    histogram_data = summary["histograms"]["test_histogram"]
    assert isinstance(histogram_data, dict)  # Should have labels


def test_set_gauge(metrics_service):
    """Test gauge setting"""
    metrics_service.set_gauge("test_gauge", 42.0)
    metrics_service.set_gauge("test_gauge", 50.0)
    
    prometheus_output = metrics_service.get_metrics_prometheus()
    assert "test_gauge 50.0" in prometheus_output  # Should be last value


def test_set_gauge_with_labels(metrics_service):
    """Test gauge setting with labels"""
    metrics_service.set_gauge("test_gauge", 10.0, labels={"server": "server1"})
    metrics_service.set_gauge("test_gauge", 20.0, labels={"server": "server2"})
    
    prometheus_output = metrics_service.get_metrics_prometheus()
    assert 'test_gauge{server="server1"} 10.0' in prometheus_output
    assert 'test_gauge{server="server2"} 20.0' in prometheus_output


def test_get_metrics_prometheus_format(metrics_service):
    """Test Prometheus format output"""
    metrics_service.increment_counter("counter_test")
    metrics_service.record_histogram("histogram_test", 1.0)
    metrics_service.set_gauge("gauge_test", 5.0)
    
    output = metrics_service.get_metrics_prometheus()
    
    assert "counter_test" in output
    assert "histogram_test_count" in output
    assert "histogram_test_sum" in output
    assert "histogram_test_avg" in output
    assert "gauge_test" in output


def test_get_metrics_summary(metrics_service):
    """Test JSON summary output"""
    metrics_service.increment_counter("counter_test")
    metrics_service.record_histogram("histogram_test", 1.0)
    metrics_service.set_gauge("gauge_test", 5.0)
    
    summary = metrics_service.get_metrics_summary()
    
    assert summary["enabled"] is True
    assert "counter_test" in summary["counters"]
    assert "histogram_test" in summary["histograms"]
    assert "gauge_test" in summary["gauges"]


def test_histogram_statistics(metrics_service):
    """Test histogram statistics calculation"""
    # Add values that will give known percentiles
    values = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0]
    for v in values:
        metrics_service.record_histogram("test_hist", v)
    
    summary = metrics_service.get_metrics_summary()
    stats = summary["histograms"]["test_hist"]
    
    assert stats["count"] == 10
    assert stats["min"] == 1.0
    assert stats["max"] == 10.0
    assert stats["avg"] == 5.5
    # p50 uses int(count * 0.50) which for 10 values gives index 5 (6th element = 6.0)
    assert stats["p50"] == 6.0  # Using current implementation logic
    # p95 uses int(count * 0.95) which for 10 values gives index 9 (10th element = 10.0)
    assert stats["p95"] == 10.0  # 95th percentile
    # p99 uses int(count * 0.99) which for 10 values gives index 9 (10th element = 10.0)
    assert stats["p99"] == 10.0  # 99th percentile


def test_reset_metrics(metrics_service):
    """Test metrics reset"""
    metrics_service.increment_counter("test_counter")
    metrics_service.record_histogram("test_hist", 1.0)
    metrics_service.set_gauge("test_gauge", 5.0)
    
    metrics_service.reset_metrics()
    
    summary = metrics_service.get_metrics_summary()
    assert len(summary["counters"]) == 0
    assert len(summary["histograms"]) == 0
    assert len(summary["gauges"]) == 0


def test_metrics_disabled(metrics_service):
    """Test that metrics are not collected when disabled"""
    metrics_service.enabled = False
    
    metrics_service.increment_counter("test_counter")
    metrics_service.record_histogram("test_hist", 1.0)
    metrics_service.set_gauge("test_gauge", 5.0)
    
    summary = metrics_service.get_metrics_summary()
    assert summary["enabled"] is False
    assert len(summary.get("counters", {})) == 0


def test_get_metrics_service_singleton():
    """Test that get_metrics_service returns singleton"""
    service1 = get_metrics_service()
    service2 = get_metrics_service()
    
    assert service1 is service2


def test_histogram_value_limiting(metrics_service):
    """Test that histogram values are limited to prevent unbounded growth"""
    # Add more than 1000 values
    for i in range(1500):
        metrics_service.record_histogram("test_hist", float(i))
    
    # Should only keep last 1000
    summary = metrics_service.get_metrics_summary()
    stats = summary["histograms"]["test_hist"]
    assert stats["count"] == 1000
    assert stats["min"] >= 500  # Should have recent values


def test_multiple_label_combinations(metrics_service):
    """Test metrics with multiple label combinations"""
    metrics_service.increment_counter("requests", labels={"method": "GET", "status": "200"})
    metrics_service.increment_counter("requests", labels={"method": "GET", "status": "404"})
    metrics_service.increment_counter("requests", labels={"method": "POST", "status": "200"})
    
    summary = metrics_service.get_metrics_summary()
    requests = summary["counters"]["requests"]
    
    # Should have 3 different label combinations
    assert isinstance(requests, dict)
    assert len(requests) == 3
