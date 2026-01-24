@echo off
REM Install Phase 2 dependencies for Agentic KB System (Windows)

echo Installing Phase 2 dependencies...

REM Try to activate conda environment
call conda activate agentic-kb 2>nul
if errorlevel 1 (
    echo Warning: Could not activate conda environment automatically
    echo Please run: conda activate agentic-kb
    echo Then run: pip install sentence-transformers==3.0.0 langchain-chroma>=0.2.0 langchain-huggingface>=0.1.0
    pause
    exit /b 1
)

echo Installing sentence-transformers...
pip install sentence-transformers==3.0.0

echo Installing langchain-chroma...
pip install langchain-chroma>=0.2.0

echo Installing langchain-huggingface...
pip install langchain-huggingface>=0.1.0

echo.
echo Verifying installation...
python -c "import sentence_transformers; print('OK: sentence-transformers')" || echo "FAILED: sentence-transformers"
python -c "from langchain_chroma import Chroma; print('OK: langchain-chroma')" || echo "FAILED: langchain-chroma"
python -c "from langchain_huggingface import HuggingFaceEmbeddings; print('OK: langchain-huggingface')" || echo "FAILED: langchain-huggingface"

echo.
echo Phase 2 dependencies installation complete!
echo Run tests with: pytest tests/test_vector_store.py tests/test_chunking.py -v

pause
