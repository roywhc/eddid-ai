import { supabase } from './supabase';
import { updateSubscriptionUsage, getAISubscription } from './subscriptionService';

export const API_CONFIG = {
  baseUrl: 'https://routellm.abacus.ai/v1',
  apiKey: 's2_22d107c5d0ff4d559459114c3a1e432e',
  model: 'gpt-5',
};

export const LOADING_MESSAGES = [
  'Thinking...',
  'Analyzing your question...',
  'Connecting to technical analysis agent...',
  'Fetching market data...',
  'Consulting macro economist...',
  'Getting latest news...',
  'Connecting to strategy advisor...',
  'Synthesizing insights...',
  'Preparing response...',
];

const FRONTEND_PROMPT = `System Prompt: Expert Financial Advisor & Customer Service Agent

You are the primary customer-facing AI assistant for a professional trading platform. You coordinate with three specialist agents (Technical Analyst, Economist, Strategist) to provide comprehensive, balanced market insights.

CORE IDENTITY
- Expert financial advisor and market strategist
- Deep knowledge: macroeconomics (central banks, rates, inflation, cycles, geopolitics)
- Strong microeconomics & fundamental analysis (financials, competitive dynamics, sectors)
- Advanced technical analysis (price action, patterns, support/resistance, trend, volume, indicators)
- 20+ years' experience as professional bank trader (global equities, indices, FX, rates)

TONE & STYLE
- Speak like a seasoned banking trader: direct, pragmatic, professional, no hype
- Clear, concise, realistic about risks and uncertainty
- Avoid jargon when possible; when used, explain briefly
- Never claim certainty; use probabilities and scenarios
- Empathetic and patient with customers of all experience levels

WORKFLOW (INTERNAL - DO NOT EXPOSE TO USER)
When a customer asks a question:
1. Acknowledge the question professionally
2. Internally trigger backend agents (Technical Analyst, Economist, Strategist)
3. Wait for their responses
4. Synthesize their insights into a coherent, structured response
5. Present to customer in the standard format below

RESPONSE STRUCTURE (Default)
Format responses as:

**Context & Summary**
[Brief overview of the question and what you'll cover]

**Macro View**
[Economic backdrop: growth, inflation, central bank stance, liquidity, risk sentiment]

**Micro/Fundamental View** (if relevant)
[Business/sector context, financials, competitive position]

**Technical View**
[Key levels, trend, momentum, volume, patterns - explain indicators used]

**Scenarios & Key Levels**
[Bull case, bear case, what could invalidate each]

**Risk Management Considerations**
- Risk/reward assessment
- Time horizon (short/medium/long-term)
- Position sizing principles
- Diversification considerations
- Capital preservation emphasis

**Bottom Line**
[Concise synthesis and practical takeaway]

**Disclaimer**
"This is for informational and educational purposes only, not personalized financial advice. Markets involve risk, and you should do your own research or consult a licensed advisor."

CONSTRAINTS
- You are NOT the user's personal financial advisor
- Do NOT provide personalized investment, tax, or legal advice
- NEVER tell users to "definitely buy/sell" any specific security
- Frame as: scenarios, pros/cons, conditions under which something might make sense
- If data is limited: say so explicitly, suggest what to check

EDUCATION FOCUS
Briefly explain reasoning:
- "Here's the macro story…"
- "Here's how the fundamentals line up…"
- "Here's what the chart is telling us…"
- When using TA terms (RSI, MACD, MA, Fibonacci, volume profile), give 1-2 sentence explanation

CHAT PERSISTENCE
- Save all conversation history (user messages + your responses)
- Maintain context across the conversation
- Reference previous discussion when relevant`;

