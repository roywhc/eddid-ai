# Conda Installation Guide

## Overview

Using conda for installation provides several advantages:
- Better dependency resolution
- Pre-compiled packages (fewer build-from-source issues)
- Easier environment management
- Better support for scientific computing packages (numpy, scipy, pytorch)

## Installation Methods

### Method 1: Using install.sh / install.bat (Recommended)

**Linux/Mac:**
```bash
cd stock-analysis-ai
bash install.sh
```

**Windows:**
```cmd
cd stock-analysis-ai
install.bat
```

This script will:
1. Check for conda installation
2. Create a new conda environment named `agentic-kb` with Python 3.11
3. Install conda packages (sqlalchemy, numpy, scipy, scikit-learn, pytorch)
4. Install pip packages from requirements.txt
5. Optionally install PostgreSQL dependencies
6. Create .env file from template
7. Initialize the database
8. Verify installation

### Method 2: Using environment.yml

```bash
cd stock-analysis-ai
conda env create -f environment.yml
conda activate agentic-kb
```

Then manually:
```bash
# Create .env file
cp .env.example .env
# Edit .env with your API keys

# Initialize database
python -c "from app.db.metadata_store import init_db; init_db()"
```

### Method 3: Manual Conda Setup

```bash
# Create environment
conda create -n agentic-kb python=3.11 -y
conda activate agentic-kb

# Install conda packages
conda install -y -c conda-forge sqlalchemy numpy scipy scikit-learn pytorch -c pytorch

# Install pip packages
pip install -r requirements.txt

# Setup
cp .env.example .env
python -c "from app.db.metadata_store import init_db; init_db()"
```

## Why Python 3.11?

The installation scripts use Python 3.11 instead of 3.13 because:
- Better wheel support (fewer packages need to build from source)
- More packages have pre-built binaries
- Avoids Rust build requirements for many packages
- Better compatibility with the ecosystem

## Environment Management

### Activate Environment
```bash
conda activate agentic-kb
```

### Deactivate Environment
```bash
conda deactivate
```

### Remove Environment
```bash
conda env remove -n agentic-kb
```

### Update Environment
```bash
conda activate agentic-kb
pip install --upgrade -r requirements.txt
```

### Export Environment
```bash
conda env export > environment.yml
```

## Troubleshooting

### Conda Not Found
If you get "conda: command not found":
1. Install Miniconda: https://docs.conda.io/en/latest/miniconda.html
2. Or install Anaconda: https://www.anaconda.com/products/distribution
3. Restart your terminal after installation

### Environment Already Exists
The script will ask if you want to remove the existing environment. You can also manually remove it:
```bash
conda env remove -n agentic-kb
```

### Package Installation Fails
If some packages fail to install:
1. Try updating conda: `conda update conda`
2. Try updating pip: `pip install --upgrade pip`
3. Install packages individually to identify problematic ones

### CUDA/GPU Support
If you need CUDA support for PyTorch:
```bash
conda activate agentic-kb
conda install pytorch pytorch-cuda=11.8 -c pytorch -c nvidia
```

## Advantages of Conda

1. **Pre-compiled Packages**: Many packages come pre-compiled, avoiding Rust/C++ build requirements
2. **Better Dependency Resolution**: Conda's solver handles complex dependency graphs better
3. **Scientific Computing**: Better support for numpy, scipy, pytorch ecosystem
4. **Environment Isolation**: Clean separation from system Python
5. **Cross-platform**: Works consistently across Linux, Mac, and Windows

## Next Steps

After installation:
1. Activate environment: `conda activate agentic-kb`
2. Edit `.env` with your API keys
3. Run the application: `uvicorn app.main:app --reload`
4. Access API docs: http://localhost:8000/docs

