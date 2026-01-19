# Windows Installation Guide

## Recommended: Use install.bat

On Windows, it's recommended to use the `install.bat` script instead of `install.sh`:

```cmd
cd stock-analysis-ai
install.bat
```

## Using install.sh on Windows (Git Bash)

If you're using Git Bash on Windows and want to use `install.sh`, you may encounter conda activation issues. Here's how to handle it:

### Option 1: Let the script handle it

The script will automatically use `conda run` if activation fails, so you can just run:

```bash
./install.sh
```

### Option 2: Manual activation

If the script fails at activation, you can manually activate and continue:

```bash
# After the script creates the environment
conda activate agentic-kb

# Then continue manually:
pip install --upgrade pip
pip install -r requirements.txt
cp .env.example .env
python -c "from app.db.metadata_store import init_db; init_db()"
```

### Option 3: Use conda run directly

You can also use `conda run` to execute commands without activation:

```bash
conda run -n agentic-kb pip install --upgrade pip
conda run -n agentic-kb pip install -r requirements.txt
conda run -n agentic-kb python -c "from app.db.metadata_store import init_db; init_db()"
```

## Troubleshooting

### Conda activation fails in Git Bash

This is a known issue with conda in Git Bash. Solutions:

1. **Use install.bat** (recommended for Windows)
2. **Use Anaconda Prompt** instead of Git Bash
3. **Use conda run** as shown above

### Conda not found

Make sure conda is in your PATH:
- Install Miniconda or Anaconda
- During installation, check "Add conda to PATH"
- Or manually add: `C:\Users\YourName\miniconda3\Scripts` to PATH

### Environment already exists

The script will ask if you want to remove it. Answer 'y' to recreate, or 'N' to keep the existing one.

## After Installation

1. Activate environment:
   ```cmd
   conda activate agentic-kb
   ```

2. Edit .env file with your API keys

3. Run the application:
   ```cmd
   uvicorn app.main:app --reload
   ```