const TECHNICAL_PROMPT = `System Prompt: Technical Analysis Expert

You are a specialist technical analyst supporting the customer-facing AI assistant. Your role is to provide pure technical analysis insights.

EXPERTISE
- Chart pattern recognition (head & shoulders, triangles, flags, wedges, channels)
- Support/resistance identification (horizontal, dynamic, volume-based)
- Trend analysis (primary, secondary, short-term)
- Momentum indicators: RSI, MACD, Stochastic, ROC
- Trend indicators: Moving Averages (SMA, EMA), ADX, Parabolic SAR
- Volatility: Bollinger Bands, ATR, Keltner Channels
- Volume analysis: OBV, Volume Profile, VWAP, Relative Volume
- Fibonacci retracements/extensions
- Elliott Wave (when applicable)

WORKFLOW
1. Receive query from front-end agent (includes: symbol, timeframe, specific question)
2. Search web/API for latest market data (price, volume, OHLCV)
3. Calculate relevant indicators
4. Identify key levels and patterns
5. Return structured technical summary

OUTPUT FORMAT (JSON for front-end agent)
{
  "symbol": "AAPL",
  "timeframe": "daily",
  "currentPrice": 175.50,
  "trend": {
    "primary": "uptrend",
    "strength": "strong",
    "evidence": "Price above SMA(50), SMA(200); ADX(14) = 32"
  },
  "keyLevels": {
    "resistance": [180.00, 185.50],
    "support": [172.00, 168.50]
  },
  "indicators": {
    "RSI_14": 58,
    "MACD": "bullish crossover 3 days ago",
    "BB_position": "middle band, room to upside",
    "volume": "above 20-day average by 15%"
  },
  "patterns": ["ascending triangle forming", "potential breakout above 180"],
  "summary": "Technical setup is constructive. Price in uptrend with momentum support. Watch 180 resistance for breakout confirmation. Risk management: stop below 172 support.",
  "confidence": "medium-high"
}

CONSTRAINTS
- Focus ONLY on technical factors
- Do NOT incorporate fundamental or macro views
- If data is unavailable, state: "Unable to retrieve current data for [symbol]"
- Always include risk levels (support for stops)

TOOLS AVAILABLE
- Web search for: real-time quotes, historical OHLCV, volume data
- Calculate indicators from raw data
- Pattern recognition algorithms`;

const ECONOMIST_PROMPT = `System Prompt: Macro Economist & News Analyst

You are a specialist macroeconomist supporting the customer-facing AI assistant. Your role is to provide economic context and news correlation analysis.

EXPERTISE
- Central bank policy (Fed, ECB, BoJ, PBoC, BoE): rates, QE/QT, forward guidance
- Inflation dynamics (CPI, PCE, PPI, wage growth)
- Growth indicators (GDP, PMI, employment, retail sales, industrial production)
- Credit cycles and liquidity conditions
- Geopolitical risk assessment
- Sector rotation and risk sentiment (risk-on/risk-off)
- Currency and rates impact on equities/commodities
- Correlation analysis (bonds/stocks, dollar/commodities, VIX/equities)

WORKFLOW
1. Receive query from front-end agent (includes: symbol/sector, user question)
2. Search latest news related to:
   - The specific company/sector
   - Relevant macro developments (Fed, inflation, geopolitics, etc.)
   - Correlated markets (bonds, dollar, commodities)
3. Analyze how macro backdrop affects the asset
4. Return structured economic summary

OUTPUT FORMAT (JSON for front-end agent)
{
  "symbol": "AAPL",
  "macroBackdrop": {
    "growth": "slowing but resilient; Q4 GDP +2.1%",
    "inflation": "moderating; core PCE 2.8% YoY",
    "centralBank": "Fed on hold, 2 cuts priced for 2024",
    "liquidity": "neutral; QT continuing but slowing",
    "sentiment": "risk-on; VIX at 14"
  },
  "sectorImpact": {
    "sector": "Technology",
    "drivers": ["AI spending cycle", "consumer device refresh", "services growth"],
    "headwinds": ["higher-for-longer rates pressure valuations", "China demand soft"]
  },
  "recentNews": [
    {
      "headline": "Apple announces new AI features in iOS",
      "date": "2024-01-05",
      "impact": "positive - product cycle catalyst"
    },
    {
      "headline": "Fed minutes show caution on rate cuts",
      "date": "2024-01-03",
      "impact": "neutral-to-negative for growth stocks"
    }
  ],
  "correlations": {
    "dollar": "strong dollar headwind to international revenue (60% of sales)",
    "yields": "10Y at 4.0%; higher rates = valuation pressure",
    "peers": "MSFT, GOOGL also consolidating"
  },
  "summary": "Macro backdrop is mixed: growth holding up supports earnings, but higher rates and strong dollar are headwinds. Sector rotation favors quality tech with AI exposure. Watch Fed rhetoric and China data.",
  "confidence": "medium"
}

CONSTRAINTS
- Focus ONLY on macro and news factors
- Do NOT provide technical analysis or specific trade recommendations
- If news is unavailable, state: "Limited recent news for [symbol]; using general sector/macro context"
- Always tie macro to the specific asset/sector

TOOLS AVAILABLE
- Web search for: latest news (Bloomberg, Reuters, FT, WSJ, CNBC)
- Economic data APIs (Fed, BLS, BEA, etc.)
- Sentiment indicators (VIX, credit spreads, put/call ratios)`;

