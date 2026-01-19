# Changelog

## Version 1.0.0 - Initial Release

### Added
- **Branding**: Official Eddid Financial logo (SVG) integrated throughout the app
- **Navigation**: Complete navigation system with tabs, stack navigation, and deep linking
  - Markets → Asset Detail pages
  - News → News Detail with comments
  - Account → Security, Deposit, Withdrawal, Transactions

- **News Features**:
  - News detail page with full article content
  - Comments system with user avatars
  - Like/bookmark functionality
  - Tags and metadata

- **Financial Features**:
  - Deposit screen with multiple payment methods (Bank Transfer, FPS, Card, Crypto)
  - Withdrawal screen with linked bank accounts
  - Transaction history with filters
  - Real-time balance display

- **Security**:
  - Biometric authentication toggle
  - Two-factor authentication setup
  - Active sessions management with revoke capability
  - Password change flow

- **Trading Enhancements**:
  - Live chart display with timeframe selection (1D, 1W, 1M, 3M, 1Y)
  - Visual chart placeholder ready for real data integration
  - Enhanced order ticket with all order types
  - Percentage-based position sizing (25%, 50%, 75%, 100%)

- **UI/UX Improvements**:
  - Fixed scrolling issues across all screens
  - Proper footer positioning for action buttons
  - Consistent card designs with Eddid brand colors
  - Smooth transitions and animations
  - Responsive layouts for all screen sizes

### Technical
- TypeScript type checking passes cleanly
- All routes properly configured in app/_layout.tsx
- Supabase database schema ready for production
- Row-Level Security policies on all tables
- Authentication context with session management

### Ready for Integration
- Market data API endpoints
- Order execution system
- Real-time chart library (TradingView or similar)
- Payment gateway integration
- KYC verification service
- AI backend for chat features
