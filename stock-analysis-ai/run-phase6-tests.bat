@echo off
REM Phase 6 Test Runner for Windows
REM Run all Phase 6 tests for Observability and Monitoring

set TEST_MODE=true

echo === Phase 6 Test Suite: Observability and Monitoring ===
echo.

echo Running Phase 6 tests...
echo.

echo 1. Metrics Service Tests
pytest tests/test_metrics_service.py -v --tb=short

echo.
echo 2. Metrics Middleware Tests
pytest tests/test_metrics_middleware.py -v --tb=short

echo.
echo 3. Metrics API Tests
pytest tests/test_metrics_api.py -v --tb=short

echo.
echo === All Phase 6 Tests Complete ===

if "%1"=="--coverage" (
    echo.
    echo Running with coverage...
    pytest tests/test_metrics_service.py tests/test_metrics_middleware.py tests/test_metrics_api.py --cov=app.services.metrics_service --cov=app.middleware.metrics_middleware --cov=app.api.metrics --cov-report=term-missing -v
)
