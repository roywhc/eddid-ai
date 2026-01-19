# Installation Guide

## Quick Start

### Prerequisites
- Python 3.13+ (or 3.11/3.12 for better compatibility)
- pip (latest version)

### Step 1: Upgrade pip
```bash
python -m pip install --upgrade pip
```

### Step 2: Install Dependencies

**Option A: Standard Installation (Recommended)**
```bash
pip install -r requirements.txt
```

**Option B: If you encounter Rust build errors**

1. Install Rust (one-time):
   - Windows: Download from https://rustup.rs/
   - After installation, restart your terminal

2. Then install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

**Option C: Skip already installed packages**
```bash
# If you already have some packages installed (like openai)
pip install -r requirements.txt --upgrade
```

### Step 3: Verify Installation
```bash
python -c "from app.config import settings; print('✓ Config loaded')"
python -c "import openai; print(f'✓ OpenAI: {openai.__version__}')"
python -c "import langchain; print(f'✓ LangChain: {langchain.__version__}')"
```

## Troubleshooting

### Rust Build Errors

If you see errors about Rust/Cargo:

1. **Quick Fix**: Install Rust from https://rustup.rs/
2. **Alternative**: Use Python 3.11 or 3.12 (better wheel support)
3. **Workaround**: Install packages individually, skipping problematic ones

### Specific Package Issues

- **jiter (OpenAI dependency)**: Use flexible version constraint (already in requirements.txt)
- **chromadb**: Should have pre-built wheels for Windows
- **chroma-hnswlib**: May need Rust if wheel unavailable

### Python Version

If you're using Python 3.13 and encounter issues:
- Consider using Python 3.11 or 3.12 for better compatibility
- Or install Rust toolchain for building from source

## Next Steps

After successful installation:

1. Copy environment template:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your API keys

3. Initialize database:
   ```bash
   python -c "from app.db.metadata_store import init_db; init_db()"
   ```

4. Run the application:
   ```bash
   uvicorn app.main:app --reload
   ```

For more troubleshooting help, see [INSTALLATION-TROUBLESHOOTING.md](docs/INSTALLATION-TROUBLESHOOTING.md)


