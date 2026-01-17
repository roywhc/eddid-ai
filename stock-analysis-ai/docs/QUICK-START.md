# Quick Start Guide

## Issue: ModuleNotFoundError

If you see `ModuleNotFoundError: No module named 'pydantic_settings'`, you need to install dependencies first.

## Solution Options

### Option 1: Use Conda Environment (Recommended)

The project is set up to use a conda environment with Python 3.11 to avoid Rust build issues.

1. **Activate conda environment:**
   ```bash
   # If conda is in PATH:
   conda activate agentic-kb
   
   # If conda is not in PATH, find it first:
   # Windows: Usually at C:\Users\YourName\miniconda3 or C:\Users\YourName\anaconda3
   # Then activate:
   C:\Users\YourName\miniconda3\Scripts\activate agentic-kb
   ```

2. **If environment doesn't exist, create it:**
   ```bash
   # Run the install script:
   ./install.sh
   
   # Or manually:
   conda create -n agentic-kb python=3.11 -y
   conda activate agentic-kb
   pip install -r requirements.txt
   ```

3. **Then run:**
   ```bash
   ./run.sh
   ```

### Option 2: Install Dependencies in Current Python

If you want to use your current Python (3.14), you'll need Rust for some packages:

1. **Install Rust:**
   - Download from: https://rustup.rs/
   - Or use: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

### Option 3: Use Python 3.11 or 3.12

These versions have better pre-built wheel support:

1. **Install Python 3.11 or 3.12**
2. **Create virtual environment:**
   ```bash
   python3.11 -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

## Verify Installation

After installing dependencies, verify:

```bash
python -c "from app.config import settings; print('Config loaded successfully')"
```

## Running the Application

Once dependencies are installed:

```bash
./run.sh
```

Or manually:

```bash
# Activate environment first
conda activate agentic-kb  # or: source venv/bin/activate

# Then run
uvicorn app.main:app --reload
```

## Troubleshooting

### Conda not found
- Make sure conda is installed and in PATH
- Or use full path to conda executable
- Or use Option 2/3 above

### Rust build errors
- Install Rust: https://rustup.rs/
- Or use Python 3.11/3.12 (better wheel support)
- Or use conda environment (Python 3.11)

### Still having issues?
1. Check Python version: `python --version`
2. Check if in correct environment: `which python` (Linux/Mac) or `where python` (Windows)
3. Try installing one package at a time to identify problematic ones

