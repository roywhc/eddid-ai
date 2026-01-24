#!/bin/bash
# Phase 4 Test Runner
# Run all Phase 4 tests for external knowledge integration

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Phase 4 Test Suite: External Knowledge Integration ===${NC}"
echo ""

# Set TEST_MODE to allow services to initialize without API keys
export TEST_MODE=true

# Run tests
echo -e "${BLUE}Running Phase 4 tests...${NC}"
echo ""

# Unit tests
echo -e "${YELLOW}1. Perplexity Service Tests${NC}"
pytest tests/test_external_knowledge.py -v --tb=short

echo ""
echo -e "${YELLOW}2. KB Curator Service Tests${NC}"
pytest tests/test_kb_curator.py -v --tb=short

echo ""
echo -e "${YELLOW}3. RAG Orchestrator External KB Tests${NC}"
pytest tests/test_rag_orchestrator_external.py -v --tb=short

echo ""
echo -e "${YELLOW}4. Chat API External KB Tests${NC}"
pytest tests/test_chat_api_external.py -v --tb=short

echo ""
echo -e "${GREEN}=== All Phase 4 Tests Complete ===${NC}"

# Optional: Run with coverage
if [ "$1" == "--coverage" ]; then
    echo ""
    echo -e "${BLUE}Running with coverage...${NC}"
    pytest tests/test_external_knowledge.py \
           tests/test_kb_curator.py \
           tests/test_rag_orchestrator_external.py \
           tests/test_chat_api_external.py \
           --cov=app.services.external_knowledge \
           --cov=app.services.kb_curator \
           --cov=app.services.rag_orchestrator \
           --cov-report=term-missing \
           -v
fi
