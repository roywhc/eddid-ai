@echo off
REM Phase 5 Test Runner for Windows
REM Run all Phase 5 tests for Knowledge Base Management

set TEST_MODE=true

echo === Phase 5 Test Suite: Knowledge Base Management ===
echo.

echo Running Phase 5 tests...
echo.

echo 1. Document Service Tests
pytest tests/test_document_service.py -v --tb=short

echo.
echo 2. Candidate Review Service Tests
pytest tests/test_candidate_review_service.py -v --tb=short

echo.
echo 3. KB Management API Tests
pytest tests/test_kb_management_api.py -v --tb=short

echo.
echo 4. Document Integration Tests
pytest tests/test_document_integration.py -v --tb=short

echo.
echo === All Phase 5 Tests Complete ===

if "%1"=="--coverage" (
    echo.
    echo Running with coverage...
    pytest tests/test_document_service.py tests/test_candidate_review_service.py tests/test_kb_management_api.py tests/test_document_integration.py --cov=app.services.document_service --cov=app.services.candidate_review_service --cov=app.api.kb_management --cov-report=term-missing -v
)
