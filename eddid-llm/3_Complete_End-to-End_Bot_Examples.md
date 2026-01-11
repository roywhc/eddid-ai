<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" class="logo" width="120"/>

# 3 Complete End-to-End Bot Examples

Based on the research and your requirements, here are three detailed examples showing the complete flow from user input to alert delivery:

## Example 1: MA Crossover Alert (Tencent - 700.HK)

### User Journey Flow

**Step 1: Bot Discovery \& Start**

```
User searches "Fundezy" in Telegram → Finds @FundezybBot → Clicks Start

Bot Response:
🤖 Welcome to Fundezy AI Alert Bot!

I help you set smart trading alerts using plain English.
No complex trading syntax needed!

✨ What I can do:
• Monitor HK stocks (700.HK, 0005.HK, etc.)  
• Technical indicators (MA crossovers, RSI, volume spikes)
• Send instant notifications when conditions trigger

🚀 Try saying: "Alert me when Tencent MA20 crosses MA200"

[Subscribe Now] [Examples] [Help]
```

**Step 2: Natural Language Input**

```
User types: "Please help me set an alert for 700.HK, whenever the MA20 cross MA200"

Bot thinking: "Processing your request..." (shows typing indicator)
```

**Step 3: AI Processing \& Confirmation**

```
Bot Response:
🧠 I understand your request:

📊 Stock: Tencent Holdings (700.HK)
📈 Alert Type: Moving Average Crossover  
📊 Condition: 20-day MA crosses 200-day MA
🎯 Direction: Both bullish and bearish crossovers
⚡ Significance: Major trend change signal

Current Status:
💰 Price: HK$352.80
📊 MA20: HK$348.50
📊 MA200: HK$341.20
📈 MA20 is currently ABOVE MA200

Is this correct?

[✅ Yes, Set Alert] [❌ Let me rephrase] [ℹ️ What is MA crossover?]
```

**Step 4: User Confirmation**

```
User clicks: "✅ Yes, Set Alert"

Bot Response:
✅ Alert Successfully Created!

🔔 Alert Details:
   Stock: Tencent Holdings (700.HK)
   Trigger: MA20 x MA200 crossover
   Monitoring: Every 15 minutes during market hours
   
📱 You'll receive notifications for:
   • Bullish crossover (MA20 crosses above MA200)
   • Bearish crossover (MA20 crosses below MA200)

🎯 Alert ID: #TEN001
💬 Manage alerts: /myalerts
🔕 Stop this alert: /stop TEN001

[Set Another Alert] [View All Alerts]
```

**Step 5: Background Monitoring**

```
(User closes Telegram - bot continues monitoring)

Backend Process:
- Every 15 minutes during HK market hours (09:30-16:00 HKT)
- Fetch 700.HK price data from Yahoo Finance API
- Calculate MA20 and MA200
- Check for crossover vs previous calculation
- Store results in database
```

**Step 6: Alert Trigger**

```
(2 days later - MA20 crosses below MA200)

Bot sends instant notification:
🚨 TRADING ALERT TRIGGERED!

📊 Tencent Holdings (700.HK)
📉 BEARISH CROSSOVER DETECTED
📈 MA20 crossed BELOW MA200

💰 Current Price: HK$338.20 (-4.1%)
📊 MA20: HK$342.10
📊 MA200: HK$344.50
📅 Time: 2025-08-02 14:45 HKT

🎯 Signal Interpretation:
   This typically indicates potential downtrend
   Consider this a technical SELL signal

🔔 Alert continues monitoring
💬 Reply STOP to disable: /stop TEN001

[View Chart] [Set New Alert] [Manage All Alerts]
```


## Example 2: RSI Oversold Alert (HSBC - 0005.HK)

### User Journey Flow

**Step 1: User Input**

```
User types: "I want to know when HSBC becomes oversold, maybe RSI below 30?"

Bot Response:
🧠 Perfect! I understand:

📊 Stock: HSBC Holdings (0005.HK)
📈 Indicator: RSI (Relative Strength Index)
🎯 Condition: RSI drops below 30 (oversold)
📊 Timeframe: Daily (standard for RSI)

Current Status:
💰 Price: HK$61.85
📊 RSI(14): 45.2 (Neutral zone)
📈 Status: Not oversold yet

This alert helps you spot potential buying opportunities!

[✅ Confirm Alert] [🔧 Adjust RSI Level] [ℹ️ Explain RSI]
```

