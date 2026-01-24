#!/bin/bash
# Install Phase 2 dependencies for Agentic KB System

echo "Installing Phase 2 dependencies..."

# Activate conda environment if available
if command -v conda &> /dev/null; then
    echo "Activating conda environment: agentic-kb"
    source activate agentic-kb 2>/dev/null || conda activate agentic-kb 2>/dev/null || {
        echo "Warning: Could not activate conda environment automatically"
        echo "Please run: conda activate agentic-kb"
        echo "Then run: pip install sentence-transformers==3.0.0 langchain-chroma>=0.2.0 langchain-huggingface>=0.1.0"
        exit 1
    }
fi

# Install missing dependencies
echo "Installing sentence-transformers..."
pip install sentence-transformers==3.0.0

echo "Installing langchain-chroma..."
pip install langchain-chroma>=0.2.0

echo "Installing langchain-huggingface..."
pip install langchain-huggingface>=0.1.0

echo ""
echo "Verifying installation..."
python -c "import sentence_transformers; print('✓ sentence-transformers: OK')" || echo "✗ sentence-transformers: FAILED"
python -c "from langchain_chroma import Chroma; print('✓ langchain-chroma: OK')" || echo "✗ langchain-chroma: FAILED"
python -c "from langchain_huggingface import HuggingFaceEmbeddings; print('✓ langchain-huggingface: OK')" || echo "✗ langchain-huggingface: FAILED"

echo ""
echo "Phase 2 dependencies installation complete!"
echo "Run tests with: pytest tests/test_vector_store.py tests/test_chunking.py -v"
