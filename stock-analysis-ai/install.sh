#!/bin/bash
# Agentic AI Knowledge Base System - Conda Installation Script
# This script sets up the project using conda for better dependency management

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENV_NAME="agentic-kb"
PYTHON_VERSION="3.11"  # Using 3.11 for better compatibility (3.13 has wheel issues)
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${GREEN}=== Agentic AI Knowledge Base System - Installation ===${NC}"
echo ""
echo -e "${YELLOW}Alternative: You can also use 'conda env create -f environment.yml'${NC}"
echo ""

# Check if conda is installed
if ! command -v conda &> /dev/null; then
    echo -e "${RED}Error: conda is not installed or not in PATH${NC}"
    echo "Please install Miniconda or Anaconda from: https://docs.conda.io/en/latest/miniconda.html"
    exit 1
fi

echo -e "${GREEN}✓ Conda found: $(conda --version)${NC}"

# Check if environment already exists
if conda env list | grep -q "^${ENV_NAME} "; then
    echo -e "${YELLOW}Warning: Environment '${ENV_NAME}' already exists${NC}"
    read -p "Do you want to remove it and create a new one? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Removing existing environment...${NC}"
        conda env remove -n "${ENV_NAME}" -y
    else
        echo -e "${YELLOW}Using existing environment. Activate it with: conda activate ${ENV_NAME}${NC}"
        exit 0
    fi
fi

# Create conda environment
echo -e "${GREEN}Creating conda environment '${ENV_NAME}' with Python ${PYTHON_VERSION}...${NC}"
conda create -n "${ENV_NAME}" python="${PYTHON_VERSION}" -y

# Activate environment
echo -e "${GREEN}Activating environment...${NC}"
# Initialize conda for bash (works on Linux, Mac, and Windows/Git Bash)
CONDA_BASE=$(conda info --base)
if [ -f "${CONDA_BASE}/etc/profile.d/conda.sh" ]; then
    # Linux/Mac method
    source "${CONDA_BASE}/etc/profile.d/conda.sh"
    conda activate "${ENV_NAME}"
elif command -v conda &> /dev/null; then
    # Try conda shell hook (works in Git Bash on Windows)
    eval "$(conda shell.bash hook)" 2>/dev/null
    conda activate "${ENV_NAME}" 2>/dev/null || {
        echo -e "${YELLOW}Note: Using 'conda run' to execute commands in the environment${NC}"
        USE_CONDA_RUN=true
    }
else
    echo -e "${RED}Error: Could not initialize conda${NC}"
    exit 1
fi

# Function to run commands in conda environment
run_in_env() {
    if [ "${USE_CONDA_RUN:-false}" = "true" ]; then
        conda run -n "${ENV_NAME}" bash -c "$*"
    else
        "$@"
    fi
}

# Upgrade pip
echo -e "${GREEN}Upgrading pip...${NC}"
run_in_env pip install --upgrade pip

# Install conda packages (for packages that are better managed by conda)
echo -e "${GREEN}Installing conda packages...${NC}"
if [ "${USE_CONDA_RUN:-false}" = "true" ]; then
    # Use conda install with -n flag when activation failed
    conda install -n "${ENV_NAME}" -y -c conda-forge \
        sqlalchemy \
        numpy \
        scipy \
        scikit-learn \
        pytorch \
        -c pytorch || conda install -n "${ENV_NAME}" -y -c conda-forge sqlalchemy numpy scipy scikit-learn pytorch -c pytorch
else
    # Normal conda install (environment is activated)
    conda install -y -c conda-forge \
        sqlalchemy \
        numpy \
        scipy \
        scikit-learn \
        pytorch \
        -c pytorch || conda install -y -c conda-forge sqlalchemy numpy scipy scikit-learn pytorch -c pytorch
fi

# Install pip packages
echo -e "${GREEN}Installing pip packages from requirements.txt...${NC}"
cd "${PROJECT_DIR}"

# Check if requirements.txt exists
if [ ! -f "requirements.txt" ]; then
    echo -e "${RED}Error: requirements.txt not found in ${PROJECT_DIR}${NC}"
    exit 1
fi

run_in_env pip install -r requirements.txt

# Install optional dependencies if requested
read -p "Do you want to install PostgreSQL/pgvector support? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}Installing PostgreSQL dependencies...${NC}"
    run_in_env pip install -r requirements-optional.txt || echo -e "${YELLOW}Warning: requirements-optional.txt not found, skipping...${NC}"
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo -e "${GREEN}Creating .env file from template...${NC}"
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${YELLOW}Please edit .env file and add your API keys:${NC}"
        echo "  - OPENAI_API_KEY"
        echo "  - PERPLEXITY_API_KEY"
        echo "  - SECRET_KEY"
    else
        echo -e "${YELLOW}Warning: .env.example not found. Please create .env manually.${NC}"
    fi
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

# Create necessary directories
echo -e "${GREEN}Creating necessary directories...${NC}"
mkdir -p data logs

# Initialize database
echo -e "${GREEN}Initializing database...${NC}"
run_in_env python -c "from app.db.metadata_store import init_db; init_db()" || {
    echo -e "${YELLOW}Warning: Database initialization failed. You can run it manually later.${NC}"
}

# Verify installation
echo -e "${GREEN}Verifying installation...${NC}"
run_in_env python -c "from app.config import settings; print('✓ Config loaded')" || {
    echo -e "${RED}Error: Failed to import app.config${NC}"
    exit 1
}

run_in_env python -c "import openai; print(f'✓ OpenAI: {openai.__version__}')" || echo -e "${YELLOW}Warning: OpenAI not installed${NC}"
run_in_env python -c "import langchain; print(f'✓ LangChain: {langchain.__version__}')" || echo -e "${YELLOW}Warning: LangChain not installed${NC}"

echo ""
echo -e "${GREEN}=== Installation Complete! ===${NC}"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo "1. Activate the environment:"
echo "   ${YELLOW}conda activate ${ENV_NAME}${NC}"
echo ""
echo "2. Edit .env file with your API keys:"
echo "   ${YELLOW}nano .env${NC}  # or use your preferred editor"
echo ""
echo "3. Run the application:"
echo "   ${YELLOW}uvicorn app.main:app --reload${NC}"
echo ""
echo "4. Access the API:"
echo "   - API: http://localhost:8000"
echo "   - Docs: http://localhost:8000/docs"
echo "   - Health: http://localhost:8000/api/v1/health"
echo ""