**Step 2: User Customization**

```
User clicks: "🔧 Adjust RSI Level"

Bot Response:
⚙️ Customize Your RSI Alert:

Current Setting: RSI < 30
📊 Choose your RSI threshold:

[25 - More Extreme] [30 - Standard] [35 - Earlier Signal]

Or type a custom number (20-40): ___

💡 Tip: Lower numbers = fewer but stronger signals
```

**Step 3: Final Confirmation**

```
User clicks: "30 - Standard"

Bot Response:
✅ RSI Oversold Alert Created!

🔔 Alert Summary:
   Stock: HSBC Holdings (0005.HK)
   Trigger: RSI(14) drops below 30
   Current RSI: 45.2
   Check frequency: Every 4 hours during market days
   
🎯 Why this matters:
   RSI < 30 suggests stock may be oversold
   Often signals potential price recovery
   
🆔 Alert ID: #HSB002
📱 You'll get notified the moment RSI hits 30

[View RSI Chart] [Set Another Alert] [My Alerts]
```

**Step 4: Alert Triggers**

```
(5 days later - HSBC drops significantly)

Bot notification:
🚨 RSI OVERSOLD ALERT!

📊 HSBC Holdings (0005.HK)
📉 RSI DROPPED BELOW 30!

💰 Current Price: HK$57.40 (-7.2% today)
📊 RSI(14): 28.5 ⚠️ OVERSOLD
📅 Time: 2025-08-07 11:30 HKT

🎯 Trading Signal:
   Stock is technically oversold
   May indicate buying opportunity
   Consider waiting for RSI to recover above 30

📊 Recent Performance:
   1 day: -7.2%
   5 days: -12.8%
   
🔔 Monitoring continues
💬 Stop alert: /stop HSB002

[Technical Analysis] [Price History] [Set Recovery Alert]
```


## Example 3: Volume Spike Alert (Xiaomi - 1810.HK)

### User Journey Flow

**Step 1: Complex Natural Language Input**

```
User types: "Can you watch Xiaomi stock and tell me if there's unusual high volume today, like maybe 2x normal volume or something?"

Bot Response:
🧠 Great idea for catching breaking news! Let me set this up:

📊 Stock: Xiaomi Corp (1810.HK)  
📈 Alert Type: Volume Spike Detection
📊 Trigger: Volume > 2x daily average
📊 Timeframe: Real-time monitoring

Current Status:
💰 Price: HK$18.25
📊 Today's Volume: 45.2M shares  
📊 20-day Avg Volume: 52.1M shares
📊 Volume Ratio: 0.87x (Below average)

Volume spikes often indicate:
• Breaking news or announcements  
• Institutional buying/selling
• Technical breakouts

[✅ Confirm Alert] [🔧 Adjust Multiplier] [ℹ️ Why Volume Matters?]
```

**Step 2: User Fine-tuning**

```
User clicks: "🔧 Adjust Multiplier"

Bot Response:
⚙️ Customize Volume Spike Threshold:

Current: 2.0x average volume
📊 Choose sensitivity:

[1.5x - More Alerts] [2.0x - Balanced] [3.0x - Only Major Spikes]

📊 Historical Context (1810.HK):
   • 1.5x triggered 12 times last month
   • 2.0x triggered 4 times last month  
   • 3.0x triggered 1 time last month

Choose your preference: ___
```

**Step 3: Alert Confirmation**

```
User clicks: "2.0x - Balanced"

Bot Response:
✅ Volume Spike Alert Activated!

🔔 Monitoring Setup:
   Stock: Xiaomi Corp (1810.HK)
   Trigger: Volume exceeds 2.0x daily average
   Current threshold: >104.2M shares today
   Check: Every 30 minutes during market hours

🎯 What to expect:
   Alert when unusual trading activity detected
   Useful for catching news-driven moves
   
🆔 Alert ID: #XIA003
📊 Current volume: 45.2M / 104.2M threshold

[Real-time Volume] [News Feed] [Technical Chart]
```

**Step 4: Volume Spike Triggers**

