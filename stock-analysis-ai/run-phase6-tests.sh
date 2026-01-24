#!/bin/bash
# Phase 6 Test Runner
# Run all Phase 6 tests for Observability and Monitoring

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Phase 6 Test Suite: Observability and Monitoring ===${NC}"
echo ""

# Set TEST_MODE to allow services to initialize without API keys
export TEST_MODE=true

# Run tests
echo -e "${BLUE}Running Phase 6 tests...${NC}"
echo ""

# Unit tests
echo -e "${YELLOW}1. Metrics Service Tests${NC}"
pytest tests/test_metrics_service.py -v --tb=short

echo ""
echo -e "${YELLOW}2. Metrics Middleware Tests${NC}"
pytest tests/test_metrics_middleware.py -v --tb=short

echo ""
echo -e "${YELLOW}3. Metrics API Tests${NC}"
pytest tests/test_metrics_api.py -v --tb=short

echo ""
echo -e "${GREEN}=== All Phase 6 Tests Complete ===${NC}"

# Optional: Run with coverage
if [ "$1" == "--coverage" ]; then
    echo ""
    echo -e "${BLUE}Running with coverage...${NC}"
    pytest tests/test_metrics_service.py \
           tests/test_metrics_middleware.py \
           tests/test_metrics_api.py \
           --cov=app.services.metrics_service \
           --cov=app.middleware.metrics_middleware \
           --cov=app.api.metrics \
           --cov-report=term-missing \
           -v
fi
