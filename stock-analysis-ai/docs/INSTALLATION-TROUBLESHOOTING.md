# Installation Troubleshooting Guide

## Rust Build Errors

Some packages require Rust to build from source. If you encounter Rust errors during installation:

### Option 1: Install Rust (Recommended for Development)
```bash
# Windows: Download and install from https://rustup.rs/
# Or use chocolatey:
choco install rust

# After installation, verify:
rustc --version
```

### Option 2: Use Pre-built Wheels
Most packages have pre-built wheels available. If you encounter build errors:

1. **Upgrade pip** to ensure it prefers wheels:
```bash
python -m pip install --upgrade pip
```

2. **Install packages individually** to identify problematic ones:
```bash
pip install openai  # Without version pin
```

3. **Skip problematic packages temporarily**:
   - Comment out packages that require Rust
   - Install the rest
   - Install problematic packages separately after Rust is installed

### Option 3: Use Python 3.11 or 3.12
Python 3.13 is very new and some packages may not have wheels yet. Consider using Python 3.11 or 3.12 which have better wheel support.

## Known Issues

### jiter (OpenAI dependency)
- **Issue**: `openai==1.40.0` may require building `jiter` from source on Python 3.13
- **Solution**: Use flexible version `openai>=1.40.0` which will use pre-built wheels when available
- **Alternative**: Install Rust toolchain

### chromadb
- **Issue**: May show Rust errors during dry-run
- **Solution**: Pre-built wheels are available for Windows - actual installation should work
- **If it fails**: Install Rust or use a different vector store

### chroma-hnswlib
- **Issue**: Requires building from source
- **Solution**: Usually has pre-built wheels, but may need Rust if wheel unavailable

## Quick Fixes

### If installation fails with Rust errors:

1. **Install Rust** (one-time setup):
   - Windows: https://rustup.rs/
   - After installation, restart terminal and try again

2. **Or use existing packages**:
   ```bash
   # Skip packages that are already installed
   pip install -r requirements.txt --ignore-installed
   ```

3. **Or install without problematic packages**:
   ```bash
   # Install core packages first
   pip install fastapi uvicorn pydantic sqlalchemy
   
   # Then install others one by one
   pip install langchain langchain-core
   # etc.
   ```

## Verification

After installation, verify everything works:
```bash
python -c "from app.config import settings; print('Config OK')"
python -c "import openai; print(f'OpenAI: {openai.__version__}')"
python -c "import langchain; print(f'LangChain: {langchain.__version__}')"
```

## Getting Help

If you continue to have issues:
1. Check Python version: `python --version` (should be 3.13+)
2. Check pip version: `pip --version` (should be latest)
3. Try installing in a fresh virtual environment
4. Check package-specific documentation for Python 3.13 compatibility


