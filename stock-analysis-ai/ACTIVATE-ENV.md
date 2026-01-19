# How to Activate the Conda Environment

## Current Issue

You're using system Python 3.14, but the project dependencies are installed in the `agentic-kb` conda environment.

## Quick Fix

### Step 1: Find Conda Installation

On Windows, conda is usually at one of these locations:
- `C:\Users\YourName\miniconda3`
- `C:\Users\YourName\anaconda3`
- `C:\ProgramData\Anaconda3`

### Step 2: Activate Environment

**In Git Bash:**
```bash
# Replace with your actual conda path
export PATH="/c/Users/Wanho/miniconda3/Scripts:/c/Users/Wanho/miniconda3:$PATH"

# Initialize conda
source /c/Users/Wanho/miniconda3/etc/profile.d/conda.sh

# Activate environment
conda activate agentic-kb

# Verify
python --version  # Should show Python 3.11.x
which python      # Should point to conda environment
```

**In Anaconda Prompt (Windows):**
```cmd
conda activate agentic-kb
```

**In PowerShell:**
```powershell
# Initialize conda
& C:\Users\Wanho\miniconda3\Scripts\conda.exe init powershell
# Restart PowerShell, then:
conda activate agentic-kb
```

### Step 3: Verify Installation

```bash
python -c "from app.config import settings; print('✓ Config loaded')"
python -c "import openai; print('✓ OpenAI installed')"
```

### Step 4: Run Application

```bash
./run.sh
# Or:
uvicorn app.main:app --reload
```

## Alternative: Update PATH Permanently

Add conda to your PATH so `run.sh` can find it:

**Windows (System Properties):**
1. Search "Environment Variables"
2. Edit "Path" variable
3. Add: `C:\Users\Wanho\miniconda3\Scripts`
4. Add: `C:\Users\Wanho\miniconda3`
5. Restart terminal

**Or in Git Bash profile (~/.bashrc):**
```bash
export PATH="/c/Users/Wanho/miniconda3/Scripts:/c/Users/Wanho/miniconda3:$PATH"
```

## Check if Environment Has Dependencies

```bash
conda activate agentic-kb
pip list | grep -E "pydantic|fastapi|langchain"
```

If packages are missing, install them:
```bash
conda activate agentic-kb
pip install -r requirements.txt
```


