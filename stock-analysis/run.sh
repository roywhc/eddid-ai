#!/bin/bash

# Stock Analysis Agent System - Run Script
# This script activates the virtual environment and runs the application

set -e  # Exit on error

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Check for required API keys
if [ -f ".env" ]; then
    source .env
fi

if [ -z "$OPENROUTER_API_KEY" ] && [ -z "$1" ] && [ "$1" != "--init-only" ]; then
    echo "Warning: OPENROUTER_API_KEY not set in environment or .env file"
    echo "The system will not work without OpenRouter API key."
    echo ""
    echo "You can:"
    echo "1. Set OPENROUTER_API_KEY environment variable"
    echo "2. Create a .env file with OPENROUTER_API_KEY=your-key"
    echo "3. Use --openrouter-key flag: python main.py --openrouter-key your-key"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check if knowledge base exists, if not initialize it
if [ ! -d "knowledge_base/_indexes" ]; then
    echo "Knowledge base not initialized. Initializing..."
    python main.py --init-only
    echo ""
fi

# Run the application with all passed arguments
echo "Starting Stock Analysis Agent System..."
echo ""
python main.py "$@"

