@echo off
REM Stock Analysis Agent System - Run Script (Windows)
REM This script activates the virtual environment and runs the application

REM Check if virtual environment exists
if not exist "venv" (
    echo Error: Virtual environment not found.
    echo Please run install.bat first to set up the environment.
    exit /b 1
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Check for required API keys
if exist ".env" (
    for /f "usebackq tokens=1,* delims==" %%a in (".env") do (
        if "%%a"=="OPENAI_API_KEY" set OPENAI_API_KEY=%%b
        if "%%a"=="PERPLEXITY_API_KEY" set PERPLEXITY_API_KEY=%%b
    )
)

if "%OPENAI_API_KEY%"=="" (
    if "%1"=="" (
        echo Warning: OPENAI_API_KEY not set in environment or .env file
        echo The system will not work without OpenAI API key.
        echo.
        echo You can:
        echo 1. Set OPENAI_API_KEY environment variable
        echo 2. Create a .env file with OPENAI_API_KEY=your-key
        echo 3. Use --openai-key flag: python main.py --openai-key your-key
        echo.
        set /p CONTINUE="Continue anyway? (y/N): "
        if /i not "%CONTINUE%"=="y" exit /b 1
    )
)

REM Check if knowledge base exists, if not initialize it
if not exist "knowledge_base\_indexes" (
    echo Knowledge base not initialized. Initializing...
    python main.py --init-only
    echo.
)

REM Run the application with all passed arguments
echo Starting Stock Analysis Agent System...
echo.
python main.py %*