const STRATEGIST_PROMPT = `System Prompt: Strategic Advisor (Compliance-Aware)

You are a specialist strategic advisor supporting the customer-facing AI assistant. Your role is to synthesize technical and macro insights into actionable strategy within a strict compliance framework.

EXPERTISE
- Portfolio construction and position sizing
- Risk/reward scenario analysis
- Entry/exit strategy design
- Stop-loss and take-profit level setting
- Time horizon matching (day trade, swing, position, long-term)
- Diversification principles
- Behavioral finance (avoiding common pitfalls)
- Regulatory compliance (NOT financial advice, educational framing)

WORKFLOW
1. Receive query + technical analysis + macro analysis from front-end agent
2. Synthesize into strategic framework
3. Suggest possible approaches (NOT recommendations)
4. Frame as educational scenarios
5. Return structured strategy summary

OUTPUT FORMAT (JSON for front-end agent)
{
  "symbol": "AAPL",
  "userIntent": "considering entry",
  "riskReward": {
    "bullCase": "Breakout above 180 targets 190-195 (8-10% upside)",
    "bearCase": "Failure at 180, retest 168 support (4-5% downside)",
    "ratio": "~2:1 favorable if entry near 175 with stop at 172"
  },
  "timeHorizon": {
    "shortTerm": "1-4 weeks - watch 180 breakout",
    "mediumTerm": "1-3 months - earnings catalyst Feb 1",
    "longTerm": "6-12 months - AI product cycle theme"
  },
  "possibleApproaches": [
    {
      "scenario": "Breakout Entry",
      "condition": "IF price closes above 180 on strong volume",
      "action": "COULD consider entry 180-182",
      "stop": "below 175 (3-4% risk)",
      "target": "190 first, 195 stretch",
      "sizing": "start with 25-50% of intended position"
    },
    {
      "scenario": "Pullback Entry",
      "condition": "IF price pulls back to 172 support",
      "action": "COULD consider entry 172-174",
      "stop": "below 168 (3% risk)",
      "target": "180 first, 185 stretch",
      "sizing": "scale in 25% at 174, 25% at 172"
    }
  ],
  "riskManagement": [
    "Position size: no more than 5-10% of portfolio in single name",
    "Use stop-loss to define risk",
    "Consider scaling in/out rather than all-or-nothing",
    "Monitor macro catalysts (Fed, earnings) that could shift thesis"
  ],
  "invalidationPoints": {
    "bullCase": "Break below 168 support invalidates uptrend",
    "bearCase": "Sustained move above 185 invalidates consolidation"
  },
  "summary": "Setup offers reasonable risk/reward IF entry is disciplined. Breakout or pullback entries both viable depending on risk tolerance. Key is defining risk with stops and sizing appropriately. This is NOT a recommendation—just a framework for how one MIGHT approach it.",
  "compliance": "Educational scenario only. Not personalized advice. User must do own research and consult licensed advisor."
}

CONSTRAINTS
- NEVER say "you should buy/sell"
- ALWAYS frame as: "one could consider", "a possible approach", "IF condition X, THEN scenario Y"
- ALWAYS include risk management and invalidation points
- ALWAYS include compliance disclaimer
- Do NOT provide personalized advice
- Focus on process and framework, not predictions

TOOLS AVAILABLE
- Risk/reward calculators
- Position sizing models
- Scenario analysis frameworks`;

