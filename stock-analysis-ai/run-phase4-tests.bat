@echo off
REM Phase 4 Test Runner for Windows
REM Run all Phase 4 tests for external knowledge integration

echo === Phase 4 Test Suite: External Knowledge Integration ===
echo.

REM Set TEST_MODE to allow services to initialize without API keys
set TEST_MODE=true

REM Run tests
echo Running Phase 4 tests...
echo.

echo 1. Perplexity Service Tests
pytest tests\test_external_knowledge.py -v --tb=short

echo.
echo 2. KB Curator Service Tests
pytest tests\test_kb_curator.py -v --tb=short

echo.
echo 3. RAG Orchestrator External KB Tests
pytest tests\test_rag_orchestrator_external.py -v --tb=short

echo.
echo 4. Chat API External KB Tests
pytest tests\test_chat_api_external.py -v --tb=short

echo.
echo === All Phase 4 Tests Complete ===

REM Optional: Run with coverage
if "%1"=="--coverage" (
    echo.
    echo Running with coverage...
    pytest tests\test_external_knowledge.py tests\test_kb_curator.py tests\test_rag_orchestrator_external.py tests\test_chat_api_external.py --cov=app.services.external_knowledge --cov=app.services.kb_curator --cov=app.services.rag_orchestrator --cov-report=term-missing -v
)

pause
