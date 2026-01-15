# Stock Analysis Agent System

A layered agent application that provides an intelligent chat interface for stock analysis queries, powered by a graph-based knowledge base with dynamic indexing capabilities.

## Architecture

The system uses a **two-layer agent architecture**:

1. **Chat Agent (Outer Layer)**: Handles natural language user queries, extracts entities (tickers, dates, topics), and synthesizes responses
2. **KB Manager Agent (Inner Layer)**: Manages knowledge base operations, navigates graph-based indexes, and coordinates with Perplexity API for research

### System Flow

```
User Query
    ↓
Chat Agent (NLU, Ticker Identification)
    ↓
KB Manager Agent (Index Navigation, Report Retrieval)
    ↓
Knowledge Base Tools (Index Tools, Report Tools, Perplexity Tool)
    ↓
File-Based Knowledge Base (Reports + Graph Indexes)
```

## Features

- **Natural Language Interface**: Ask questions about stocks in plain English
- **Intelligent Knowledge Base**: Graph-based index system for efficient information retrieval
- **Automatic Research**: System automatically calls Perplexity API when information is insufficient
- **Dynamic Indexing**: Indexes are automatically updated when new reports are generated
- **Cost-Aware**: Prioritizes knowledge base lookups before making API calls

## Installation

### Quick Install (Linux/macOS)

```bash
./install.sh
```

This will:
- Check Python version (requires 3.8+)
- Create a virtual environment
- Install all dependencies
- Create knowledge base directory
- Set up .env.example file

### Quick Install (Windows)

```bash
install.bat
```

### Manual Installation

1. **Create virtual environment**:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install dependencies**:
```bash
pip install -r requirements.txt
```

