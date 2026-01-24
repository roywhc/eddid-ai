"""
Metrics Middleware - Automatically collect HTTP request/response metrics
"""
import time
import logging
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from app.services.metrics_service import get_metrics_service

logger = logging.getLogger(__name__)


class MetricsMiddleware(BaseHTTPMiddleware):
    """Middleware to automatically collect HTTP metrics"""
    
    def __init__(self, app):
        super().__init__(app)
        self.metrics = get_metrics_service()
    
    async def dispatch(self, request: Request, call_next):
        """Process request and collect metrics"""
        if not self.metrics.enabled:
            return await call_next(request)
        
        # Start timing
        start_time = time.time()
        
        # Get request size (approximate from headers if available)
        request_size = 0
        if hasattr(request, 'headers'):
            content_length = request.headers.get('content-length')
            if content_length:
                try:
                    request_size = int(content_length)
                except (ValueError, TypeError):
                    pass
        
        # Process request
        try:
            response = await call_next(request)
            
            # Calculate duration
            duration = time.time() - start_time
            
            # Get response size (approximate from headers if available)
            response_size = 0
            if hasattr(response, 'headers'):
                content_length = response.headers.get('content-length')
                if content_length:
                    try:
                        response_size = int(content_length)
                    except (ValueError, TypeError):
                        pass
            
            # Record metrics
            status_code = response.status_code
            endpoint = request.url.path
            
            # Increment request counter
            self.metrics.increment_counter(
                "http_requests_total",
                labels={
                    "method": request.method,
                    "endpoint": endpoint,
                    "status_code": str(status_code)
                }
            )
            
            # Record duration
            self.metrics.record_histogram(
                "http_request_duration_seconds",
                duration,
                labels={
                    "method": request.method,
                    "endpoint": endpoint,
                    "status_code": str(status_code)
                }
            )
            
            # Record request size
            if request_size > 0:
                self.metrics.record_histogram(
                    "http_request_size_bytes",
                    request_size,
                    labels={"method": request.method, "endpoint": endpoint}
                )
            
            # Record response size
            if response_size > 0:
                self.metrics.record_histogram(
                    "http_response_size_bytes",
                    response_size,
                    labels={"method": request.method, "endpoint": endpoint, "status_code": str(status_code)}
                )
            
            # Record error if status >= 400
            if status_code >= 400:
                self.metrics.increment_counter(
                    "http_errors_total",
                    labels={
                        "method": request.method,
                        "endpoint": endpoint,
                        "status_code": str(status_code)
                    }
                )
            
            return response
        
        except Exception as e:
            # Calculate duration even on error
            duration = time.time() - start_time
            
            # Record error
            self.metrics.increment_counter(
                "http_errors_total",
                labels={
                    "method": request.method,
                    "endpoint": request.url.path,
                    "error_type": type(e).__name__
                }
            )
            
            # Record duration
            self.metrics.record_histogram(
                "http_request_duration_seconds",
                duration,
                labels={
                    "method": request.method,
                    "endpoint": request.url.path,
                    "status_code": "500"
                }
            )
            
            raise
