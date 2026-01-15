# Review: Correlated Stock Information in Prompt and Reports

## Executive Summary

After reviewing the prompt (`perplexity-stock-analysis-prompt.md`) and a generated report (`AAPL_2026-01-11.json`), I found that **correlated stock information is partially included but could be significantly enhanced**.

## Current State Analysis

### What's Currently Included

1. **Competitor Mentions** (in `industry_and_competition.key_competitors`):
   - The report mentions competitors: Samsung Electronics, Alphabet (Google), Microsoft
   - Provides qualitative descriptions of market position and relative strengths
   - **Missing**: Ticker symbols, stock prices, performance metrics

2. **Peer Comparison** (in `price_snapshot.relative_to_peers`):
   - Text description: "Over the past year Apple has underperformed several large-cap tech peers such as major semiconductor and cloud names, many of which posted 40%+ gains versus Apple's high-single‑digit return."
   - **Missing**: Specific ticker symbols, quantitative comparisons, correlation data

3. **Index Comparison** (in `price_snapshot.relative_to_index`):
   - Mentions S&P 500 and Nasdaq 100
   - **Missing**: Ticker symbols for indices, specific performance numbers

### What's Missing

1. **Structured Peer Stock Data**:
   - No ticker symbols for competitors
   - No current prices for peer stocks
   - No performance metrics (1d, 1m, 1y returns) for peers
   - No correlation coefficients

2. **Sector/Industry ETFs**:
   - No mention of relevant sector ETFs (e.g., XLK for tech, QQQ for Nasdaq)
   - No comparison to sector performance

3. **Correlation Analysis**:
   - No correlation coefficients with major indices
   - No correlation with key competitors
   - No beta calculation or mention

4. **Quantitative Peer Comparison**:
   - The `relative_to_peers` field is only text, not structured data
   - No side-by-side metrics table

## Recommendations

### Option 1: Enhance Existing Fields (Minimal Change)

Add structured data to existing fields without changing the schema:

**Enhance `price_snapshot.relative_to_peers`**:
```json
"relative_to_peers": {
  "text": "Brief comparison to sector average or key competitors.",
  "peer_stocks": [
    {
      "ticker": "MSFT",
      "company_name": "Microsoft Corporation",
      "current_price": 450.25,
      "return_1y_pct": 42.3,
      "correlation_1y": 0.78
    },
    {
      "ticker": "GOOGL",
      "company_name": "Alphabet Inc.",
      "current_price": 185.50,
      "return_1y_pct": 38.7,
      "correlation_1y": 0.72
    }
  ],
  "sector_etf": {
    "ticker": "XLK",
    "name": "Technology Select Sector SPDR Fund",
    "return_1y_pct": 35.2
  }
}
```

### Option 2: Add New Field (Recommended)

Add a new top-level field `correlated_stocks` to the schema:

```json
{
  "correlated_stocks": {
    "peer_comparison": [
      {
        "ticker": "MSFT",
        "company_name": "Microsoft Corporation",
        "current_price": 450.25,
        "market_cap": "3.4T",
        "returns": {
          "return_1d_pct": 0.45,
          "return_1m_pct": -5.2,
          "return_1y_pct": 42.3
        },
        "correlation_1y": 0.78,
        "comparison_note": "Similar market cap and tech focus, but stronger cloud/AI narrative"
      }
    ],
    "sector_etfs": [
      {
        "ticker": "XLK",
        "name": "Technology Select Sector SPDR Fund",
        "current_price": 245.30,
        "return_1y_pct": 35.2,
        "weight_in_etf_pct": 23.5
      },
      {
        "ticker": "QQQ",
        "name": "Invesco QQQ Trust",
        "current_price": 485.20,
        "return_1y_pct": 28.7,
        "weight_in_etf_pct": 12.3
      }
    ],
    "correlation_metrics": {
      "beta_vs_sp500": 1.15,
      "correlation_vs_sp500_1y": 0.82,
      "correlation_vs_nasdaq_1y": 0.89,
      "correlation_vs_sector_1y": 0.91
    }
  }
}
```

