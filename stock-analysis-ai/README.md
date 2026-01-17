# Agentic AI Knowledge Base System

AI-powered chat system with internal knowledge base and Perplexity integration.

## Overview

This system provides an intelligent chat interface that:
- Retrieves information from an internal knowledge base
- Falls back to Perplexity API for external knowledge when needed
- Automatically curates and updates the knowledge base based on queries

## Architecture

- **FastAPI**: REST API framework
- **LangChain v1**: RAG (Retrieval Augmented Generation) engine
- **Chroma/pgvector**: Vector database for semantic search
- **OpenRouter**: LLM provider (supports 300+ models from OpenAI, Anthropic, Google, etc.)
- **Perplexity API**: External knowledge source
- **SQLAlchemy**: Metadata and relational data storage

## Quick Start

### Prerequisites

- Python 3.11+ (3.11 or 3.12 recommended for better compatibility)
- Conda (recommended) or pip/venv
- Docker & Docker Compose (for production deployment)

### Installation Options

#### Option 1: Conda Installation (Recommended)

**Linux/Mac:**
```bash
cd stock-analysis-ai
bash install.sh
```

**Windows:**
```cmd
cd stock-analysis-ai
install.bat
```

The script will:
- Create a conda environment with Python 3.11
- Install all dependencies
- Set up configuration files
- Initialize the database

**After installation:**
```bash
conda activate agentic-kb
uvicorn app.main:app --reload
```

#### Option 2: Manual Installation with pip

1. Clone the repository and navigate to the project directory:
```bash
cd stock-analysis-ai
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

   **Note**: If you plan to use PostgreSQL/pgvector instead of ChromaDB (default), also install:
   ```bash
   pip install -r requirements-optional.txt
   ```

4. Copy environment template:
```bash
cp .env.example .env
```

5. Edit `.env` and fill in your API keys:
- `OPENAI_API_KEY`: Your OpenAI API key
- `PERPLEXITY_API_KEY`: Your Perplexity API key
- `SECRET_KEY`: A secure secret key for production

6. Initialize the database:
```bash
python -c "from app.db.metadata_store import init_db; init_db()"
```

7. Run the application:

**Option A: Using run script (Recommended)**
```bash
# Linux/Mac
./run.sh

# Windows
run.bat
```

**Option B: Manual start**
```bash
# Activate environment first
conda activate agentic-kb  # or: source venv/bin/activate

# Then run
uvicorn app.main:app --reload
```

8. Access the API:
- API: http://localhost:8000
- Swagger Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/api/v1/health

## Project Structure

```
stock-analysis-ai/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application entry point
│   ├── config.py            # Configuration and environment variables
│   ├── models.py            # Pydantic model definitions
│   ├── api/
│   │   ├── __init__.py
│   │   ├── chat.py          # Chat endpoints
│   │   ├── kb_management.py # KB management endpoints
│   │   └── health.py        # Health check
│   ├── services/
│   │   ├── __init__.py
│   │   ├── retrieval.py     # Vector retrieval service
│   │   ├── llm.py           # LLM wrapper service
│   │   ├── external_knowledge.py  # Perplexity integration
│   │   ├── kb_curator.py    # KB candidate generation
│   │   └── session.py       # Session management
│   ├── db/
│   │   ├── __init__.py
│   │   ├── vector_store.py  # Vector store initialization
│   │   ├── metadata_store.py # Metadata DB
│   │   └── cache.py         # Simple caching layer
│   └── utils/
│       ├── __init__.py
│       ├── logger.py        # Logging configuration
│       ├── validators.py    # Validation utilities
│       └── chunking.py       # Document chunking
├── tests/
│   ├── __init__.py
│   ├── test_retrieval.py    # Retrieval tests
│   ├── test_external_knowledge.py  # External knowledge tests
│   ├── test_kb_update.py    # KB update tests
│   └── fixtures/            # Test data
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
├── docs/
│   └── agentic-kb-implementation-guide.md
├── requirements.txt
├── .env.example
└── README.md
```

## Implementation Status

### ✅ Step 1: Core Infrastructure (COMPLETE)
- Configuration management
- Logging system
- Data models
- Database infrastructure
- FastAPI application setup
- Basic API endpoints

### ⏳ Step 2: Internal Knowledge Base Setup (PENDING)
- Vector store initialization
- Document chunking
- Embedding generation
- Basic retrieval

### ⏳ Step 3: Chat API and RAG Query (PENDING)
- Full RAG implementation
- LLM integration
- Confidence scoring

### ⏳ Step 4: Perplexity Integration (PENDING)
- External knowledge service
- API integration

### ⏳ Step 5: Knowledge Base Update Pipeline (PENDING)
- KB curator agent
- Candidate generation
- Review workflow

### ⏳ Step 6: Observability & Monitoring (PENDING)
- Enhanced logging
- Metrics collection

### ⏳ Step 7: Production Deployment (PENDING)
- Docker containerization
- Production configuration

## Testing

Run tests:
```bash
pytest tests/ -v
```

Run with coverage:
```bash
pytest tests/ -v --cov=app --cov-report=html
```

## Development

### Code Style

Format code:
```bash
black app/ tests/
```

Lint code:
```bash
flake8 app/ tests/
```

Type checking:
```bash
mypy app/
```

## Documentation

For detailed implementation guide, see:
- [Implementation Guide](docs/agentic-kb-implementation-guide.md)

## License

[Add your license here]

## Support

For issues and questions, please refer to the documentation in `/docs/` directory.

