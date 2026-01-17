#!/bin/bash
# Agentic AI Knowledge Base System - Run Script
# This script starts the FastAPI application

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENV_NAME="agentic-kb"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${GREEN}=== Agentic AI Knowledge Base System ===${NC}"
echo ""

# Check if conda is available
CONDA_AVAILABLE=false
USE_CONDA_RUN=false

# Try to find conda in common locations
find_conda() {
    # Check if conda is in PATH
    if command -v conda &> /dev/null; then
        conda info --base 2>/dev/null || echo ""
        return
    fi
    
    # Try common Windows locations
    local possible_paths=(
        "/c/Users/$USER/Application/miniconda3"
        "/c/Users/$USER/miniconda3"
        "/c/Users/$USER/anaconda3"
        "/c/ProgramData/Anaconda3"
        "$HOME/Application/miniconda3"
        "$HOME/miniconda3"
        "$HOME/anaconda3"
    )
    
    for path in "${possible_paths[@]}"; do
        if [ -d "$path" ] && [ -f "$path/etc/profile.d/conda.sh" ]; then
            echo "$path"
            return
        fi
    done
    
    echo ""
}

CONDA_BASE=$(find_conda)

if [ -n "$CONDA_BASE" ] && [ -d "$CONDA_BASE" ]; then
    CONDA_AVAILABLE=true
    
    # Initialize conda
    if [ -f "${CONDA_BASE}/etc/profile.d/conda.sh" ]; then
        source "${CONDA_BASE}/etc/profile.d/conda.sh" 2>/dev/null
    fi
    
    # Check if environment exists
    if conda env list 2>/dev/null | grep -q "^${ENV_NAME} "; then
        # Try to activate
        if conda activate "${ENV_NAME}" 2>/dev/null; then
            echo -e "${GREEN}✓ Conda environment '${ENV_NAME}' activated${NC}"
        else
            # Use conda run as fallback
            echo -e "${BLUE}Using conda environment '${ENV_NAME}' (via conda run)...${NC}"
            USE_CONDA_RUN=true
        fi
    else
        echo -e "${YELLOW}Warning: Conda environment '${ENV_NAME}' not found${NC}"
        echo -e "${YELLOW}Please run install.sh first or activate your environment manually${NC}"
    fi
elif [ -d "${HOME}/.conda/envs/${ENV_NAME}" ] || [ -d "/c/Users/${USER}/.conda/envs/${ENV_NAME}" ] || [ -d "/c/Users/Wanho/.conda/envs/${ENV_NAME}" ]; then
    # Environment exists but conda not found - try to use it directly
    ENV_PATH="${HOME}/.conda/envs/${ENV_NAME}"
    if [ ! -d "$ENV_PATH" ]; then
        ENV_PATH="/c/Users/${USER}/.conda/envs/${ENV_NAME}"
    fi
    if [ ! -d "$ENV_PATH" ]; then
        ENV_PATH="/c/Users/Wanho/.conda/envs/${ENV_NAME}"
    fi
    
    if [ -d "$ENV_PATH" ] && [ -f "${ENV_PATH}/bin/python" ] || [ -f "${ENV_PATH}/python.exe" ]; then
        echo -e "${BLUE}Found conda environment at: ${ENV_PATH}${NC}"
        echo -e "${YELLOW}Note: Using Python from conda environment directly${NC}"
        export PATH="${ENV_PATH}/bin:${ENV_PATH}/Scripts:${PATH}"
        if [ -f "${ENV_PATH}/python.exe" ]; then
            # Windows
            alias python="${ENV_PATH}/python.exe"
            alias pip="${ENV_PATH}/Scripts/pip.exe"
        else
            # Linux/Mac
            alias python="${ENV_PATH}/bin/python"
            alias pip="${ENV_PATH}/bin/pip"
        fi
    fi
fi

# Check if virtual environment exists
if [ -d "${PROJECT_DIR}/venv" ]; then
    echo -e "${BLUE}Activating virtual environment...${NC}"
    source "${PROJECT_DIR}/venv/bin/activate"
fi

