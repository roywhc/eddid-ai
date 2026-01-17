#!/bin/bash
# Helper script to activate conda environment
# Usage: source activate-env.sh

ENV_NAME="agentic-kb"
ENV_PATH="/c/Users/Wanho/.conda/envs/${ENV_NAME}"

if [ -d "$ENV_PATH" ]; then
    echo "Activating conda environment: $ENV_NAME"
    export PATH="${ENV_PATH}/Scripts:${ENV_PATH}:${PATH}"
    
    # Create aliases for Python
    alias python="${ENV_PATH}/python.exe"
    alias pip="${ENV_PATH}/Scripts/pip.exe"
    
    echo "✓ Environment activated"
    echo "Python: $(python --version 2>&1)"
    echo "Location: $(which python 2>&1)"
else
    echo "Error: Conda environment not found at $ENV_PATH"
    echo "Please run install.sh first"
    return 1
fi