3. **Set up API keys**:
   - **OpenRouter API Key** (required for agents): Get from [openrouter.ai](https://openrouter.ai)
   - **Perplexity API Key** (required for research): Get from [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)
   
   Set environment variables:
   ```bash
   # Linux/macOS
   export OPENROUTER_API_KEY="sk-or-your-key-here"
   export PERPLEXITY_API_KEY="pplx-your-key-here"
   
   # Windows
   setx OPENROUTER_API_KEY "sk-or-your-key-here"
   setx PERPLEXITY_API_KEY "pplx-your-key-here"
   ```
   
   Or create a `.env` file:
   ```
   OPENROUTER_API_KEY=sk-or-your-key-here
   PERPLEXITY_API_KEY=pplx-your-key-here
   ```
   
   **Note**: OpenRouter provides access to multiple LLM providers. You can use models like:
   - `openai/gpt-4o-mini` (default, cost-effective)
   - `openai/gpt-4o`
   - `anthropic/claude-3.5-sonnet`
   - `google/gemini-pro`
   - And many others - see [OpenRouter Models](https://openrouter.ai/models)

## Usage

### Quick Start (Linux/macOS)

```bash
./run.sh
```

### Quick Start (Windows)

```bash
run.bat
```

### Manual Usage

#### Interactive Chat Mode

Start the chat interface:

```bash
python main.py
```

Example queries:
- "What are the risks for Apple?"
- "Show me the latest analysis on Microsoft"
- "Compare Apple and Microsoft's valuation"
- "What tech stocks have AI focus?"

### Single Query Mode

Run a single query:

```bash
python main.py --query "What are the risks for Apple?"
```

### Initialize Knowledge Base

Initialize or rebuild the knowledge base indexes:

```bash
# Using run script
./run.sh --init-only  # Linux/macOS
run.bat --init-only   # Windows

# Or manually
python main.py --init-only
```

### Custom Knowledge Base Directory

```bash
python main.py --kb-dir ./my_kb
```

## Knowledge Base Structure

The knowledge base uses a graph-based index system:

```
knowledge_base/
├── _indexes/              # Graph index structure
│   ├── root.json          # Root index (entry point)
│   ├── topics/            # Topic indexes
│   │   └── technology.json
│   ├── stocks/            # Stock indexes
│   │   └── AAPL.json
│   └── dates/             # Date indexes
│       └── 2026_01.json
├── AAPL/                  # Report storage
│   └── 2026/
│       └── AAPL_2026-01-15.json
└── MSFT/
    └── 2026/
        └── MSFT_2026-01-15.json
```

### Index Types

- **Root Index**: Overview of all stocks in the knowledge base
- **Stock Indexes**: Per-stock indexes with report listings and summaries
- **Topic Indexes**: Thematic indexes (sectors, themes, metrics)
- **Date Indexes**: Time-based organization of reports

## How It Works

1. **User Query**: User asks a natural language question
2. **Chat Agent**: 
   - Extracts ticker symbols, dates, topics from query
   - Identifies query intent (retrieve, compare, explore)
   - Calls KB Manager with structured parameters
3. **KB Manager Agent**:
   - Starts at root index
   - Navigates index graph to find relevant information
   - Retrieves reports from knowledge base
   - Assesses information sufficiency
   - Calls Perplexity tool if information is insufficient
   - Updates indexes after new data ingestion
4. **Response**: Chat Agent synthesizes results into natural language

## Report Format

Reports follow a comprehensive JSON schema (see `docs/perplexity-stock-analysis-prompt.md`) with fields:
- `meta`: Basic stock and report information
- `price_snapshot`: Current price and performance metrics
- `executive_summary`: Investment thesis and key points
- `company_overview`: Business description and strategy
- `fundamentals`: Financial performance analysis
- `industry_and_competition`: Sector context and competitive positioning
- `catalysts`: Near-term and medium-term catalysts
- `risks`: Key downside risks
- `valuation`: Valuation analysis and scenarios
- `informational_stance`: Investment recommendation

## Python API

You can also use the agents programmatically:

```python
from pathlib import Path
from src.chat_agent import ChatAgent

# Initialize chat agent
agent = ChatAgent(
    knowledge_base_dir="./knowledge_base",
    openrouter_api_key="sk-or-your-key",
    perplexity_api_key="pplx-your-key",
    model="openai/gpt-4o-mini"  # Or any OpenRouter model
)

# Ask a question
response = agent.chat("What are the risks for Apple?")
print(response)
```

## Architecture Details

### Chat Agent

- **Responsibilities**: Natural language understanding, ticker identification, response synthesis
- **Tools**: KB Manager query tool
- **Model**: OpenRouter model (default: `openai/gpt-4o-mini`, configurable)

### KB Manager Agent

- **Responsibilities**: Index navigation, report retrieval, information sufficiency assessment, index updates
- **Tools**: Index tools, report tools, Perplexity research tool
- **Model**: OpenRouter model (default: `openai/gpt-4o-mini`, configurable)

### Knowledge Base Tools

- **Index Tools**: CRUD operations on graph-based index nodes
- **Report Tools**: Read and search operations on report files
- **Perplexity Tool**: External API integration for report generation

## Error Handling

The system includes comprehensive error handling:
- API rate limits with retry logic
- Authentication errors with clear messages
- File I/O errors with graceful degradation
- JSON parsing errors with fallback to raw content

## Cost Considerations

- **OpenRouter API**: Used for agent reasoning (supports multiple providers and models)
  - Default model: `openai/gpt-4o-mini` (cost-effective)
  - Can switch to other models via `--model` parameter
  - See [OpenRouter Pricing](https://openrouter.ai/docs/pricing) for model costs
- **Perplexity API**: Used only when knowledge base lacks sufficient information
- **Optimization**: System prioritizes KB lookups to minimize API calls

## Documentation

- **PRD**: `docs/prd.md` - Complete product requirements document
- **Prompt Schema**: `docs/perplexity-stock-analysis-prompt.md` - Report format specification
- **Quick Start**: `docs/quick-start-guide.md` - Getting started guide

## Troubleshooting

### "OPENROUTER_API_KEY not found"

Set the `OPENROUTER_API_KEY` environment variable or use `--openrouter-key` flag.

### "PERPLEXITY_API_KEY not found"

Set the `PERPLEXITY_API_KEY` environment variable. The system will warn but continue (Perplexity research won't work).

### "Knowledge base not initialized"

Run `python main.py --init-only` to initialize the knowledge base.

### Agent not finding information

- Check that reports exist in the knowledge base
- Verify index files are present in `knowledge_base/_indexes/`
- Run `--init-only` to rebuild indexes

## Development

### Project Structure

```
stock-analysis/
├── src/
│   ├── chat_agent.py          # Chat Agent (outer layer)
│   ├── kb_manager_agent.py    # KB Manager Agent (middle layer)
│   ├── index_manager.py       # Index management
│   └── kb_tools/              # Knowledge base tools
│       ├── index_tools.py     # Index operations
│       ├── report_tools.py    # Report operations
│       └── perplexity_tool.py # Perplexity integration
├── docs/                      # Documentation
├── main.py                    # Entry point
└── requirements.txt           # Dependencies
```

## License

This project is part of the EDDID-AI workspace.
