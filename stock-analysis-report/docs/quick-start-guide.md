# Quick Start Guide

This guide will help you get started with the Stock Analysis Report Generator in minutes.

## Prerequisites

- Python 3.8 or higher
- Perplexity API key ([Get one here](https://www.perplexity.ai/settings/api))

## Installation Steps

### 1. Install Dependencies

```bash
cd stock-analysis
pip install -r requirements.txt
```

### 2. Set Up API Key

**Option A: Environment Variable (Recommended)**

```bash
# Linux/macOS
export PERPLEXITY_API_KEY="pplx-your-api-key-here"

# Windows (PowerShell)
$env:PERPLEXITY_API_KEY="pplx-your-api-key-here"

# Windows (Command Prompt)
setx PERPLEXITY_API_KEY "pplx-your-api-key-here"
```

**Option B: .env File**

Create a `.env` file in the `stock-analysis` directory:

```
PERPLEXITY_API_KEY=pplx-your-api-key-here
```

### 3. Verify Installation

Test that everything is set up correctly:

```bash
python stock_analyzer.py list
```

This should run without errors (it will show "No reports found" which is expected).

## Your First Report

Generate your first stock analysis report:

```bash
python stock_analyzer.py generate AAPL 2026-01-15
```

This will:
1. Connect to the Perplexity API
2. Generate a comprehensive analysis for Apple (AAPL) as of January 15, 2026
3. Save the report to `knowledge_base/AAPL/2026/AAPL_2026-01-15.json`

## Common Use Cases

### Generate Report with Focus Areas

```bash
python stock_analyzer.py generate MSFT 2026-01-15 --focus "cloud growth and AI monetization"
```

### Use Streaming (See Response in Real-Time)

```bash
python stock_analyzer.py generate TSLA 2026-01-15 --stream
```

### Use Different Model

```bash
# For deeper analysis
python stock_analyzer.py generate NVDA 2026-01-15 --model sonar-reasoning-pro

# For faster, lighter analysis
python stock_analyzer.py generate AAPL 2026-01-15 --model sonar
```

### Load an Existing Report

```bash
python stock_analyzer.py load AAPL 2026-01-15
```

### List All Reports

```bash
# List all reports
python stock_analyzer.py list

# List reports for a specific ticker
python stock_analyzer.py list --ticker AAPL
```

## Programmatic Usage

You can also use the generator in your own Python scripts:

```python
from stock_analyzer import StockAnalysisGenerator

# Initialize
generator = StockAnalysisGenerator()

# Generate report
report = generator.generate_analysis(
    ticker="AAPL",
    analysis_date="2026-01-15",
    focus_areas="cloud growth and AI monetization"
)

# Save it
generator.save_report(report)

# Load it later
loaded_report = generator.load_report("AAPL", "2026-01-15")
```

## Understanding the Report Structure

Each report contains:

- **meta**: Stock symbol, company name, exchange, report date
- **price_snapshot**: Current price and performance metrics
- **executive_summary**: Investment thesis and key points
- **company_overview**: Business description and strategy
- **fundamentals**: Financial performance analysis
- **industry_and_competition**: Sector context
- **catalysts**: Upcoming events that could impact the stock
- **risks**: Key downside risks
- **valuation**: Valuation analysis with bull/base/bear scenarios
- **informational_stance**: Investment recommendation

See `perplexity-stock-analysis-prompt.md` for the complete schema.

## Troubleshooting

### "Perplexity API key is required"

Make sure you've set the `PERPLEXITY_API_KEY` environment variable or created a `.env` file.

### "Rate limit exceeded"

You've hit the API rate limit (50 requests/minute for most models). Wait a minute and try again, or use a different model with a higher limit.

### "Authentication failed"

Check that your API key is correct and starts with `pplx-`. Verify it's active in your Perplexity account settings.

### "Response is not valid JSON"

The API sometimes returns responses that aren't perfectly formatted JSON. The tool will still save the raw content, but you may need to manually parse it.

## Next Steps

- Read the [full README](../README.md) for advanced features
- Review the [Perplexity API Guide](perplexity-api-guide.md) for API details
- Check the [Report Schema](perplexity-stock-analysis-prompt.md) for output format
- Explore `example_usage.py` for more code examples

## Cost Management

- **Sonar** (~$0.2-0.5/million tokens): Fast, economical for simple queries
- **Sonar Pro** (~$1-2/million tokens): Recommended for comprehensive analysis
- **Sonar Reasoning Pro** (~$3-5/million tokens): Advanced reasoning tasks

Monitor your usage in the Perplexity dashboard to stay within budget.

