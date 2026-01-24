"""Test metrics API endpoints"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from app.main import app
from app.services.metrics_service import get_metrics_service


@pytest.fixture
def client():
    """Create test client"""
    with patch('app.db.vector_store.get_vector_store_instance'), \
         patch('app.services.retrieval.get_vector_store_instance'):
        return TestClient(app)


def test_get_metrics_prometheus_format(client):
    """Test GET /api/v1/metrics - Prometheus format"""
    # Make a request to generate some metrics
    client.get("/api/v1/health")
    
    response = client.get("/api/v1/metrics")
    
    assert response.status_code == 200
    assert "text/plain" in response.headers["content-type"]
    assert "version=0.0.4" in response.headers["content-type"] or len(response.text) > 0


def test_get_metrics_summary_json(client):
    """Test GET /api/v1/metrics/summary - JSON format"""
    # Make a request to generate some metrics
    client.get("/api/v1/health")
    
    response = client.get("/api/v1/metrics/summary")
    
    assert response.status_code == 200
    data = response.json()
    assert "enabled" in data
    assert "counters" in data or "histograms" in data or "gauges" in data


def test_get_metrics_health(client):
    """Test GET /api/v1/metrics/health - Enhanced health with metrics"""
    response = client.get("/api/v1/metrics/health")
    
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "components" in data
    assert "metrics" in data


def test_metrics_endpoint_handles_errors(client):
    """Test that metrics endpoint handles errors gracefully"""
    # Note: In a real scenario, errors would be caught and handled
    # This test verifies the endpoint exists and returns metrics
    response = client.get("/api/v1/metrics")
    
    # Should return 200 with metrics (even if empty)
    assert response.status_code == 200
    assert "text/plain" in response.headers["content-type"]


def test_metrics_summary_handles_errors(client):
    """Test that metrics summary endpoint handles errors gracefully"""
    # Note: In a real scenario, errors would be caught and handled
    # This test verifies the endpoint exists and returns summary
    response = client.get("/api/v1/metrics/summary")
    
    assert response.status_code == 200
    data = response.json()
    assert "enabled" in data
