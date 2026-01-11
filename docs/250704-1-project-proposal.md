# Fundezy x EDDID: AI Trading Agent Collaboration Proposal
*Inspired by Trading Agents AI*

## Proposal Overview (Simple Point Form)

- Develop a suite of 7 specialized AI agents, each focusing on a unique aspect of stock/asset analysis.
- Each agent will analyze different data sources and provide clear, actionable insights.
- The agents will work together, with later agents building on the outputs of earlier ones, to deliver a comprehensive, explainable trading recommendation.

## The 7 AI Agents (Conceptual Overview)

### 1. Market AI Agent
Studies the trading market and industry for a specific stock/asset.
Outputs key technical facts (e.g., RSI, trading volume, MACD).

### 2. Social Media AI Agent
Analyzes social media discussions about the stock/asset and its industry.
Outputs a "hotness" rating based on discussion frequency and timing.

### 3. News AI Agent
Reviews news related to the stock/asset and its industry (excluding financial reports and price changes).
Outputs a list of relevant news facts (e.g., company activities, director news).

### 4. Fundamentals AI Agent
Examines financial fundamentals of the stock/asset and its industry.
Outputs key accounting facts (e.g., profit margin, cash on hand).

### 5. Bullish AI Agent
Aggregates facts from agents 1-4 to identify and list bullish (positive) evidence.

### 6. Bearish AI Agent
Aggregates facts from agents 1-4 to identify and list bearish (negative) evidence.

### 7. Trader AI Agent
Compares bullish and bearish evidence from agents 5 and 6.
Provides a fact-based trading conclusion.

## MVP Development Plan

### Phase 1: MVP (Minimum Viable Product)

- Start with 3 core agents + 1 decision agent:
  - News AI Agent
  - Bullish AI Agent
  - Bearish AI Agent
  - Trader AI Agent

- Integrate these agents into a simple workflow:
  - News agent gathers and summarizes news facts.
  - Bullish and Bearish agents extract positive/negative signals from news.
  - Trader agent compares both and gives a clear, explainable trading suggestion.

- Deliver the MVP as an API for EDDID to integrate into their app.

### Phase 2: Expansion

- Add the remaining agents:
  - Market AI Agent
  - Social Media AI Agent
  - Fundamentals AI Agent

- Enhance the system to provide a more holistic, multi-source analysis.

- Continue to deliver all insights and recommendations via API for seamless integration.

## Summary

This proposal leverages the multi-agent, explainable AI approach inspired by Trading Agents AI. By starting with a focused MVP and expanding in phases, Fundezy and EDDID can quickly deliver value to users while building towards a comprehensive, state-of-the-art trading assistant.

*Let me know if you want this in a more formal document or need slides/visuals!*