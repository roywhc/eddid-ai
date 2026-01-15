# Stock Analysis Report Generator

A Python tool for generating comprehensive stock analysis reports using the Perplexity API and storing them in a local knowledge base.

## Features

- **AI-Powered Analysis**: Uses Perplexity's Sonar models to generate detailed stock analysis reports
- **Structured Output**: Generates reports in strict JSON format following a comprehensive schema
- **Local Knowledge Base**: Stores reports in an organized directory structure for easy retrieval
- **CLI Interface**: Simple command-line interface for generating, loading, and listing reports
- **Streaming Support**: Optional streaming responses for real-time feedback

## Installation

1. **Install dependencies**:
```bash
pip install -r requirements.txt
```

2. **Set up API key**:
   - Get your Perplexity API key from [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)
   - Set it as an environment variable:
     ```bash
     # Linux/macOS
     export PERPLEXITY_API_KEY="pplx-your-api-key-here"
     
     # Windows
     setx PERPLEXITY_API_KEY "pplx-your-api-key-here"
     ```
   - Or create a `.env` file in the project root:
     ```
     PERPLEXITY_API_KEY=pplx-your-api-key-here
     ```

## Usage

### Generate a Report

Generate a new stock analysis report:

```bash
python stock_analyzer.py generate AAPL 2026-01-15
```

With optional focus areas:

```bash
python stock_analyzer.py generate MSFT 2026-01-15 --focus "cloud growth and AI monetization"
```

With streaming output:

```bash
python stock_analyzer.py generate TSLA 2026-01-15 --stream
```

Using a different model:

```bash
python stock_analyzer.py generate AAPL 2026-01-15 --model sonar-reasoning-pro
```

Generate without saving (for testing):

```bash
python stock_analyzer.py generate AAPL 2026-01-15 --no-save
```

### Load an Existing Report

```bash
python stock_analyzer.py load AAPL 2026-01-15
```

### List All Reports

List all reports:

```bash
python stock_analyzer.py list
```

Filter by ticker:

```bash
python stock_analyzer.py list --ticker AAPL
```

## Knowledge Base Structure

Reports are stored in the following directory structure:

```
knowledge_base/
├── AAPL/
│   └── 2026/
│       └── AAPL_2026-01-15.json
├── MSFT/
│   └── 2026/
│       └── MSFT_2026-01-15.json
└── HKEX_9988/
    └── 2026/
        └── HKEX_9988_2026-01-15.json
```

Each report file contains:
- Ticker symbol and analysis date
- Generated timestamp
- Model used
- Complete analysis in JSON format
- Token usage statistics

## Report Format

Reports follow a comprehensive JSON schema defined in `docs/perplexity-stock-analysis-prompt.md`, including:

- **meta**: Basic stock and report information
- **price_snapshot**: Current price and performance metrics
- **executive_summary**: Investment thesis and key points
- **company_overview**: Business description and strategy
- **fundamentals**: Financial performance analysis
- **industry_and_competition**: Sector context and competitive positioning
- **catalysts**: Near-term and medium-term catalysts
- **risks**: Key downside risks
- **valuation**: Valuation analysis and scenarios
- **informational_stance**: Investment recommendation

## Available Models

- `sonar`: Lightweight, fast search (50 RPM)
- `sonar-pro`: Deep search and reasoning (50 RPM) - **Recommended**
- `sonar-reasoning`: Real-time reasoning search (50 RPM)
- `sonar-reasoning-pro`: Advanced reasoning (50 RPM)
- `sonar-deep-research`: In-depth research reports (5 RPM)

See `docs/perplexity-api-guide.md` for detailed model information.

## Python API

You can also use the `StockAnalysisGenerator` class programmatically:

```python
from stock_analyzer import StockAnalysisGenerator

# Initialize generator
generator = StockAnalysisGenerator(knowledge_base_dir="./knowledge_base")

# Generate a report
report = generator.generate_analysis(
    ticker="AAPL",
    analysis_date="2026-01-15",
    focus_areas="cloud growth and AI monetization",
    model="sonar-pro"
)

# Save to knowledge base
generator.save_report(report)

# Load an existing report
existing_report = generator.load_report("AAPL", "2026-01-15")

# List all reports
all_reports = generator.list_reports()
```

## Error Handling

The tool includes comprehensive error handling for:
- Rate limit errors (with retry-after information)
- Authentication errors
- API status errors
- JSON parsing errors (falls back to raw content storage)

## Rate Limits

Perplexity API rate limits:
- Most Sonar models: 50 requests per minute
- `sonar-deep-research`: 5 requests per minute

The tool will display rate limit information if exceeded.

## Cost Considerations

- **Sonar**: ~$0.2–0.5 / million tokens (most economical)
- **Sonar Pro**: ~$1–2 / million tokens
- **Sonar Reasoning Pro**: ~$3–5 / million tokens

Use `max_tokens` parameter and choose the smallest suitable model to optimize costs.

## Documentation

- **API Guide**: `docs/perplexity-api-guide.md` - Complete Perplexity API integration guide
- **Prompt Schema**: `docs/perplexity-stock-analysis-prompt.md` - Detailed report format specification

## Troubleshooting

### Authentication Errors

- Verify API key format (should start with `pplx-`)
- Check if the key is expired or revoked
- Ensure environment variable is set correctly

### Rate Limit Errors

- Reduce request frequency
- Use exponential backoff (implemented in the tool)
- Consider upgrading your Perplexity plan

### JSON Parsing Errors

If the API response is not valid JSON, the tool will:
- Store the raw content
- Add a `parse_error` field to the report
- Continue processing (no crash)

## License

This project is part of the EDDID-AI workspace.

