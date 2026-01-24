"""Metrics API endpoints"""
from fastapi import APIRouter
from fastapi.responses import Response
from app.services.metrics_service import get_metrics_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("")
async def get_metrics():
    """
    Get metrics in Prometheus format
    
    Returns:
        Prometheus-formatted metrics text
    """
    try:
        metrics_service = get_metrics_service()
        prometheus_text = metrics_service.get_metrics_prometheus()
        return Response(
            content=prometheus_text,
            media_type="text/plain; version=0.0.4"
        )
    except Exception as e:
        logger.error(f"Error getting metrics: {e}", exc_info=True)
        return Response(
            content="# Error retrieving metrics\n",
            media_type="text/plain",
            status_code=500
        )

@router.get("/summary")
async def get_metrics_summary():
    """
    Get metrics summary in JSON format
    
    Returns:
        JSON object with metrics summary
    """
    try:
        metrics_service = get_metrics_service()
        summary = metrics_service.get_metrics_summary()
        return summary
    except Exception as e:
        logger.error(f"Error getting metrics summary: {e}", exc_info=True)
        return {
            "error": str(e),
            "enabled": False
        }

@router.get("/health")
async def get_metrics_health():
    """
    Get enhanced health check with metrics
    
    Returns:
        Health status with metrics summary
    """
    from app.api.health import health_check
    from app.services.metrics_service import get_metrics_service
    
    try:
        # Get basic health status
        health_status = await health_check()
        
        # Get metrics summary
        metrics_service = get_metrics_service()
        metrics_summary = metrics_service.get_metrics_summary()
        
        # Add metrics to health response
        health_dict = health_status.dict()
        health_dict["metrics"] = metrics_summary
        
        return health_dict
    except Exception as e:
        logger.error(f"Error getting metrics health: {e}", exc_info=True)
        return {
            "status": "error",
            "error": str(e)
        }
