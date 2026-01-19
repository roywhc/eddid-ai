/*
  # Subscription System for Data and AI Features

  ## Overview
  Complete subscription system supporting:
  - Data subscriptions (market data access for different asset classes)
  - AI subscriptions (AI feature access tiers)
  - Flexible subscription management with add-ons and bundles

  ## Changes

  1. **Subscription Products**
    - `subscription_products` - Product catalog for data and AI subscriptions
      - Supports two types: 'data_subscription' and 'ai_subscription'
      - Data subscriptions by market: stocks, crypto, commodities, fx, rwa, funds
      - AI subscriptions by tier: basic, standard, premium, unlimited

  2. **User Subscriptions**
    - `user_subscriptions` - Replaces the existing simple table with enhanced version
    - Supports both monthly and yearly billing
    - Tracks trial periods, cancellations, and renewals

  3. **Subscription Entitlements**
    - `subscription_entitlements` - Defines what features each subscription grants
    - Flexible JSON-based feature access control

  4. **User Active Subscriptions**
    - `user_active_subscriptions` - View combining active user subscriptions with product details

  ## Security
  - RLS enabled on all tables
  - Users can only view and manage their own subscriptions
*/

-- Drop existing simple tables if they exist
DROP TABLE IF EXISTS user_subscriptions CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;
DROP VIEW IF EXISTS user_active_subscriptions CASCADE;

-- Subscription Products (catalog of available subscriptions)
CREATE TABLE IF NOT EXISTS subscription_products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_type text NOT NULL CHECK (product_type IN ('data_subscription', 'ai_subscription')),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,

  -- Pricing
  price_monthly numeric(10,2),
  price_yearly numeric(10,2),
  currency text DEFAULT 'USD',

  -- Data subscription specific fields
  market_type text CHECK (market_type IN ('stocks', 'crypto', 'commodities', 'fx', 'rwa', 'funds', 'all_markets')),
  data_features jsonb,

  -- AI subscription specific fields
  ai_tier text CHECK (ai_tier IN ('basic', 'standard', 'premium', 'unlimited')),
  ai_features jsonb,
  monthly_ai_limit integer,

  -- Product settings
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  trial_days integer DEFAULT 0,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE subscription_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active subscription products"
  ON subscription_products FOR SELECT
  TO authenticated
  USING (is_active = true);

-- User Subscriptions
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES subscription_products(id) ON DELETE CASCADE NOT NULL,

  -- Subscription status
  status text DEFAULT 'active' CHECK (status IN ('trial', 'active', 'cancelled', 'expired', 'past_due', 'paused')),

  -- Billing
  billing_cycle text NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
  amount numeric(10,2) NOT NULL,
  currency text DEFAULT 'USD',

  -- Period tracking
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,

  -- Trial
  trial_start timestamptz,
  trial_end timestamptz,
  is_trial boolean DEFAULT false,

  -- Cancellation
  cancel_at_period_end boolean DEFAULT false,
  cancelled_at timestamptz,
  cancellation_reason text,

  -- Renewal
  auto_renew boolean DEFAULT true,
  next_billing_date timestamptz,

  -- Payment
  payment_method_id text,
  last_payment_date timestamptz,
  last_payment_status text,

  -- Usage tracking (for AI subscriptions)
  usage_current_period jsonb DEFAULT '{}'::jsonb,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Ensure user can't have duplicate active subscriptions for the same product
  UNIQUE(user_id, product_id, status)
);

ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON user_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own subscriptions"
  ON user_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
  ON user_subscriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Subscription Entitlements (what each subscription grants access to)
CREATE TABLE IF NOT EXISTS subscription_entitlements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id uuid REFERENCES user_subscriptions(id) ON DELETE CASCADE NOT NULL,

  -- Feature access
  feature_type text NOT NULL CHECK (feature_type IN ('market_data', 'ai_feature', 'priority_support', 'advanced_analytics', 'custom_alerts')),
  feature_key text NOT NULL,
  feature_value jsonb,

  -- Limits
  usage_limit integer,
  usage_current integer DEFAULT 0,

  -- Validity
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz,
  is_active boolean DEFAULT true,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE subscription_entitlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own entitlements"
  ON subscription_entitlements FOR SELECT
  TO authenticated
  USING (subscription_id IN (SELECT id FROM user_subscriptions WHERE user_id = auth.uid()));