# Check if .env file exists
if [ ! -f "${PROJECT_DIR}/.env" ]; then
    echo -e "${YELLOW}Warning: .env file not found${NC}"
    if [ -f "${PROJECT_DIR}/.env.example" ]; then
        echo -e "${GREEN}Creating .env from .env.example...${NC}"
        cp "${PROJECT_DIR}/.env.example" "${PROJECT_DIR}/.env"
        echo -e "${YELLOW}⚠️  IMPORTANT: Please edit .env file and add your API keys:${NC}"
        echo -e "   - OPENAI_API_KEY"
        echo -e "   - PERPLEXITY_API_KEY"
        echo -e "   - SECRET_KEY"
        echo ""
        echo -e "${YELLOW}After editing .env, run this script again.${NC}"
        exit 1
    else
        echo -e "${RED}Error: .env file not found and .env.example is missing${NC}"
        echo -e "${YELLOW}Please create .env file manually or ensure .env.example exists${NC}"
        exit 1
    fi
fi

# Determine Python executable
PYTHON_CMD="python"
if [ "${USE_CONDA_RUN}" = "true" ] && [ -n "$CONDA_BASE" ]; then
    # Use conda run
    PYTHON_CMD="conda run -n ${ENV_NAME} --no-capture-output python"
elif [ -n "$ENV_PATH" ]; then
    # Use Python directly from environment
    if [ -f "${ENV_PATH}/python.exe" ]; then
        PYTHON_CMD="${ENV_PATH}/python.exe"
    elif [ -f "${ENV_PATH}/bin/python" ]; then
        PYTHON_CMD="${ENV_PATH}/bin/python"
    fi
fi

# Function to run Python commands
run_python() {
    if [ "${USE_CONDA_RUN}" = "true" ] && [ -n "$CONDA_BASE" ]; then
        conda run -n "${ENV_NAME}" --no-capture-output python "$@"
    else
        $PYTHON_CMD "$@"
    fi
}

# Check if database is initialized
if [ ! -f "${PROJECT_DIR}/data/metadata.db" ]; then
    echo -e "${YELLOW}Database not found. Initializing...${NC}"
    run_python -c "from app.db.metadata_store import init_db; init_db()" || {
        echo -e "${RED}Error: Failed to initialize database${NC}"
        exit 1
    }
    echo -e "${GREEN}✓ Database initialized${NC}"
fi

# Load environment variables
export $(grep -v '^#' "${PROJECT_DIR}/.env" | xargs) 2>/dev/null || true

# Get configuration
API_HOST="${API_HOST:-0.0.0.0}"
API_PORT="${API_PORT:-8000}"
DEBUG="${DEBUG:-true}"

echo -e "${GREEN}Starting application...${NC}"
echo -e "${BLUE}Host: ${API_HOST}${NC}"
echo -e "${BLUE}Port: ${API_PORT}${NC}"
echo -e "${BLUE}Debug: ${DEBUG}${NC}"
echo ""
echo -e "${GREEN}API will be available at:${NC}"
echo -e "  ${BLUE}http://localhost:${API_PORT}${NC}"
echo -e "  ${BLUE}http://localhost:${API_PORT}/docs${NC} (Swagger UI)"
echo -e "  ${BLUE}http://localhost:${API_PORT}/api/v1/health${NC} (Health Check)"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
echo ""

# Run the application
cd "${PROJECT_DIR}"

if [ "${USE_CONDA_RUN}" = "true" ] && [ -n "$CONDA_BASE" ]; then
    echo -e "${GREEN}Starting with conda run...${NC}"
    conda run -n "${ENV_NAME}" --no-capture-output uvicorn app.main:app --host "${API_HOST}" --port "${API_PORT}" --reload
elif [ -n "$ENV_PATH" ]; then
    echo -e "${GREEN}Starting with Python from conda environment...${NC}"
    $PYTHON_CMD -m uvicorn app.main:app --host "${API_HOST}" --port "${API_PORT}" --reload
else
    uvicorn app.main:app --host "${API_HOST}" --port "${API_PORT}" --reload
fi

