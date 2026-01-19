@echo off
REM Agentic AI Knowledge Base System - Conda Installation Script (Windows)
REM This script sets up the project using conda for better dependency management

setlocal enabledelayedexpansion

REM Configuration
set ENV_NAME=agentic-kb
set PYTHON_VERSION=3.11
set PROJECT_DIR=%~dp0

echo === Agentic AI Knowledge Base System - Installation ===
echo.

REM Check if conda is installed
where conda >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Error: conda is not installed or not in PATH
    echo Please install Miniconda or Anaconda from: https://docs.conda.io/en/latest/miniconda.html
    exit /b 1
)

echo [OK] Conda found
conda --version
echo.

REM Check if environment already exists
conda env list | findstr /C:"%ENV_NAME%" >nul
if %ERRORLEVEL% EQU 0 (
    echo Warning: Environment '%ENV_NAME%' already exists
    set /p REMOVE_ENV="Do you want to remove it and create a new one? (y/N): "
    if /i "!REMOVE_ENV!"=="y" (
        echo Removing existing environment...
        conda env remove -n "%ENV_NAME%" -y
    ) else (
        echo Using existing environment. Activate it with: conda activate %ENV_NAME%
        exit /b 0
    )
)

REM Create conda environment
echo Creating conda environment '%ENV_NAME%' with Python %PYTHON_VERSION%...
conda create -n "%ENV_NAME%" python=%PYTHON_VERSION% -y
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to create conda environment
    exit /b 1
)

REM Activate environment
echo Activating environment...
call conda activate "%ENV_NAME%"
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to activate conda environment
    exit /b 1
)

REM Upgrade pip
echo Upgrading pip...
python -m pip install --upgrade pip

REM Install conda packages
echo Installing conda packages...
conda install -y -c conda-forge sqlalchemy numpy scipy scikit-learn pytorch -c pytorch
if %ERRORLEVEL% NEQ 0 (
    echo Warning: Some conda packages failed to install, continuing with pip...
)

REM Install pip packages
echo Installing pip packages from requirements.txt...
cd /d "%PROJECT_DIR%"

if not exist "requirements.txt" (
    echo Error: requirements.txt not found in %PROJECT_DIR%
    exit /b 1
)

pip install -r requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo Warning: Some pip packages failed to install
)

REM Install optional dependencies
set /p INSTALL_PG="Do you want to install PostgreSQL/pgvector support? (y/N): "
if /i "!INSTALL_PG!"=="y" (
    echo Installing PostgreSQL dependencies...
    if exist "requirements-optional.txt" (
        pip install -r requirements-optional.txt
    ) else (
        echo Warning: requirements-optional.txt not found, skipping...
    )
)

REM Create .env file if it doesn't exist
if not exist ".env" (
    echo Creating .env file from template...
    if exist ".env.example" (
        copy .env.example .env >nul
        echo Please edit .env file and add your API keys:
        echo   - OPENAI_API_KEY
        echo   - PERPLEXITY_API_KEY
        echo   - SECRET_KEY
    ) else (
        echo Warning: .env.example not found. Please create .env manually.
    )
) else (
    echo [OK] .env file already exists
)

REM Create necessary directories
echo Creating necessary directories...
if not exist "data" mkdir data
if not exist "logs" mkdir logs

REM Initialize database
echo Initializing database...
python -c "from app.db.metadata_store import init_db; init_db()"
if %ERRORLEVEL% NEQ 0 (
    echo Warning: Database initialization failed. You can run it manually later.
)

REM Verify installation
echo Verifying installation...
python -c "from app.config import settings; print('[OK] Config loaded')"
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to import app.config
    exit /b 1
)

python -c "import openai; print(f'[OK] OpenAI: {openai.__version__}')" 2>nul || echo Warning: OpenAI not installed
python -c "import langchain; print(f'[OK] LangChain: {langchain.__version__}')" 2>nul || echo Warning: LangChain not installed

echo.
echo === Installation Complete! ===
echo.
echo Next steps:
echo 1. Activate the environment:
echo    conda activate %ENV_NAME%
echo.
echo 2. Edit .env file with your API keys
echo.
echo 3. Run the application:
echo    uvicorn app.main:app --reload
echo.
echo 4. Access the API:
echo    - API: http://localhost:8000
echo    - Docs: http://localhost:8000/docs
echo    - Health: http://localhost:8000/api/v1/health
echo.

pause