-- View for active user subscriptions with product details
CREATE OR REPLACE VIEW user_active_subscriptions AS
SELECT
  us.id as subscription_id,
  us.user_id,
  us.status,
  us.billing_cycle,
  us.amount,
  us.current_period_start,
  us.current_period_end,
  us.is_trial,
  us.cancel_at_period_end,
  us.usage_current_period,
  sp.id as product_id,
  sp.product_type,
  sp.name as product_name,
  sp.slug as product_slug,
  sp.description as product_description,
  sp.features as product_features,
  sp.market_type,
  sp.data_features,
  sp.ai_tier,
  sp.ai_features,
  sp.monthly_ai_limit
FROM user_subscriptions us
JOIN subscription_products sp ON us.product_id = sp.id
WHERE us.status IN ('trial', 'active');

-- Insert default subscription products

-- AI Subscriptions
INSERT INTO subscription_products (
  product_type, name, slug, description,
  ai_tier, monthly_ai_limit,
  price_monthly, price_yearly,
  features, ai_features, is_active, sort_order
) VALUES
(
  'ai_subscription',
  'AI Basic',
  'ai-basic',
  'Essential AI trading assistant with basic market analysis',
  'basic',
  50,
  9.99,
  99.99,
  '["Basic AI chat access", "50 messages per month", "Technical analysis", "Market news summaries"]'::jsonb,
  '{"chat_access": true, "technical_analysis": "basic", "economic_analysis": false, "strategic_analysis": false, "chart_analysis": false}'::jsonb,
  true,
  1
),
(
  'ai_subscription',
  'AI Standard',
  'ai-standard',
  'Advanced AI assistant with comprehensive market analysis',
  'standard',
  200,
  29.99,
  299.99,
  '["Full AI chat access", "200 messages per month", "Technical & economic analysis", "Strategic recommendations", "Priority response"]'::jsonb,
  '{"chat_access": true, "technical_analysis": "advanced", "economic_analysis": true, "strategic_analysis": "basic", "chart_analysis": true, "priority_response": true}'::jsonb,
  true,
  2
),
(
  'ai_subscription',
  'AI Premium',
  'ai-premium',
  'Premium AI with unlimited access and advanced features',
  'premium',
  1000,
  79.99,
  799.99,
  '["Unlimited AI chat", "1000 messages per month", "All analysis types", "Custom strategies", "Real-time alerts", "Priority support"]'::jsonb,
  '{"chat_access": true, "technical_analysis": "expert", "economic_analysis": true, "strategic_analysis": "advanced", "chart_analysis": true, "custom_strategies": true, "realtime_alerts": true, "priority_support": true}'::jsonb,
  true,
  3
),
(
  'ai_subscription',
  'AI Unlimited',
  'ai-unlimited',
  'Unlimited AI access for professional traders',
  'unlimited',
  null,
  199.99,
  1999.99,
  '["Truly unlimited AI access", "All premium features", "Dedicated support", "Custom model training", "API access"]'::jsonb,
  '{"chat_access": true, "technical_analysis": "expert", "economic_analysis": true, "strategic_analysis": "expert", "chart_analysis": true, "custom_strategies": true, "realtime_alerts": true, "priority_support": true, "api_access": true, "custom_training": true}'::jsonb,
  true,
  4
);

