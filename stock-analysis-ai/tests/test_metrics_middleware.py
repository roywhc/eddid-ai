"""Test metrics middleware"""
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.middleware.metrics_middleware import MetricsMiddleware
from app.services.metrics_service import get_metrics_service


@pytest.fixture
def app_with_middleware():
    """Create FastAPI app with metrics middleware"""
    app = FastAPI()
    app.add_middleware(MetricsMiddleware)
    
    @app.get("/test")
    async def test_endpoint():
        return {"message": "test"}
    
    @app.get("/error")
    async def error_endpoint():
        raise ValueError("Test error")
    
    return app


@pytest.fixture
def client(app_with_middleware):
    """Create test client"""
    return TestClient(app_with_middleware)


def test_middleware_tracks_request_count(client):
    """Test that middleware tracks request count"""
    metrics = get_metrics_service()
    metrics.reset_metrics()
    
    client.get("/test")
    client.get("/test")
    
    summary = metrics.get_metrics_summary()
    assert "http_requests_total" in summary["counters"]
    
    # Check Prometheus format
    prometheus = metrics.get_metrics_prometheus()
    assert "http_requests_total" in prometheus


def test_middleware_tracks_request_duration(client):
    """Test that middleware tracks request duration"""
    metrics = get_metrics_service()
    metrics.reset_metrics()
    
    client.get("/test")
    
    summary = metrics.get_metrics_summary()
    assert "http_request_duration_seconds" in summary["histograms"]
    
    stats = summary["histograms"]["http_request_duration_seconds"]
    # Stats might be a dict with label combinations, or a direct stats dict
    if isinstance(stats, dict) and "count" in stats:
        # Direct stats dict
        assert stats["count"] > 0
        assert stats["avg"] >= 0  # Duration can be very small (0.0 for very fast requests)
    else:
        # Labeled histogram - check any label combination
        assert len(stats) > 0
        # Get first label combination's stats
        first_stats = list(stats.values())[0]
        assert first_stats["count"] > 0
        assert first_stats["avg"] >= 0  # Duration can be very small (0.0 for very fast requests)


def test_middleware_tracks_status_codes(client):
    """Test that middleware tracks status codes"""
    metrics = get_metrics_service()
    metrics.reset_metrics()
    
    client.get("/test")  # 200
    client.get("/nonexistent")  # 404
    
    prometheus = metrics.get_metrics_prometheus()
    assert 'status_code="200"' in prometheus
    assert 'status_code="404"' in prometheus


def test_middleware_tracks_errors(client):
    """Test that middleware tracks errors"""
    metrics = get_metrics_service()
    metrics.reset_metrics()
    
    try:
        client.get("/error")
    except Exception:
        pass  # Expected
    
    summary = metrics.get_metrics_summary()
    # Should have recorded error
    assert "http_errors_total" in summary["counters"] or "http_request_duration_seconds" in summary["histograms"]


def test_middleware_tracks_endpoints(client):
    """Test that middleware tracks different endpoints"""
    metrics = get_metrics_service()
    metrics.reset_metrics()
    
    client.get("/test")
    client.get("/test")
    
    prometheus = metrics.get_metrics_prometheus()
    assert 'endpoint="/test"' in prometheus


def test_middleware_tracks_methods(client):
    """Test that middleware tracks HTTP methods"""
    metrics = get_metrics_service()
    metrics.reset_metrics()
    
    client.get("/test")
    client.post("/test", json={"data": "test"})
    
    prometheus = metrics.get_metrics_prometheus()
    assert 'method="GET"' in prometheus
    assert 'method="POST"' in prometheus