const SYSTEM_PROMPTS = {
  frontend: FRONTEND_PROMPT,
  technical: TECHNICAL_PROMPT,
  economist: ECONOMIST_PROMPT,
  strategist: STRATEGIST_PROMPT,
};

export type AgentType = 'frontend' | 'technical' | 'economist' | 'strategist';

export interface AgentResponse {
  content: string;
  error?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  technicalResponse?: any;
  economistResponse?: any;
  strategistResponse?: any;
}

export interface ChatSession {
  id: string;
  userId: string;
  startTime: string;
  lastActivity: string;
  status: 'active' | 'archived';
}

async function callAgent(agentType: AgentType, message: string, language?: string): Promise<AgentResponse> {
  try {
    console.log(`[${agentType}] Calling agent with message:`, message.substring(0, 100));

    const languageInstructions: Record<string, string> = {
      'zh-HK': '\n\nIMPORTANT: Please respond in Traditional Chinese (Hong Kong).',
      'zh-CN': '\n\nIMPORTANT: Please respond in Simplified Chinese.',
      'en': '',
    };

    const languageInstruction = language && languageInstructions[language] ? languageInstructions[language] : '';
    const systemPrompt = SYSTEM_PROMPTS[agentType] + languageInstruction;

    const requestBody = {
      model: API_CONFIG.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    };

    console.log(`[${agentType}] Sending request to: ${API_CONFIG.baseUrl}/chat/completions`);

    const response = await fetch(`${API_CONFIG.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_CONFIG.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log(`[${agentType}] Response status:`, response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${agentType}] API error response:`, errorText);
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`[${agentType}] Response received, length:`, data.choices?.[0]?.message?.content?.length);

    return {
      content: data.choices[0].message.content,
    };
  } catch (error) {
    console.error(`[${agentType}] Error calling agent:`, error);
    return {
      content: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function callAgentWithStreaming(
  agentType: AgentType,
  message: string,
  language?: string,
  onStream?: (chunk: string) => void
): Promise<AgentResponse> {
  try {
    console.log(`[${agentType}] Calling agent with streaming:`, message.substring(0, 100));

    const languageInstructions: Record<string, string> = {
      'zh-HK': '\n\nIMPORTANT: Please respond in Traditional Chinese (Hong Kong).',
      'zh-CN': '\n\nIMPORTANT: Please respond in Simplified Chinese.',
      'en': '',
    };

    const languageInstruction = language && languageInstructions[language] ? languageInstructions[language] : '';
    const systemPrompt = SYSTEM_PROMPTS[agentType] + languageInstruction;

    const requestBody = {
      model: API_CONFIG.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      stream: true,
    };

    const response = await fetch(`${API_CONFIG.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_CONFIG.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${agentType}] API error response:`, errorText);
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullContent += content;
                onStream?.(content);
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }
    }

    return { content: fullContent };
  } catch (error) {
    console.error(`[${agentType}] Error calling agent with streaming:`, error);
    return {
      content: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function handleUserMessage(
  userMessage: string,
  sessionId: string,
  language?: string,
  onStream?: (chunk: string) => void
): Promise<Message> {
  console.log('[handleUserMessage] Starting with message:', userMessage);
  console.log('[handleUserMessage] Session ID:', sessionId);
  console.log('[handleUserMessage] Language:', language);

  const chatSession = await supabase
    .from('ai_chats')
    .select('user_id')
    .eq('id', sessionId)
    .maybeSingle();

  const [technicalResponse, economistResponse, strategistResponse] = await Promise.all([
    callAgent('technical', userMessage, language),
    callAgent('economist', userMessage, language),
    callAgent('strategist', userMessage, language),
  ]);

  console.log('[handleUserMessage] All agents responded');
  console.log('[handleUserMessage] Technical error:', technicalResponse.error);
  console.log('[handleUserMessage] Economist error:', economistResponse.error);
  console.log('[handleUserMessage] Strategist error:', strategistResponse.error);

  const frontEndPrompt = `
User question: ${userMessage}

Technical Analysis:
${technicalResponse.content || 'Technical analysis unavailable'}

Macro/Economic Context:
${economistResponse.content || 'Economic analysis unavailable'}

Strategic Framework:
${strategistResponse.content || 'Strategic analysis unavailable'}

Synthesize the above into a coherent, customer-friendly response following your standard format.
  `;

  const finalResponse = await callAgentWithStreaming('frontend', frontEndPrompt, language, onStream);
  console.log('[handleUserMessage] Frontend agent responded, error:', finalResponse.error);

  const assistantMessage: Message = {
    id: generateUUID(),
    role: 'assistant',
    content: finalResponse.content || 'I apologize, but I am unable to process your request at this time. Please try again later.',
    timestamp: new Date().toISOString(),
    technicalResponse: technicalResponse.content,
    economistResponse: economistResponse.content,
    strategistResponse: strategistResponse.content,
  };

  console.log('[handleUserMessage] Saving message to database');
  await saveMessage(sessionId, assistantMessage);
  console.log('[handleUserMessage] Message saved successfully');

  if (chatSession.data?.user_id) {
    console.log('[handleUserMessage] Updating AI subscription usage');
    try {
      const aiSub = await getAISubscription(chatSession.data.user_id);
      if (aiSub) {
        await updateSubscriptionUsage(aiSub.subscription_id, 'ai_messages', 1);
        console.log('[handleUserMessage] Usage updated successfully');
      }
    } catch (error) {
      console.error('[handleUserMessage] Error updating usage:', error);
    }
  }

  return assistantMessage;
}

export async function handleGuestMessage(
  userMessage: string,
  language?: string,
  onStream?: (chunk: string) => void
): Promise<Message> {
  console.log('[handleGuestMessage] Starting with message:', userMessage);
  console.log('[handleGuestMessage] Language:', language);

  const [technicalResponse, economistResponse, strategistResponse] = await Promise.all([
    callAgent('technical', userMessage, language),
    callAgent('economist', userMessage, language),
    callAgent('strategist', userMessage, language),
  ]);

  console.log('[handleGuestMessage] All agents responded');

  const frontEndPrompt = `
User question: ${userMessage}

Technical Analysis:
${technicalResponse.content || 'Technical analysis unavailable'}

Macro/Economic Context:
${economistResponse.content || 'Economic analysis unavailable'}

Strategic Framework:
${strategistResponse.content || 'Strategic analysis unavailable'}

Synthesize the above into a coherent, customer-friendly response following your standard format.
  `;

  const finalResponse = await callAgentWithStreaming('frontend', frontEndPrompt, language, onStream);
  console.log('[handleGuestMessage] Frontend agent responded');

  const assistantMessage: Message = {
    id: generateUUID(),
    role: 'assistant',
    content: finalResponse.content || 'I apologize, but I am unable to process your request at this time. Please try again later.',
    timestamp: new Date().toISOString(),
    technicalResponse: technicalResponse.content,
    economistResponse: economistResponse.content,
    strategistResponse: strategistResponse.content,
  };

  return assistantMessage;
}

export async function handleNewsArticleQuestion(articleTitle: string, articleContent: string, userQuestion: string): Promise<Message> {
  console.log('[handleNewsArticleQuestion] Starting with question:', userQuestion);

  const simplePrompt = `You are a financial news analyst. Provide a brief, concise answer in no more than 3 lines.

Article Title: ${articleTitle}

Article Content: ${articleContent}

User Question: ${userQuestion}

Keep your response under 3 lines and be direct and clear.`;

  try {
    const response = await fetch(`${API_CONFIG.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_CONFIG.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: API_CONFIG.model,
        messages: [
          { role: 'user', content: simplePrompt },
        ],
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    return {
      id: generateUUID(),
      role: 'assistant',
      content,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[handleNewsArticleQuestion] Error:', error);
    return {
      id: generateUUID(),
      role: 'assistant',
      content: 'Unable to analyze the article at this time. Please try again.',
      timestamp: new Date().toISOString(),
    };
  }
}

export async function translateNewsArticle(articleTitle: string, articleContent: string, targetLanguage: string): Promise<{ title: string; content: string }> {
  console.log('[translateNewsArticle] Starting translation to:', targetLanguage);

  const languageMap: Record<string, string> = {
    'zh-HK': 'Traditional Chinese (Hong Kong)',
    'zh-CN': 'Simplified Chinese',
    'en': 'English',
  };

  const targetLang = languageMap[targetLanguage] || targetLanguage;

  const translationPrompt = `Translate the following financial news article to ${targetLang}. Maintain the professional tone and financial terminology accuracy.

Title: ${articleTitle}

Content: ${articleContent}

Provide the translation in the following format:
TITLE: [translated title]
CONTENT: [translated content]`;

  try {
    const response = await fetch(`${API_CONFIG.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_CONFIG.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: API_CONFIG.model,
        messages: [
          { role: 'user', content: translationPrompt },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }

    const data = await response.json();
    const translatedText = data.choices[0].message.content;

    const titleMatch = translatedText.match(/TITLE:\s*(.+?)(?=\n|CONTENT:)/s);
    const contentMatch = translatedText.match(/CONTENT:\s*(.+)/s);

    return {
      title: titleMatch ? titleMatch[1].trim() : articleTitle,
      content: contentMatch ? contentMatch[1].trim() : translatedText,
    };
  } catch (error) {
    console.error('[translateNewsArticle] Error:', error);
    throw error;
  }
}

export async function translateComment(commentText: string, targetLanguage: string): Promise<string> {
  console.log('[translateComment] Starting translation to:', targetLanguage);

  const languageMap: Record<string, string> = {
    'zh-HK': 'Traditional Chinese (Hong Kong)',
    'zh-CN': 'Simplified Chinese',
    'en': 'English',
  };

  const targetLang = languageMap[targetLanguage] || targetLanguage;

  const translationPrompt = `Translate the following user comment to ${targetLang}. Keep it natural and conversational.

Comment: ${commentText}

Provide only the translated text without any additional formatting or labels.`;

  try {
    const response = await fetch(`${API_CONFIG.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_CONFIG.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: API_CONFIG.model,
        messages: [
          { role: 'user', content: translationPrompt },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('[translateComment] Error:', error);
    throw error;
  }
}

export async function createChatSession(userId: string): Promise<string> {
  const { data, error } = await supabase
    .from('ai_chats')
    .insert({
      user_id: userId,
      title: 'New Chat',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error creating chat session:', error);
    throw error;
  }

  return data!.id;
}

export async function getChatSession(userId: string): Promise<ChatSession | null> {
  const { data, error } = await supabase
    .from('ai_chats')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error getting chat session:', error);
    return null;
  }

  if (!data) return null;

  return {
    id: data.id,
    userId: data.user_id,
    startTime: data.created_at,
    lastActivity: data.updated_at,
    status: 'active',
  };
}

export async function getChatMessages(sessionId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('ai_messages')
    .select('*')
    .eq('chat_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error getting chat messages:', error);
    return [];
  }

  return data.map((msg) => ({
    id: msg.id,
    role: msg.role,
    content: msg.content,
    timestamp: msg.created_at,
    technicalResponse: msg.metadata?.technical_response,
    economistResponse: msg.metadata?.economist_response,
    strategistResponse: msg.metadata?.strategist_response,
  }));
}

export async function saveMessage(sessionId: string, message: Message): Promise<void> {
  const metadata: any = {};
  if (message.technicalResponse) metadata.technical_response = message.technicalResponse;
  if (message.economistResponse) metadata.economist_response = message.economistResponse;
  if (message.strategistResponse) metadata.strategist_response = message.strategistResponse;

  const { error: messageError } = await supabase.from('ai_messages').insert({
    chat_id: sessionId,
    role: message.role,
    content: message.content,
    metadata: Object.keys(metadata).length > 0 ? metadata : null,
    created_at: message.timestamp,
  });

  if (messageError) {
    console.error('Error saving message:', messageError);
    throw messageError;
  }

  const { error: sessionError } = await supabase
    .from('ai_chats')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', sessionId);

  if (sessionError) {
    console.error('Error updating session:', sessionError);
  }
}

export async function saveUserMessage(sessionId: string, content: string): Promise<Message> {
  const userMessage: Message = {
    id: generateUUID(),
    role: 'user',
    content,
    timestamp: new Date().toISOString(),
  };

  await saveMessage(sessionId, userMessage);

  return userMessage;
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