-- Data Subscriptions by Market
INSERT INTO subscription_products (
  product_type, name, slug, description,
  market_type,
  price_monthly, price_yearly,
  features, data_features, is_active, sort_order
) VALUES
(
  'data_subscription',
  'Stocks Pro',
  'data-stocks',
  'Real-time stock market data and advanced analytics',
  'stocks',
  19.99,
  199.99,
  '["Real-time stock quotes", "Level 2 data", "Historical data (10 years)", "Advanced charts", "Stock screener", "Fundamental data"]'::jsonb,
  '{"realtime_quotes": true, "level2_data": true, "historical_years": 10, "advanced_charts": true, "screener": true, "fundamentals": true, "after_hours": true}'::jsonb,
  true,
  10
),
(
  'data_subscription',
  'Crypto Pro',
  'data-crypto',
  'Comprehensive cryptocurrency market data',
  'crypto',
  14.99,
  149.99,
  '["Real-time crypto prices", "500+ cryptocurrencies", "Order book data", "DeFi analytics", "On-chain metrics", "Market depth"]'::jsonb,
  '{"realtime_quotes": true, "coin_count": 500, "orderbook": true, "defi_analytics": true, "onchain_metrics": true, "market_depth": true}'::jsonb,
  true,
  11
),
(
  'data_subscription',
  'Commodities Pro',
  'data-commodities',
  'Precious metals, energy, and agricultural commodities data',
  'commodities',
  12.99,
  129.99,
  '["Real-time commodity prices", "Futures data", "Spot prices", "Supply/demand data", "Seasonal patterns", "COT reports"]'::jsonb,
  '{"realtime_quotes": true, "futures_data": true, "spot_prices": true, "supply_demand": true, "seasonal_analysis": true, "cot_reports": true}'::jsonb,
  true,
  12
),
(
  'data_subscription',
  'FX Pro',
  'data-fx',
  'Professional foreign exchange market data',
  'fx',
  9.99,
  99.99,
  '["Real-time FX rates", "50+ currency pairs", "Cross rates", "Forward rates", "Central bank data", "Economic calendar"]'::jsonb,
  '{"realtime_quotes": true, "currency_pairs": 50, "cross_rates": true, "forward_rates": true, "central_bank_data": true, "economic_calendar": true}'::jsonb,
  true,
  13
),
(
  'data_subscription',
  'RWA Access',
  'data-rwa',
  'Real-world asset tokenization data and analytics',
  'rwa',
  24.99,
  249.99,
  '["RWA token prices", "Underlying asset tracking", "Custody verification", "Yield analytics", "Regulatory compliance", "Asset verification"]'::jsonb,
  '{"realtime_quotes": true, "asset_tracking": true, "custody_verification": true, "yield_analytics": true, "compliance_data": true, "verification": true}'::jsonb,
  true,
  14
),
(
  'data_subscription',
  'Funds & ETFs Pro',
  'data-funds',
  'Mutual funds and ETF data with holdings and performance',
  'funds',
  16.99,
  169.99,
  '["ETF & fund prices", "Holdings data", "Performance analytics", "Expense ratios", "Distribution data", "Sector allocation"]'::jsonb,
  '{"realtime_quotes": true, "holdings_data": true, "performance_analytics": true, "expense_ratios": true, "distributions": true, "sector_allocation": true}'::jsonb,
  true,
  15
),
(
  'data_subscription',
  'All Markets Bundle',
  'data-all-markets',
  'Complete market data access across all asset classes',
  'all_markets',
  79.99,
  799.99,
  '["All data subscriptions included", "Real-time data for all markets", "Priority data feeds", "Advanced analytics", "Unlimited API calls", "Premium support"]'::jsonb,
  '{"all_markets": true, "realtime_quotes": true, "priority_feeds": true, "advanced_analytics": true, "unlimited_api": true, "premium_support": true}'::jsonb,
  true,
  16
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscription_products_type ON subscription_products(product_type, is_active);
CREATE INDEX IF NOT EXISTS idx_subscription_products_slug ON subscription_products(slug);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_status ON user_subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_product ON user_subscriptions(product_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_period ON user_subscriptions(current_period_end);
CREATE INDEX IF NOT EXISTS idx_subscription_entitlements_subscription ON subscription_entitlements(subscription_id, is_active);
CREATE INDEX IF NOT EXISTS idx_subscription_entitlements_feature ON subscription_entitlements(feature_type, feature_key);
