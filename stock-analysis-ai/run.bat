@echo off
REM Agentic AI Knowledge Base System - Run Script (Windows)
REM This script starts the FastAPI application

setlocal enabledelayedexpansion

REM Configuration
set ENV_NAME=agentic-kb
set PROJECT_DIR=%~dp0

echo === Agentic AI Knowledge Base System ===
echo.

REM Check if conda is available
where conda >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Activating conda environment '%ENV_NAME%'...
    call conda activate "%ENV_NAME%" 2>nul
    if %ERRORLEVEL% NEQ 0 (
        echo Warning: Could not activate conda environment
        echo Please run install.bat first or activate your environment manually
    )
)

REM Check if virtual environment exists
if exist "%PROJECT_DIR%venv\Scripts\activate.bat" (
    echo Activating virtual environment...
    call "%PROJECT_DIR%venv\Scripts\activate.bat"
)

REM Check if .env file exists
if not exist "%PROJECT_DIR%.env" (
    echo Warning: .env file not found
    if exist "%PROJECT_DIR%.env.example" (
        echo Creating .env from .env.example...
        copy "%PROJECT_DIR%.env.example" "%PROJECT_DIR%.env" >nul
        echo Please edit .env file and add your API keys before running
        pause
        exit /b 1
    ) else (
        echo Error: .env file not found and .env.example is missing
        pause
        exit /b 1
    )
)

REM Check if database is initialized
if not exist "%PROJECT_DIR%data\metadata.db" (
    echo Database not found. Initializing...
    python -c "from app.db.metadata_store import init_db; init_db()"
    if %ERRORLEVEL% NEQ 0 (
        echo Error: Failed to initialize database
        pause
        exit /b 1
    )
    echo [OK] Database initialized
)

REM Load environment variables from .env (basic support)
for /f "tokens=1,2 delims==" %%a in ('type "%PROJECT_DIR%.env" ^| findstr /v "^#" ^| findstr /v "^$"') do (
    set "%%a=%%b"
)

REM Get configuration with defaults
if not defined API_HOST set API_HOST=0.0.0.0
if not defined API_PORT set API_PORT=8000
if not defined DEBUG set DEBUG=true

echo Starting application...
echo Host: %API_HOST%
echo Port: %API_PORT%
echo Debug: %DEBUG%
echo.
echo API will be available at:
echo   http://localhost:%API_PORT%
echo   http://localhost:%API_PORT%/docs (Swagger UI)
echo   http://localhost:%API_PORT%/api/v1/health (Health Check)
echo.
echo Press Ctrl+C to stop the server
echo.

REM Run the application
cd /d "%PROJECT_DIR%"
uvicorn app.main:app --host %API_HOST% --port %API_PORT% --reload

pause

