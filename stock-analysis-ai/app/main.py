from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
from datetime import datetime
import os

from app.config import settings
from app.utils.logger import setup_logging
from app.db.metadata_store import init_db
from app.db.vector_store import init_vector_store
from app.api import chat, kb_management, health, metrics
from app.middleware.metrics_middleware import MetricsMiddleware

# Setup logging first
logger = setup_logging()

# ===== Lifespan Events =====

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown"""
    
    # Startup
    logger.info("=== Starting Agentic KB System ===")
    logger.info(f"Environment: {settings.env}")
    logger.info(f"Debug: {settings.debug}")
    logger.info(f"Vector Store: {settings.vector_store_type}")
    logger.info(f"LLM Provider: {settings.llm_provider.value}")
    logger.info(f"LLM Model: {settings.llm_model}")
    logger.info(f"OpenRouter Base URL: {settings.openrouter_base_url}")
    logger.info(f"OpenRouter API Key: {'SET' if settings.openrouter_api_key else 'NOT SET'}")
    
    # Create data directory if it doesn't exist
    data_dir = "./data"
    try:
        os.makedirs(data_dir, exist_ok=True)
        # On Windows, ensure directory is writable
        if os.name == 'nt':  # Windows
            test_file = os.path.join(data_dir, '.write_test')
            try:
                with open(test_file, 'w') as f:
                    f.write('test')
                os.remove(test_file)
            except (IOError, OSError) as e:
                logger.warning(f"Cannot write to {data_dir}: {e}")
    except (OSError, PermissionError) as e:
        logger.warning(f"Failed to create data directory {data_dir}: {e}")
    
    try:
        init_db()
        logger.info("Database initialized")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise
    
    try:
        await init_vector_store()
        logger.info("Vector store initialized")
    except Exception as e:
        logger.error(f"Vector store initialization failed: {e}")
        # Don't raise - allow app to start even if vector store fails
        logger.warning("Continuing without vector store - some features may be unavailable")
        logger.warning("Chat queries will only use external knowledge base (Perplexity)")
    
    yield
    
    # Shutdown
    logger.info("=== Shutting down Agentic KB System ===")

# ===== Create App =====

app = FastAPI(
    title="Agentic AI Knowledge Base System",
    description="AI-powered chat with internal KB and Perplexity integration",
    version="1.0.0",
    lifespan=lifespan
)

# ===== CORS Middleware =====

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== Global Exception Handler =====

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "timestamp": datetime.utcnow().isoformat()
        }
    )

# ===== Routes =====

app.include_router(health.router, prefix="/api/v1/health", tags=["health"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["chat"])
app.include_router(kb_management.router, prefix="/api/v1/kb", tags=["knowledge-base"])
app.include_router(metrics.router, prefix="/api/v1/metrics", tags=["metrics"])

# ===== Root Endpoint =====

@app.get("/")
async def root():
    return {
        "name": "Agentic AI Knowledge Base System",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.api_host,
        port=settings.api_port,
        workers=settings.api_workers,
        reload=settings.debug
    )

