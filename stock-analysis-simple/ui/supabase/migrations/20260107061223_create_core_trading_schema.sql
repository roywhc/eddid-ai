/*
  # Eddid Trading Platform - Core Schema

  ## Overview
  Complete multi-asset trading platform database schema supporting stocks, funds, commodities, FX, RWA, and crypto.
  Includes user management, KYC, compliance, trading, funding, subscriptions, AI chat, and notifications.

  ## Tables Created

  ### User Management
  - `profiles` - Extended user profile data beyond Supabase auth
  - `user_addresses` - Physical addresses with verification status
  - `user_preferences` - Language, timezone, display preferences
  - `user_sessions` - Track active sessions for security

  ### Compliance & KYC
  - `kyc_submissions` - KYC verification attempts and status
  - `kyc_documents` - Uploaded verification documents
  - `compliance_cases` - Manual review cases
  - `screening_results` - Sanctions/PEP/AML screening
  - `appropriateness_tests` - Asset class suitability tests

  ### Financial Accounts
  - `accounts` - Trading accounts with balances
  - `wallets` - Multi-currency wallet balances
  - `transactions` - Ledger of all financial movements
  - `deposit_intents` - Deposit requests and instructions
  - `withdrawal_requests` - Withdrawal requests

  ### Assets & Market Data
  - `assets` - Multi-asset catalog (stocks, crypto, etc.)
  - `asset_fundamentals` - Financial metrics and ratios
  - `market_news` - Asset-related news feed
  - `cio_insights` - Curated investment insights

  ### Trading
  - `orders` - All order types and statuses
  - `positions` - Current holdings
  - `executions` - Trade fills

  ### Alerts & Notifications
  - `alerts` - Price/indicator alerts
  - `alert_triggers` - Alert execution history
  - `notifications` - User notifications inbox
  - `notification_preferences` - Delivery channel preferences

  ### Subscriptions
  - `subscription_plans` - Available plans
  - `user_subscriptions` - Active subscriptions
  - `entitlements` - Feature access control

  ### AI & Content
  - `ai_chats` - Chat conversation threads
  - `ai_messages` - Individual messages
  - `ai_usage` - Usage tracking for limits

  ## Security
  All tables have RLS enabled with appropriate policies for authenticated users.
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USER MANAGEMENT
-- =============================================

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  date_of_birth date,
  nationality text,
  occupation text,
  employer text,
  phone_number text,
  phone_verified boolean DEFAULT false,
  account_status text DEFAULT 'registered' CHECK (account_status IN ('registered', 'kyc_pending', 'kyc_approved', 'kyc_rejected', 'active', 'suspended', 'closed')),
  risk_category text CHECK (risk_category IN ('conservative', 'moderate', 'balanced', 'growth', 'aggressive')),
  base_currency text DEFAULT 'USD',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- User addresses
CREATE TABLE IF NOT EXISTS user_addresses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  address_type text DEFAULT 'residential' CHECK (address_type IN ('residential', 'mailing', 'business')),
  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  state_province text,
  postal_code text NOT NULL,
  country text NOT NULL,
  verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  proof_document_id uuid,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own addresses"
  ON user_addresses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own addresses"
  ON user_addresses FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- User preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  language text DEFAULT 'en' CHECK (language IN ('en', 'zh-HK', 'zh-CN', 'ja', 'ko')),
  timezone text DEFAULT 'UTC',
  currency_display text DEFAULT 'USD',
  theme text DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  push_notifications boolean DEFAULT true,
  email_notifications boolean DEFAULT true,
  sms_notifications boolean DEFAULT false,
  trading_defaults jsonb DEFAULT '{"orderType": "limit", "tif": "day"}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- User sessions tracking
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  device_info jsonb,
  ip_address inet,
  user_agent text,
  last_activity timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  revoked_at timestamptz
);

ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON user_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- =============================================
-- COMPLIANCE & KYC
-- =============================================

-- KYC submissions
CREATE TABLE IF NOT EXISTS kyc_submissions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  submission_type text DEFAULT 'individual' CHECK (submission_type IN ('individual', 'corporate')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'approved', 'rejected', 'resubmit_required')),
  provider text,
  provider_session_id text,
  rejection_reasons jsonb,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  submitted_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE kyc_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own KYC submissions"
  ON kyc_submissions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own KYC submissions"
  ON kyc_submissions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- KYC documents
CREATE TABLE IF NOT EXISTS kyc_documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  kyc_submission_id uuid REFERENCES kyc_submissions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  document_type text NOT NULL CHECK (document_type IN ('passport', 'id_card', 'drivers_license', 'proof_of_address', 'selfie', 'liveness_video', 'corporate_docs')),
  file_path text NOT NULL,
  file_size_bytes integer,
  mime_type text,
  verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own KYC documents"
  ON kyc_documents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Screening results (sanctions, PEP, AML)
CREATE TABLE IF NOT EXISTS screening_results (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  screening_type text NOT NULL CHECK (screening_type IN ('sanctions', 'pep', 'adverse_media', 'watchlist')),
  match_found boolean DEFAULT false,
  match_details jsonb,
  risk_score numeric(5,2),
  provider text,
  screened_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE screening_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own screening results"
  ON screening_results FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Compliance cases
CREATE TABLE IF NOT EXISTS compliance_cases (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  case_type text NOT NULL CHECK (case_type IN ('kyc_review', 'aml_alert', 'suspicious_activity', 'source_of_funds', 'enhanced_dd')),
  status text DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'escalated', 'closed')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  description text,
  notes text,
  assigned_to uuid REFERENCES auth.users(id),
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE compliance_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own compliance cases"
  ON compliance_cases FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Appropriateness tests
CREATE TABLE IF NOT EXISTS appropriateness_tests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  asset_class text NOT NULL CHECK (asset_class IN ('stocks', 'funds_etf', 'commodities', 'fx', 'crypto', 'rwa', 'derivatives')),
  test_version text NOT NULL,
  answers jsonb NOT NULL,
  score numeric(5,2),
  passed boolean DEFAULT false,
  valid_until timestamptz,
  taken_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE appropriateness_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own appropriateness tests"
  ON appropriateness_tests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own appropriateness tests"
  ON appropriateness_tests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- FINANCIAL ACCOUNTS
-- =============================================

-- Trading accounts
CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_type text DEFAULT 'retail' CHECK (account_type IN ('retail', 'professional', 'corporate')),
  account_number text UNIQUE NOT NULL,
  base_currency text DEFAULT 'USD' NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'closed', 'compliance_hold')),
  margin_enabled boolean DEFAULT false,
  buying_power numeric(20,2) DEFAULT 0,
  cash_balance numeric(20,2) DEFAULT 0,
  total_equity numeric(20,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own accounts"
  ON accounts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Multi-currency wallets
CREATE TABLE IF NOT EXISTS wallets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
  currency text NOT NULL,
  available_balance numeric(20,8) DEFAULT 0,
  held_balance numeric(20,8) DEFAULT 0,
  total_balance numeric(20,8) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(account_id, currency)
);

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallets"
  ON wallets FOR SELECT
  TO authenticated
  USING (account_id IN (SELECT id FROM accounts WHERE user_id = auth.uid()));

-- Transactions ledger
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'trade_buy', 'trade_sell', 'fee', 'dividend', 'interest', 'adjustment', 'transfer')),
  currency text NOT NULL,
  amount numeric(20,8) NOT NULL,
  balance_after numeric(20,8),
  reference_id uuid,
  reference_type text,
  description text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (account_id IN (SELECT id FROM accounts WHERE user_id = auth.uid()));

-- Deposit intents
CREATE TABLE IF NOT EXISTS deposit_intents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
  method text NOT NULL CHECK (method IN ('bank_transfer', 'fps', 'ach', 'wire', 'card', 'crypto')),
  currency text NOT NULL,
  amount numeric(20,2) NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  instructions jsonb,
  reference_code text UNIQUE,
  provider_reference text,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE deposit_intents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own deposits"
  ON deposit_intents FOR SELECT
  TO authenticated
  USING (account_id IN (SELECT id FROM accounts WHERE user_id = auth.uid()));

CREATE POLICY "Users can create own deposits"
  ON deposit_intents FOR INSERT
  TO authenticated
  WITH CHECK (account_id IN (SELECT id FROM accounts WHERE user_id = auth.uid()));

-- Withdrawal requests
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
  method text NOT NULL CHECK (method IN ('bank_transfer', 'fps', 'ach', 'wire', 'crypto')),
  destination_id uuid NOT NULL,
  currency text NOT NULL,
  amount numeric(20,8) NOT NULL,
  fee numeric(20,8) DEFAULT 0,
  net_amount numeric(20,8),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'mfa_required', 'processing', 'completed', 'rejected', 'cancelled')),
  rejection_reason text,
  mfa_verified_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own withdrawals"
  ON withdrawal_requests FOR SELECT
  TO authenticated
  USING (account_id IN (SELECT id FROM accounts WHERE user_id = auth.uid()));

CREATE POLICY "Users can create own withdrawals"
  ON withdrawal_requests FOR INSERT
  TO authenticated
  WITH CHECK (account_id IN (SELECT id FROM accounts WHERE user_id = auth.uid()));

-- =============================================
-- ASSETS & MARKET DATA
-- =============================================

-- Assets catalog (multi-asset)
CREATE TABLE IF NOT EXISTS assets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_class text NOT NULL CHECK (asset_class IN ('stock', 'etf', 'fund', 'commodity', 'fx', 'crypto', 'rwa')),
  symbol text NOT NULL,
  name text NOT NULL,
  description text,
  exchange text,
  country text,
  currency text,
  sector text,
  industry text,
  market_cap numeric(20,2),
  is_tradeable boolean DEFAULT true,
  is_shortable boolean DEFAULT false,
  tick_size numeric(10,8),
  lot_size integer DEFAULT 1,
  trading_hours jsonb,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(symbol, exchange)
);

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view assets"
  ON assets FOR SELECT
  TO authenticated
  USING (true);

-- Asset fundamentals
CREATE TABLE IF NOT EXISTS asset_fundamentals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id uuid REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
  period text,
  fiscal_year integer,
  revenue numeric(20,2),
  net_income numeric(20,2),
  eps numeric(10,4),
  pe_ratio numeric(10,2),
  pb_ratio numeric(10,2),
  dividend_yield numeric(5,4),
  debt_to_equity numeric(10,2),
  roe numeric(5,4),
  roa numeric(5,4),
  profit_margin numeric(5,4),
  data_source text,
  as_of_date date,
  created_at timestamptz DEFAULT now(),
  UNIQUE(asset_id, period, fiscal_year)
);

ALTER TABLE asset_fundamentals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view fundamentals"
  ON asset_fundamentals FOR SELECT
  TO authenticated
  USING (true);

-- Market news
CREATE TABLE IF NOT EXISTS market_news (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id uuid REFERENCES assets(id) ON DELETE CASCADE,
  headline text NOT NULL,
  summary text,
  content text,
  source text,
  url text,
  sentiment text CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  sentiment_score numeric(3,2),
  published_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE market_news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view news"
  ON market_news FOR SELECT
  TO authenticated
  USING (true);

-- CIO insights
CREATE TABLE IF NOT EXISTS cio_insights (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id uuid REFERENCES assets(id) ON DELETE SET NULL,
  theme text,
  title text NOT NULL,
  content text NOT NULL,
  author text,
  tags text[],
  priority integer DEFAULT 0,
  published boolean DEFAULT false,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE cio_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published insights"
  ON cio_insights FOR SELECT
  TO authenticated
  USING (published = true);

-- =============================================
-- TRADING
-- =============================================

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
  asset_id uuid REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
  order_type text NOT NULL CHECK (order_type IN ('market', 'limit', 'stop', 'stop_limit', 'trailing_stop', 'iceberg', 'twap', 'vwap')),
  side text NOT NULL CHECK (side IN ('buy', 'sell')),
  quantity numeric(20,8) NOT NULL,
  filled_quantity numeric(20,8) DEFAULT 0,
  limit_price numeric(20,8),
  stop_price numeric(20,8),
  trailing_amount numeric(20,8),
  trailing_percent numeric(5,4),
  display_quantity numeric(20,8),
  time_in_force text DEFAULT 'day' CHECK (time_in_force IN ('day', 'gtc', 'ioc', 'fok')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'open', 'partially_filled', 'filled', 'cancelled', 'rejected', 'expired')),
  reject_reason text,
  average_fill_price numeric(20,8),
  total_fees numeric(20,8) DEFAULT 0,
  route_strategy text,
  broker_order_id text,
  placed_at timestamptz,
  filled_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (account_id IN (SELECT id FROM accounts WHERE user_id = auth.uid()));

CREATE POLICY "Users can create own orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (account_id IN (SELECT id FROM accounts WHERE user_id = auth.uid()));

-- Positions
CREATE TABLE IF NOT EXISTS positions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
  asset_id uuid REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
  quantity numeric(20,8) NOT NULL,
  average_cost numeric(20,8) NOT NULL,
  current_price numeric(20,8),
  market_value numeric(20,2),
  unrealized_pnl numeric(20,2),
  unrealized_pnl_percent numeric(10,4),
  realized_pnl numeric(20,2) DEFAULT 0,
  total_cost numeric(20,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(account_id, asset_id)
);

ALTER TABLE positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own positions"
  ON positions FOR SELECT
  TO authenticated
  USING (account_id IN (SELECT id FROM accounts WHERE user_id = auth.uid()));

-- Executions (fills)
CREATE TABLE IF NOT EXISTS executions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
  asset_id uuid REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
  quantity numeric(20,8) NOT NULL,
  price numeric(20,8) NOT NULL,
  fee numeric(20,8) DEFAULT 0,
  side text NOT NULL CHECK (side IN ('buy', 'sell')),
  broker_execution_id text,
  executed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own executions"
  ON executions FOR SELECT
  TO authenticated
  USING (account_id IN (SELECT id FROM accounts WHERE user_id = auth.uid()));

-- =============================================
-- ALERTS & NOTIFICATIONS
-- =============================================

-- Alerts
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  asset_id uuid REFERENCES assets(id) ON DELETE CASCADE,
  alert_type text NOT NULL CHECK (alert_type IN ('price_above', 'price_below', 'price_change_percent', 'volume_spike', 'indicator_cross', 'news_sentiment')),
  condition jsonb NOT NULL,
  delivery_channels text[] DEFAULT ARRAY['push'],
  status text DEFAULT 'active' CHECK (status IN ('active', 'triggered', 'expired', 'disabled')),
  trigger_count integer DEFAULT 0,
  last_triggered_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own alerts"
  ON alerts FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Alert triggers (history)
CREATE TABLE IF NOT EXISTS alert_triggers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_id uuid REFERENCES alerts(id) ON DELETE CASCADE NOT NULL,
  trigger_value jsonb,
  notification_sent boolean DEFAULT false,
  triggered_at timestamptz DEFAULT now()
);

ALTER TABLE alert_triggers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alert triggers"
  ON alert_triggers FOR SELECT
  TO authenticated
  USING (alert_id IN (SELECT id FROM alerts WHERE user_id = auth.uid()));

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  notification_type text NOT NULL CHECK (notification_type IN ('alert', 'order', 'execution', 'deposit', 'withdrawal', 'kyc', 'system', 'news')),
  title text NOT NULL,
  body text,
  data jsonb,
  read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- SUBSCRIPTIONS
-- =============================================

-- Subscription plans
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  tier text NOT NULL CHECK (tier IN ('free', 'basic', 'pro', 'vip')),
  price_monthly numeric(10,2),
  price_yearly numeric(10,2),
  features jsonb NOT NULL,
  limits jsonb,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active plans"
  ON subscription_plans FOR SELECT
  TO authenticated
  USING (active = true);

-- User subscriptions
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id uuid REFERENCES subscription_plans(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'past_due')),
  billing_cycle text CHECK (billing_cycle IN ('monthly', 'yearly')),
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  cancel_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON user_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- =============================================
-- AI CHAT
-- =============================================

-- AI chats
CREATE TABLE IF NOT EXISTS ai_chats (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text DEFAULT 'New Chat',
  context jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ai_chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own AI chats"
  ON ai_chats FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- AI messages
CREATE TABLE IF NOT EXISTS ai_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id uuid REFERENCES ai_chats(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  rich_blocks jsonb,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in own chats"
  ON ai_messages FOR SELECT
  TO authenticated
  USING (chat_id IN (SELECT id FROM ai_chats WHERE user_id = auth.uid()));

CREATE POLICY "Users can create messages in own chats"
  ON ai_messages FOR INSERT
  TO authenticated
  WITH CHECK (chat_id IN (SELECT id FROM ai_chats WHERE user_id = auth.uid()));

-- AI usage tracking
CREATE TABLE IF NOT EXISTS ai_usage (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  usage_type text NOT NULL CHECK (usage_type IN ('message', 'chart', 'analysis')),
  tokens_used integer,
  period_start date NOT NULL,
  period_end date NOT NULL,
  count integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, usage_type, period_start)
);

ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own AI usage"
  ON ai_usage FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON profiles(account_status);
CREATE INDEX IF NOT EXISTS idx_kyc_submissions_user_status ON kyc_submissions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_created ON transactions(account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_account_status ON orders(account_id, status);
CREATE INDEX IF NOT EXISTS idx_positions_account_id ON positions(account_id);
CREATE INDEX IF NOT EXISTS idx_alerts_user_status ON alerts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assets_symbol_exchange ON assets(symbol, exchange);
CREATE INDEX IF NOT EXISTS idx_ai_chats_user ON ai_chats(user_id, created_at DESC);
