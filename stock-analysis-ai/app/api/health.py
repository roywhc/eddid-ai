from fastapi import APIRouter
from datetime import datetime
from app.models import HealthStatus

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
    try:
        from app.db.metadata_store import SessionLocal
        from sqlalchemy import text
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        components["metadata_db"] = "healthy"
    except Exception as e:
        components["metadata_db"] = f"error: {str(e)}"
    
    status = "healthy"
    if any("error" in str(v) for v in components.values()):
        status = "degraded"
    
    return HealthStatus(
        status=status,
        timestamp=datetime.utcnow(),
        components=components,
        version="1.0.0"
    )

