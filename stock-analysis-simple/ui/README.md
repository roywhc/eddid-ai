# Eddid Financial Trading App

A comprehensive mobile trading platform built with React Native and Expo, supporting multi-asset trading (stocks, crypto, forex, commodities, funds, RWA) with AI-powered insights.

![Eddid Financial](https://www.eddid.com.hk)

## Features

### Core Functionality
- **Multi-Asset Trading**: Support for stocks, ETFs, funds, commodities, FX, crypto, and tokenized real-world assets (RWA)
- **Market Coverage**: US and HKEX markets with venue-specific order types
- **Advanced Order Types**: Market, Limit, Stop, Stop-Limit, Trailing Stop, Iceberg, TWAP/VWAP
- **Portfolio Management**: Real-time positions, P&L tracking, order management
- **Technical Analysis**: RSI, MACD, SMA/EMA, Bollinger Bands, VWAP, ATR, ADX
- **AI Assistant**: Chat-based market insights with rich rendering (charts, tables)
- **Multi-Language**: English, Traditional Chinese, Simplified Chinese
- **Theme Support**: Light, Dark, and Auto modes with Eddid brand colors

### User Experience
- **Onboarding**: Streamlined KYC verification and account setup
- **Funding**: Deposits and withdrawals via bank transfer, FPS, ACH, cards
- **Alerts**: Price, volume, and indicator-based notifications
- **News & Insights**: Real-time market news and CIO commentary
- **Subscription Tiers**: Free, Basic, Pro with feature gating

### Security & Compliance
- **KYC/AML**: Full identity verification with document upload
- **Screening**: Sanctions, PEP, adverse media checks
- **Appropriateness Tests**: Asset class suitability assessments
- **Row-Level Security**: Supabase RLS policies on all tables
- **MFA Support**: Multi-factor authentication for sensitive operations

## Tech Stack

- **Framework**: React Native with Expo SDK 54
- **Router**: Expo Router (file-based routing)
- **Database**: Supabase (PostgreSQL with RLS)
- **Authentication**: Supabase Auth
- **UI**: Custom components with StyleSheet
- **Icons**: Lucide React Native
- **State Management**: React Context API
- **Type Safety**: TypeScript

## Project Structure

```
app/
├── (tabs)/              # Tab-based navigation
│   ├── index.tsx        # Markets screen
│   ├── portfolio.tsx    # Portfolio & positions
│   ├── trade.tsx        # Trading ticket
│   ├── ai.tsx           # AI assistant
│   └── account.tsx      # Account settings
├── auth/                # Authentication
│   └── index.tsx        # Sign in/up
├── asset/               # Asset details
│   └── [id].tsx         # Dynamic asset screen
└── _layout.tsx          # Root layout

components/              # Reusable UI components
├── Button.tsx
├── Card.tsx
├── Input.tsx
└── SafeContainer.tsx

contexts/                # React contexts
├── AuthContext.tsx      # Authentication state
├── ThemeContext.tsx     # Theme management
└── LanguageContext.tsx  # i18n support

constants/
└── theme.ts             # Colors, typography, spacing

i18n/
└── index.ts             # Translation keys

lib/
└── supabase.ts          # Supabase client
```

## Database Schema

The database includes comprehensive tables for:
- User profiles, addresses, preferences, sessions
- KYC submissions, documents, screening, compliance cases
- Trading accounts, wallets, transactions
- Deposits, withdrawals
- Assets, fundamentals, news, insights
- Orders, positions, executions
- Alerts, notifications
- Subscriptions, entitlements
- AI chats, messages, usage tracking

All tables have Row-Level Security (RLS) enabled with appropriate policies.

## Theme & Design

The app uses Eddid Financial's brand identity:
- **Primary Gold**: #F8D000
- **Secondary Blue**: #13216a
- **Professional**: Clean, minimalist design with high contrast
- **Responsive**: Adapts to light and dark modes
- **Typography**: Clear hierarchy with consistent spacing (8px system)

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI

### Installation

```bash
npm install
```

### Environment Variables

The project uses Supabase. Environment variables are pre-configured in `.env`:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### Development

```bash
npm run dev
```

Opens Expo in development mode. Scan QR code with Expo Go app or run in simulator.

### Building

For web:
```bash
npm run build:web
```

For type checking:
```bash
npm run typecheck
```

## Navigation

The app uses tab-based navigation as the primary structure:
1. **Markets**: Browse assets, view trending items, market news
2. **Portfolio**: View positions, orders, P&L, account value
3. **Trade**: Place orders with various order types and sizing options
4. **AI Assistant**: Chat with AI for market insights and analysis
5. **Account**: Manage profile, settings, theme, language, subscriptions

## Multi-Language Support

Languages:
- English (en)
- Traditional Chinese (zh-HK)
- Simplified Chinese (zh-CN)

Switch via Account > Language settings.

## Authentication

The app integrates Supabase Auth:
- Email/password sign up and sign in
- Session management with refresh tokens
- Protected routes requiring authentication
- Sign out functionality

## Trading Features

### Order Types
- **Market**: Execute at best available price
- **Limit**: Execute at specified price or better
- **Stop**: Trigger market order at stop price
- **Stop-Limit**: Trigger limit order at stop price
- **Trailing Stop**: Dynamic stop that follows price

### Position Sizing
- Absolute quantity (shares/contracts)
- Notional amount
- Percentage shortcuts: 25%, 50%, 75%, 100%

### Exchange-Specific
- HKEX: Iceberg orders (display quantity + hidden)
- Algo routing: VWAP, TWAP strategies

## AI Assistant

Features:
- Natural language queries about markets
- Context-aware responses (asset, portfolio, risk profile)
- Rich content rendering (charts, tables, images)
- Chat history management
- Usage tracking for subscription limits

## Compliance

The app enforces strict compliance controls:
- Trading disabled until KYC approved
- Appropriateness tests for asset classes
- Account holds for screening flags
- Step-up authentication for withdrawals
- Comprehensive audit logging

## Security Best Practices

- No API keys or secrets in client code
- Row-Level Security on all database tables
- Restrictive RLS policies checking auth.uid()
- Secure session management
- Input validation and sanitization

## Customization

### Adding New Languages
1. Add translations to `i18n/index.ts`
2. Update `Language` type
3. Add language selector in account screen

### Adding New Asset Classes
1. Update database `assets` table with new `asset_class`
2. Add tab in markets screen
3. Update appropriateness tests if needed

### Theme Customization
Edit `constants/theme.ts` to modify:
- Colors (light/dark)
- Typography scales
- Spacing system
- Border radius values
- Shadow styles

## Known Limitations

- Charts use placeholder visualizations (integrate charting library as needed)
- Market data is mocked (integrate real-time data provider)
- Order placement is UI-only (integrate with broker/OMS)
- AI responses are static (integrate with AI backend service)

## Future Enhancements

- Real-time WebSocket market data
- Advanced charting with TradingView or similar
- Options trading support
- Margin trading with risk controls
- Social features (copy trading, leaderboards)
- Push notifications for alerts
- Biometric authentication
- Card issuance integration
- Tax reporting and statements

## License

© 2026 Eddid Financial

## Support

For issues or questions, contact Eddid Financial support.
