<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" class="logo" width="120"/>

# Fundezy AI Trading Alert Telegram Bot - Developer Story

## 📋 Project Vision

Create a Telegram bot that demonstrates Fundezy's AI capabilities by allowing users to set up sophisticated trading alerts using natural language, showcasing the "Target-Price Alert Order" concept from our EDDID collaboration proposal.

## 🎯 Business Objective

This bot serves as a proof-of-concept for EDDID, demonstrating how Fundezy's AI can transform complex trading logic into simple, conversational interfaces that retail investors can easily understand and use.

## 👤 Complete User Journey

### Step 1: Discovery \& Authentication

**User Action:** Opens Telegram and searches for "Fundezy AI Alert Bot"
**Technical Implementation:**

- Bot registered via BotFather with username `@FundezybBot`
- Bot profile includes clear description and Fundezy branding
**User Experience:** Immediate access, no complex registration process


### Step 2: Welcome \& Feature Introduction

**User Action:** Starts conversation with `/start` command
**Bot Response:**

```
🤖 Welcome to Fundezy AI Alert Bot!

I help you set up smart trading alerts using plain English. 
No complex syntax needed!

✨ What I can do:
• Monitor HK stocks (700.HK, 0005.HK, etc.)
• Set MA crossover alerts (MA20 x MA200)
• Send instant notifications when conditions trigger
• Understand your requests in natural language

🚀 Ready to set your first alert?
Type something like: "Alert me when Tencent MA20 crosses MA200"

[Subscribe to Alerts] [Learn More] [Help]
```


### Step 3: Natural Language Alert Setup

**User Input:** `"Please help me set an alert for 700.HK, whenever the MA20 cross MA200"`
**AI Processing Behind the Scenes:**

1. **LLM Prompt Engineering:**
```python
system_prompt = """
You are a financial alert parsing assistant. Extract structured data from natural language trading requests.

Extract these fields:
- symbol: Stock symbol (e.g., "700.HK")
- stock_name: Company name if identifiable
- alert_type: Type of alert
- indicator: Technical indicator type
- parameters: Specific parameters for the indicator
- direction: "bullish", "bearish", or "both"

Input: {user_message}
Output: JSON format
"""
```

2. **LLM Response:**
```json
{
  "symbol": "700.HK",
  "stock_name": "Tencent Holdings",
  "alert_type": "technical_indicator", 
  "indicator": "moving_average_crossover",
  "short_period": 20,
  "long_period": 200,
  "direction": "both_directions"
}
```


### Step 4: AI Confirmation \& User Validation

**Bot Response:**

```
🧠 I understand your request:

📊 Stock: Tencent Holdings (700.HK)
📈 Alert: 20-day MA crosses 200-day MA
🎯 Direction: Both bullish and bearish crossovers
⚡ This typically signals major trend changes

Is this correct?

[✅ Yes, Set Alert] [❌ No, Let me rephrase] [ℹ️ Explain MA Crossover]
```


### Step 5: User Confirmation \& Storage

**User Action:** Clicks "Yes, Set Alert"
**Technical Implementation:**

```python
# Store alert in database
alert_data = {
    'user_id': telegram_user_id,
    'symbol': '700.HK',
    'alert_type': 'ma_crossover',
    'short_ma': 20,
    'long_ma': 200,
    'created_at': timestamp,
    'status': 'active'
}
```

**Bot Confirmation:**

```
✅ Alert Set Successfully!

🔔 You'll be notified when:
   Tencent (700.HK) MA20 crosses MA200

📱 Monitoring starts now
⏰ Checks every 15 minutes during market hours
🔕 You can disable anytime with /manage

[View My Alerts] [Set Another Alert]
```


### Step 6: Background Monitoring System

**Technical Architecture:**

```python
# Scheduled monitoring task (every 15 minutes)
def monitor_ma_crossovers():
    active_alerts = get_active_alerts()
    for alert in active_alerts:
        current_data = get_stock_data(alert.symbol)
        ma20 = calculate_ma(current_data, 20)
        ma200 = calculate_ma(current_data, 200)
        
        if crossover_detected(ma20, ma200, alert.last_check):
            send_alert_notification(alert.user_id, alert.symbol, crossover_details)
```


### Step 7: Alert Trigger \& Notification

**Scenario:** MA20 crosses above MA200 for Tencent
**Bot Notification:**

```
🚨 TRADING ALERT TRIGGERED!

📊 Tencent Holdings (700.HK)
📈 MA20 crossed ABOVE MA200
💰 Current Price: HK$352.80
📅 Time: 2025-08-02 14:30 HKT

🎯 Signal: Potential bullish trend starting
📈 This is typically considered a BUY signal

🔔 This alert will continue monitoring
💬 Reply STOP to disable this alert

[View Chart] [Set New Alert] [Manage Alerts]
```


## 🔧 Technical Implementation Details

### Core Technologies

```python
# Primary stack
- Python 3.9+
- python-telegram-bot (async)
- OpenAI GPT-4 API
- PostgreSQL database
- Redis for caching
- Celery for background tasks
- Docker for deployment
```


### Database Schema