```
(Same afternoon - Major news breaks)

Bot urgent notification:
🚨 VOLUME SPIKE ALERT!

📊 Xiaomi Corp (1810.HK)
🔥 MASSIVE VOLUME DETECTED!

💰 Price: HK$19.75 (+8.2% today)
📊 Volume: 156.8M shares (3.0x average!) 
📊 Threshold: 104.2M (EXCEEDED by 50%!)
📅 Time: 2025-08-02 15:15 HKT

⚡ Possible Triggers:
   • Breaking news announcement
   • Earnings surprise  
   • Major partnership news
   • Technical breakout

📊 Trading Activity:
   • Volume in last hour: 89.2M
   • Price movement: +8.2%
   • Trend: Strong bullish momentum

🔍 Recommend checking news sources immediately!

[Latest News] [Price Chart] [Set Follow-up Alert]
```

**Step 5: Follow-up Intelligence**

```
(Bot automatically provides context 10 minutes later)

📰 CONTEXT UPDATE - Xiaomi (1810.HK)

🔍 News Analysis Found:
   "Xiaomi announces major EV partnership deal"
   Published: 15:05 HKT (10 min ago)
   
📊 Market Reaction:
   • Volume: 178.5M (3.4x average)
   • Price: HK$20.10 (+10.1%)
   • Buyers vs Sellers: 75% buying pressure

🎯 Alert Performance:
   ✅ Detected spike 10 minutes after news
   ✅ Price gained +2.4% since alert
   ✅ Your alert was faster than most retail traders

🔔 Volume monitoring continues
💬 Manage alert: /stop XIA003

This demonstrates how our AI helps you catch opportunities early!
```


## Technical Backend Summary

### Common Backend Processing for All Examples:

1. **LLM Processing Pipeline:**

```python
user_input → GPT-4 analysis → structured JSON → validation → confirmation
```

2. **Market Data Integration:**

```python
# Real-time data fetching every 15-30 minutes
yahoo_finance_api → price/volume/indicators → alert_logic → notification_trigger
```

3. **Database Schema:**

```sql
alerts_table: user_id, symbol, alert_type, parameters, status, last_check
notifications_table: alert_id, trigger_time, message, delivery_status
```

4. **Notification Delivery:**

```python
trigger_detected → format_message → telegram_bot_api → push_notification
```


These examples show how Fundezy's AI transforms complex trading concepts into conversational, accessible experiences that any retail investor can understand and use effectively.

<div style="text-align: center">⁂</div>

[^1]: https://www.luxalgo.com/blog/rsi-overbought-and-oversold-signals-explained/

[^2]: https://help.trendspider.com/kb/indicators/volume-spikes

[^3]: https://docsbot.ai/prompts/business/price-breakout-alert

[^4]: https://www.investopedia.com/articles/active-trading/042114/overbought-or-oversold-use-relative-strength-index-find-out.asp

[^5]: https://www.incrediblecharts.com/technical/volume_spikes.php

[^6]: https://www.tradingview.com/script/V4aR7J5d-Custom-Previous-High-Low-Breakout-Alerts/

[^7]: https://www.earnforex.com/indicators/rsi-alert/

[^8]: https://stockbeep.com/blog/post/how-to-find-unusual-volume-stocks-in-real-time

[^9]: https://docs.trdr.io/key-features-and-indicators/alerts/range-breakout-alert-example

[^10]: https://stockalarm.io/alerts/rsi-stock-alerts

[^11]: https://www.investopedia.com/articles/technical/02/010702.asp

[^12]: https://www.insiderfinance.io/learn/course/trading-tools/lesson/algo-breakout-alerts

[^13]: https://tw.tradingview.com/scripts/rsi_alert/

[^14]: https://www.tradingview.com/script/d2j45xSl-Volume-Spike-Alert-Overlay/

[^15]: https://tw.tradingview.com/script/vXSeEdre-Bullish-and-Bearish-Breakout-Alert-for-Gold-Futures-Pullback/

[^16]: https://www.marketindex.com.au/scans/rsi-oversold

[^17]: https://www.trade-ideas.com/help/alert/VS1/

[^18]: https://www.trade-ideas.com/help/alert/ORU2/

[^19]: https://www.forexfactory.com/thread/578661-looking-for-rsi-indicator-with-pop-up-alert

[^20]: https://stockalarm.io/alerts/volume-stock-alerts

