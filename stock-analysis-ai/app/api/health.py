from fastapi import APIRouter
from datetime import datetime
import time
from app.models import HealthStatus
from app.services.metrics_service import get_metrics_service

router = APIRouter()

@router.get("/")
async def health_check() -> HealthStatus:
    """Application health check"""
    
    components = {}
    
    # Check vector store
    try:
        from app.db.vector_store import get_vector_store_instance
        vector_store = get_vector_store_instance()
        health = await vector_store.health_check()
        components["vector_db"] = "healthy" if health else "degraded"
    except RuntimeError:
        # Vector store not initialized yet
        components["vector_db"] = "not_initialized"
    except Exception as e:
        components["vector_db"] = f"error: {str(e)}"
    
    # Check metadata DB
    db_start = time.time()
    try:
        from app.db.metadata_store import SessionLocal
        from sqlalchemy import text
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        db_duration = (time.time() - db_start) * 1000
        components["metadata_db"] = "healthy"
        components["metadata_db_response_time_ms"] = f"{db_duration:.2f}"
    except Exception as e:
        components["metadata_db"] = f"error: {str(e)}"
    
    # Check external APIs (if configured)
    try:
        from app.config import settings
        if settings.perplexity_api_key:
            components["perplexity_api"] = "configured"
        else:
            components["perplexity_api"] = "not_configured"
    except Exception:
        components["perplexity_api"] = "unknown"
    
    try:
        from app.config import settings
        if settings.openrouter_api_key:
            components["llm_api"] = "configured"
        else:
            components["llm_api"] = "not_configured"
    except Exception:
        components["llm_api"] = "unknown"
    
    # Get metrics summary
    try:
        metrics_service = get_metrics_service()
        if metrics_service.enabled:
            metrics_summary = metrics_service.get_metrics_summary()
            components["metrics"] = "enabled"
            # Add key metrics to components as strings (HealthStatus expects Dict[str, str])
            if "counters" in metrics_summary:
                rag_total = metrics_summary["counters"].get("rag_queries_total", 0)
                llm_total = metrics_summary["counters"].get("llm_requests_total", 0)
                http_total = metrics_summary["counters"].get("http_requests_total", 0)
                components["metrics_rag_queries"] = str(rag_total)
                components["metrics_llm_requests"] = str(llm_total)
                components["metrics_http_requests"] = str(http_total)
        else:
            components["metrics"] = "disabled"
    except Exception as e:
        components["metrics"] = f"error: {str(e)}"
    
    status = "healthy"
    if any("error" in str(v) for v in components.values()):
        status = "degraded"
    
    return HealthStatus(
        status=status,
        timestamp=datetime.utcnow().isoformat(),
        components=components,
        version="1.0.0"
    )

@router.get("/live")
async def liveness_probe():
    """
    Liveness probe for Kubernetes/Azure Container Apps
    Returns 200 if the application is running
    """
    return {"status": "alive", "timestamp": datetime.utcnow().isoformat()}

@router.get("/ready")
async def readiness_probe():
    """
    Readiness probe for Kubernetes/Azure Container Apps
    Returns 200 if the application is ready to serve traffic
    """
    # Check critical dependencies
    try:
        from app.db.metadata_store import SessionLocal
        from sqlalchemy import text
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        
        # Check vector store
        from app.db.vector_store import get_vector_store_instance
        vector_store = get_vector_store_instance()
        await vector_store.health_check()
        
        return {"status": "ready", "timestamp": datetime.utcnow().isoformat()}
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=503, detail=f"Not ready: {str(e)}")
