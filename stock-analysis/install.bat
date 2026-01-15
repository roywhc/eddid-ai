@echo off
REM Stock Analysis Agent System - Installation Script (Windows)
REM This script sets up the Python environment and installs dependencies

echo ==========================================
echo Stock Analysis Agent System - Installation
echo ==========================================
echo.

REM Check Python version
echo Checking Python version...
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed. Please install Python 3.8 or higher.
    exit /b 1
)

for /f "tokens=2" %%i in ('python --version') do set PYTHON_VERSION=%%i
echo ✓ Python %PYTHON_VERSION% found
echo.

REM Check for pip
echo Checking pip...
python -m pip --version >nul 2>&1
if errorlevel 1 (
    echo Error: pip is not installed. Please install pip.
    exit /b 1
)
echo ✓ pip found
echo.

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
    echo ✓ Virtual environment created
) else (
    echo ✓ Virtual environment already exists
)
echo.

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat
echo ✓ Virtual environment activated
echo.

REM Upgrade pip
echo Upgrading pip...
python -m pip install --upgrade pip --quiet
echo ✓ pip upgraded
echo.

REM Install dependencies
echo Installing dependencies...
if exist "requirements.txt" (
    python -m pip install -r requirements.txt
    echo ✓ Dependencies installed
) else (
    echo Warning: requirements.txt not found. Skipping dependency installation.
)
echo.

REM Create knowledge base directory if it doesn't exist
if not exist "knowledge_base" (
    echo Creating knowledge base directory...
    mkdir knowledge_base
    echo ✓ Knowledge base directory created
) else (
    echo ✓ Knowledge base directory already exists
)
echo.

REM Check for .env file
if not exist ".env" (
    echo Creating .env.example file...
    (
        echo # OpenAI API Key ^(required for agents^)
        echo OPENAI_API_KEY=sk-your-openai-api-key-here
        echo.
        echo # Perplexity API Key ^(required for research^)
        echo PERPLEXITY_API_KEY=pplx-your-perplexity-api-key-here
    ) > .env.example
    echo ✓ .env.example created
    echo.
    echo ⚠️  IMPORTANT: Create a .env file with your API keys:
    echo    copy .env.example .env
    echo    Then edit .env and add your API keys
    echo.
) else (
    echo ✓ .env file found
    echo.
)

echo ==========================================
echo Installation Complete!
echo ==========================================
echo.
echo Next steps:
echo 1. Set up your API keys in .env file:
echo    - OPENAI_API_KEY ^(required^)
echo    - PERPLEXITY_API_KEY ^(required^)
echo.
echo 2. Initialize the knowledge base:
echo    run.bat --init-only
echo.
echo 3. Start the chat interface:
echo    run.bat
echo.
echo Or activate the virtual environment and run manually:
echo    venv\Scripts\activate.bat
echo    python main.py
echo.

pause