```sql
-- Users table
CREATE TABLE users (
    telegram_id BIGINT PRIMARY KEY,
    username VARCHAR(255),
    created_at TIMESTAMP,
    subscription_status VARCHAR(50)
);

-- Alerts table  
CREATE TABLE alerts (
    id UUID PRIMARY KEY,
    user_id BIGINT REFERENCES users(telegram_id),
    symbol VARCHAR(20),
    alert_type VARCHAR(50),
    parameters JSONB,
    status VARCHAR(20),
    created_at TIMESTAMP,
    last_triggered TIMESTAMP
);
```


### LLM Integration Example

```python
import openai
from langchain.prompts import PromptTemplate

class AlertParser:
    def __init__(self):
        self.prompt = PromptTemplate(
            input_variables=["user_message"],
            template="""
            Parse this trading alert request into structured JSON:
            
            User Message: {user_message}
            
            Extract:
            - symbol (HK stock code)
            - indicator type  
            - parameters
            - direction
            
            Respond in JSON format only.
            """
        )
    
    def parse_alert(self, user_message):
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[{
                "role": "user", 
                "content": self.prompt.format(user_message=user_message)
            }]
        )
        return json.loads(response.choices[^0].message.content)
```


## 🏗️ Development Phases

### Phase 1: Bot Foundation (Week 1-2)

**Deliverables:**

- [x] Telegram bot registration and basic commands
- [x] User registration flow with database
- [x] Basic conversation handling
- [x] Help and information commands

**Key Code Components:**

```python
# Bot initialization
from telegram.ext import Application, CommandHandler, MessageHandler

app = Application.builder().token(BOT_TOKEN).build()
app.add_handler(CommandHandler("start", start_command))
app.add_handler(MessageHandler(filters.TEXT, handle_message))
```


### Phase 2: LLM Integration (Week 3-5)

**Deliverables:**

- [x] OpenAI API integration
- [x] Natural language parsing for trading alerts
- [x] Structured data extraction and validation
- [x] User confirmation workflows


### Phase 3: Market Data \& Monitoring (Week 6-8)

**Deliverables:**

- [x] Hong Kong stock market data feeds
- [x] Moving average calculation engine
- [x] Alert monitoring background tasks
- [x] Notification delivery system


### Phase 4: Production \& Polish (Week 9-10)

**Deliverables:**

- [x] Production deployment on cloud platform
- [x] Error handling and logging
- [x] User management features
- [x] Performance optimization


## 🎯 Demonstration Value for EDDID

### Proof of Concept Benefits

1. **AI Simplification:** Shows how complex trading logic becomes conversational
2. **Retail Accessibility:** Demonstrates appeal to mass market users
3. **Technical Feasibility:** Proves Fundezy's AI can integrate seamlessly
4. **Scalability Preview:** Shows foundation for full order type integration

### Success Metrics

- **User Engagement:** Daily active users and alert creation rate
- **AI Accuracy:** Percentage of correctly parsed natural language requests
- **Alert Reliability:** Accuracy of market data monitoring and notifications
- **User Satisfaction:** Feedback scores and retention rates


### Next Steps for EDDID Integration

Once proven successful, this bot's core technology can be integrated directly into EDDID's trading app as the "Target-Price Alert Order" feature, with the same natural language interface but connected to EDDID's order execution system.

**This story provides your development partner with everything needed to build a compelling demonstration of Fundezy's AI capabilities that directly supports your EDDID collaboration proposal.**

<div style="text-align: center">⁂</div>

[^1]: https://dev.to/catheryn/how-to-build-a-telegram-bot-in-5-simple-steps-4964

[^2]: https://arxiv.org/html/2502.01574v1

[^3]: https://www.tradingview.com/script/imTWtewf-MA20-EMA200-Crossover-Alert/

[^4]: https://core.telegram.org/bots/tutorial

[^5]: https://aclanthology.org/2024.paclic-1.91.pdf

[^6]: https://www.centralcharts.com/en/gm/1-learn/5-trading/14-strategy/283-trading-strategies-with-moving-averages

[^7]: https://core.telegram.org/bots/api

[^8]: https://www.linkedin.com/pulse/financial-modeling-algorithmic-trading-leveraging-llms-hastika-cheddy-9gt6f

[^9]: https://www.investopedia.com/articles/active-trading/052014/how-use-moving-average-buy-stocks.asp

[^10]: https://core.telegram.org

[^11]: https://quantra.quantinsti.com/glossary/Trading-based-on-News-Headlines-using-NLP

[^12]: https://tw.tradingview.com/scripts/supportandresistances/

[^13]: https://apidog.com/blog/beginners-guide-to-telegram-bot-api/

[^14]: https://www.interactivebrokers.com/campus/ibkr-quant-news/trading-using-llm-generative-ai-sentiment-analysis-in-finance-part-i/

[^15]: https://www.investopedia.com/terms/g/goldencross.asp

[^16]: https://www.youtube.com/watch?v=QkO7WSQbFbo

[^17]: https://arxiv.org/html/2412.19245v1

[^18]: https://blog.quantinsti.com/moving-average-trading-strategies/

[^19]: https://github.com/irazasyed/telegram-bot-sdk

[^20]: https://dl.acm.org/doi/10.1145/3677052.3698696