### Option 3: Enhance Competitor Section

Update `industry_and_competition.key_competitors` to include stock data:

```json
"key_competitors": [
  {
    "name": "Microsoft",
    "ticker": "MSFT",
    "market_position": "Key competitor in personal computing, productivity software, and cloud services",
    "relative_strength": "Stronger enterprise and cloud presence",
    "stock_data": {
      "current_price": 450.25,
      "market_cap": "3.4T",
      "return_1y_pct": 42.3,
      "pe_ratio": 38.5
    },
    "correlation_1y": 0.78
  }
]
```

## Prompt Enhancement Suggestions

### Add to Analysis Workflow (Section 4):

Add step: **"Identify Correlated Stocks**: Research and include key peer stocks, sector ETFs, and correlation metrics with major indices."

### Add to Quality Standards:

- **Correlation Data**: Include ticker symbols and quantitative metrics for at least 3-5 peer stocks
- **Sector Context**: Include relevant sector ETF performance for comparison
- **Quantitative Comparisons**: Provide specific numbers, not just qualitative descriptions

### Add Explicit Instruction:

Add a new section or enhance existing sections:

```markdown
### Correlated Stocks Analysis

When analyzing a stock, include:
1. **Peer Stocks**: Identify 3-5 key competitors or similar companies with their ticker symbols
2. **Stock Metrics**: For each peer, include current price, 1-year return, and market cap
3. **Correlation**: Note correlation coefficient with the analyzed stock (if available)
4. **Sector ETFs**: Include relevant sector/industry ETF tickers and their performance
5. **Beta**: Include beta vs S&P 500 if available

Example:
- For AAPL: Include MSFT, GOOGL, AMZN, META as tech peers
- Include XLK (Tech ETF) and QQQ (Nasdaq ETF) for sector context
- Note correlation with SPY (S&P 500 ETF)
```

## Implementation Priority

### High Priority (Should Add):
1. ✅ Add ticker symbols to competitor mentions
2. ✅ Include sector ETF tickers and performance
3. ✅ Add quantitative peer comparison metrics

### Medium Priority (Nice to Have):
1. ⚠️ Add correlation coefficients
2. ⚠️ Include beta calculation
3. ⚠️ Add market cap comparisons

### Low Priority (Future Enhancement):
1. ⏳ Historical correlation analysis
2. ⏳ Sector rotation analysis
3. ⏳ Relative strength rankings

## Example Enhanced Report Structure

Here's how the enhanced report could look:

```json
{
  "price_snapshot": {
    "current_price": 259.37,
    "relative_to_index": "Over the last 12 months Apple's roughly 9–10% gain has lagged major U.S. equity benchmarks such as the S&P 500 (SPY: +18.5%) and Nasdaq 100 (QQQ: +22.3%).",
    "relative_to_peers": {
      "summary": "Apple underperformed large-cap tech peers",
      "peers": [
        {"ticker": "MSFT", "return_1y_pct": 42.3, "current_price": 450.25},
        {"ticker": "GOOGL", "return_1y_pct": 38.7, "current_price": 185.50},
        {"ticker": "NVDA", "return_1y_pct": 145.2, "current_price": 1250.00}
      ],
      "sector_etf": {"ticker": "XLK", "return_1y_pct": 35.2}
    }
  },
  "correlated_stocks": {
    "beta_vs_sp500": 1.15,
    "correlation_vs_sp500_1y": 0.82,
    "top_correlated_peers": [
      {"ticker": "MSFT", "correlation": 0.78},
      {"ticker": "GOOGL", "correlation": 0.72},
      {"ticker": "AMZN", "correlation": 0.68}
    ]
  }
}
```

## Conclusion

The current prompt and reports include **qualitative competitor information** but lack **structured, quantitative correlated stock data**. Adding ticker symbols, performance metrics, and correlation data would significantly enhance the analytical value of the reports.

**Recommended Action**: Implement Option 2 (add new `correlated_stocks` field) as it provides the most comprehensive enhancement without breaking existing reports.

