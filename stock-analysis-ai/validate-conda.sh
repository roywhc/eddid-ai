#!/bin/bash
# Conda Setup Validation and Activation Script
# This script validates conda installation and provides activation methods

set -e

echo "=== Conda Setup Validation ==="
echo ""

# Check if conda is installed
echo "1. Checking conda installation..."
if command -v conda &> /dev/null; then
    CONDA_VERSION=$(conda --version)
    echo "   ✓ Conda found: $CONDA_VERSION"
    CONDA_PATH=$(which conda)
    echo "   ✓ Conda path: $CONDA_PATH"
else
    echo "   ✗ Conda not found in PATH"
    exit 1
fi

echo ""

# Check conda environments
echo "2. Checking conda environments..."
if conda env list &> /dev/null; then
    echo "   Available environments:"
    conda env list | grep -v "^#" | grep -v "^$" | sed 's/^/     /'
    
    # Check if agentic-kb exists
    if conda env list | grep -q "agentic-kb"; then
        echo "   ✓ agentic-kb environment found"
    else
        echo "   ✗ agentic-kb environment not found"
        echo "   Run: conda create -n agentic-kb python=3.11"
        exit 1
    fi
else
    echo "   ✗ Cannot list conda environments"
    exit 1
fi

echo ""

# Check conda initialization
echo "3. Checking conda initialization..."
if [ -f ~/.bashrc ] && grep -q "conda initialize" ~/.bashrc; then
    echo "   ✓ Conda initialization found in ~/.bashrc"
else
    echo "   ⚠ Conda initialization not found in ~/.bashrc"
    echo "   Run: conda init bash"
fi

echo ""

# Try to initialize conda for this session
echo "4. Initializing conda for current session..."
# Try different methods to initialize conda
if [ -f "/c/Users/Wanho/Application/miniconda3/Scripts/conda.exe" ]; then
    eval "$('/c/Users/Wanho/Application/miniconda3/Scripts/conda.exe' 'shell.bash' 'hook' 2>/dev/null)" 2>/dev/null || true
elif [ -f "/c/Users/Wanho/Application/miniconda3/etc/profile.d/conda.sh" ]; then
    source "/c/Users/Wanho/Application/miniconda3/etc/profile.d/conda.sh" 2>/dev/null || true
else
    # Manual activation method
    echo "   Using manual activation method..."
    export CONDA_DEFAULT_ENV=agentic-kb
    export PATH="/c/Users/Wanho/.conda/envs/agentic-kb/Scripts:/c/Users/Wanho/.conda/envs/agentic-kb:$PATH"
fi

echo ""

# Test activation
echo "5. Testing environment activation..."
if conda activate agentic-kb 2>/dev/null; then
    echo "   ✓ Successfully activated agentic-kb using 'conda activate'"
elif [ -n "$CONDA_DEFAULT_ENV" ] && [ "$CONDA_DEFAULT_ENV" = "agentic-kb" ]; then
    echo "   ✓ Environment activated using manual method"
else
    echo "   ⚠ Using manual activation..."
    export CONDA_DEFAULT_ENV=agentic-kb
    export PATH="/c/Users/Wanho/.conda/envs/agentic-kb/Scripts:/c/Users/Wanho/.conda/envs/agentic-kb:$PATH"
fi

echo ""

# Verify Python
echo "6. Verifying Python installation..."
if command -v python &> /dev/null; then
    PYTHON_VERSION=$(python --version 2>&1)
    PYTHON_PATH=$(which python)
    echo "   ✓ Python found: $PYTHON_VERSION"
    echo "   ✓ Python path: $PYTHON_PATH"
    
    # Check if it's from the conda environment
    if echo "$PYTHON_PATH" | grep -q "agentic-kb"; then
        echo "   ✓ Python is from agentic-kb environment"
    else
        echo "   ⚠ Python is not from agentic-kb environment"
    fi
else
    echo "   ✗ Python not found"
    exit 1
fi

echo ""
echo "=== Validation Complete ==="
echo ""
echo "Environment is ready! You can now:"
echo "  - Run: python --version"
echo "  - Run: pip list"
echo "  - Start your application"
echo ""
echo "Note: If 'conda activate' doesn't work in your terminal,"
echo "you can use this script to activate the environment:"
echo "  source validate-conda.sh"
