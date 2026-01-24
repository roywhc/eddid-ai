#!/bin/bash
# Phase 5 Test Runner
# Run all Phase 5 tests for Knowledge Base Management

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Phase 5 Test Suite: Knowledge Base Management ===${NC}"
echo ""

# Set TEST_MODE to allow services to initialize without API keys
export TEST_MODE=true

# Run tests
echo -e "${BLUE}Running Phase 5 tests...${NC}"
echo ""

# Unit tests
echo -e "${YELLOW}1. Document Service Tests${NC}"
pytest tests/test_document_service.py -v --tb=short

echo ""
echo -e "${YELLOW}2. Candidate Review Service Tests${NC}"
pytest tests/test_candidate_review_service.py -v --tb=short

echo ""
echo -e "${YELLOW}3. KB Management API Tests${NC}"
pytest tests/test_kb_management_api.py -v --tb=short

echo ""
echo -e "${YELLOW}4. Document Integration Tests${NC}"
pytest tests/test_document_integration.py -v --tb=short

echo ""
echo -e "${GREEN}=== All Phase 5 Tests Complete ===${NC}"

# Optional: Run with coverage
if [ "$1" == "--coverage" ]; then
    echo ""
    echo -e "${BLUE}Running with coverage...${NC}"
    pytest tests/test_document_service.py \
           tests/test_candidate_review_service.py \
           tests/test_kb_management_api.py \
           tests/test_document_integration.py \
           --cov=app.services.document_service \
           --cov=app.services.candidate_review_service \
           --cov=app.api.kb_management \
           --cov-report=term-missing \
           -v
fi
