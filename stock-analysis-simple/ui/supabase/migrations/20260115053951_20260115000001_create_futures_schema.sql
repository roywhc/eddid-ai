/*
  # Futures Trading Schema

  ## Overview
  This migration creates the necessary tables and security policies for futures and derivatives trading functionality.

  ## New Tables

  ### `futures_contracts`
  Stores information about available futures contracts
  - `id` (uuid, primary key)
  - `symbol` (text) - Contract symbol (e.g., ES, NQ, CL)
  - `name` (text) - Full contract name
  - `category` (text) - index, commodity, currency, etc.
  - `exchange` (text) - Trading exchange
  - `contract_size` (numeric) - Size per contract
  - `tick_size` (numeric) - Minimum price movement
  - `tick_value` (numeric) - Value per tick
  - `initial_margin` (numeric) - Required initial margin
  - `maintenance_margin` (numeric) - Required maintenance margin
  - `expiry_date` (timestamptz) - Contract expiration date
  - `is_active` (boolean) - Whether contract is actively traded
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `futures_positions`
  Tracks user futures positions
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `contract_id` (uuid, foreign key to futures_contracts)
  - `side` (text) - 'long' or 'short'
  - `quantity` (integer) - Number of contracts
  - `entry_price` (numeric) - Average entry price
  - `current_price` (numeric) - Current market price
  - `unrealized_pnl` (numeric) - Unrealized profit/loss
  - `initial_margin_used` (numeric) - Margin locked for position
  - `maintenance_margin_required` (numeric) - Required maintenance margin
  - `opened_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `futures_orders`
  Records futures orders
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `contract_id` (uuid, foreign key to futures_contracts)
  - `side` (text) - 'buy' or 'sell'
  - `order_type` (text) - 'market', 'limit', 'stop', 'stop_limit'
  - `quantity` (integer)
  - `price` (numeric, nullable) - Limit/stop price
  - `stop_price` (numeric, nullable) - Stop trigger price
  - `filled_quantity` (integer) - Contracts filled
  - `average_fill_price` (numeric, nullable)
  - `status` (text) - 'pending', 'filled', 'partial', 'cancelled'
  - `initial_margin_required` (numeric)
  - `fees` (numeric)
  - `created_at` (timestamptz)
  - `filled_at` (timestamptz, nullable)
  - `cancelled_at` (timestamptz, nullable)

  ### `futures_risk_assessments`
  Tracks user risk assessment and suitability for futures trading
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `assessment_completed` (boolean)
  - `risk_disclosure_accepted` (boolean)
  - `experience_level` (text) - 'beginner', 'intermediate', 'advanced', 'professional'
  - `knowledge_score` (integer) - Score from knowledge test
  - `approved_for_futures` (boolean)
  - `approved_at` (timestamptz, nullable)
  - `assessment_date` (timestamptz)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Users can only access their own positions, orders, and assessments
  - Futures contracts are publicly readable but only admin writable
*/

-- Create futures_contracts table
CREATE TABLE IF NOT EXISTS futures_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text UNIQUE NOT NULL,
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('index', 'commodity', 'currency', 'interest_rate', 'other')),
  exchange text NOT NULL,
  contract_size numeric NOT NULL,
  tick_size numeric NOT NULL,
  tick_value numeric NOT NULL,
  initial_margin numeric NOT NULL,
  maintenance_margin numeric NOT NULL,
  expiry_date timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create futures_positions table
CREATE TABLE IF NOT EXISTS futures_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  contract_id uuid REFERENCES futures_contracts(id) ON DELETE RESTRICT NOT NULL,
  side text NOT NULL CHECK (side IN ('long', 'short')),
  quantity integer NOT NULL CHECK (quantity > 0),
  entry_price numeric NOT NULL CHECK (entry_price > 0),
  current_price numeric NOT NULL CHECK (current_price > 0),
  unrealized_pnl numeric DEFAULT 0,
  initial_margin_used numeric NOT NULL CHECK (initial_margin_used > 0),
  maintenance_margin_required numeric NOT NULL CHECK (maintenance_margin_required > 0),
  opened_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create futures_orders table
CREATE TABLE IF NOT EXISTS futures_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  contract_id uuid REFERENCES futures_contracts(id) ON DELETE RESTRICT NOT NULL,
  side text NOT NULL CHECK (side IN ('buy', 'sell')),
  order_type text NOT NULL CHECK (order_type IN ('market', 'limit', 'stop', 'stop_limit')),
  quantity integer NOT NULL CHECK (quantity > 0),
  price numeric CHECK (price > 0),
  stop_price numeric CHECK (stop_price > 0),
  filled_quantity integer DEFAULT 0 CHECK (filled_quantity >= 0),
  average_fill_price numeric CHECK (average_fill_price > 0),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'filled', 'partial', 'cancelled')),
  initial_margin_required numeric NOT NULL CHECK (initial_margin_required > 0),
  fees numeric DEFAULT 0 CHECK (fees >= 0),
  created_at timestamptz DEFAULT now(),
  filled_at timestamptz,
  cancelled_at timestamptz
);

-- Create futures_risk_assessments table
CREATE TABLE IF NOT EXISTS futures_risk_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  assessment_completed boolean DEFAULT false,
  risk_disclosure_accepted boolean DEFAULT false,
  experience_level text CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'professional')),
  knowledge_score integer CHECK (knowledge_score >= 0 AND knowledge_score <= 100),
  approved_for_futures boolean DEFAULT false,
  approved_at timestamptz,
  assessment_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_futures_contracts_category ON futures_contracts(category);
CREATE INDEX IF NOT EXISTS idx_futures_contracts_is_active ON futures_contracts(is_active);
CREATE INDEX IF NOT EXISTS idx_futures_positions_user_id ON futures_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_futures_positions_contract_id ON futures_positions(contract_id);
CREATE INDEX IF NOT EXISTS idx_futures_orders_user_id ON futures_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_futures_orders_status ON futures_orders(status);
CREATE INDEX IF NOT EXISTS idx_futures_orders_contract_id ON futures_orders(contract_id);
CREATE INDEX IF NOT EXISTS idx_futures_risk_assessments_user_id ON futures_risk_assessments(user_id);

-- Enable Row Level Security
ALTER TABLE futures_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE futures_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE futures_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE futures_risk_assessments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for futures_contracts
-- Anyone can read active contracts
CREATE POLICY "Anyone can view active futures contracts"
  ON futures_contracts
  FOR SELECT
  USING (is_active = true);

-- RLS Policies for futures_positions
CREATE POLICY "Users can view own futures positions"
  ON futures_positions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own futures positions"
  ON futures_positions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own futures positions"
  ON futures_positions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own futures positions"
  ON futures_positions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for futures_orders
CREATE POLICY "Users can view own futures orders"
  ON futures_orders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own futures orders"
  ON futures_orders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own futures orders"
  ON futures_orders
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for futures_risk_assessments
CREATE POLICY "Users can view own risk assessment"
  ON futures_risk_assessments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own risk assessment"
  ON futures_risk_assessments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own risk assessment"
  ON futures_risk_assessments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Insert sample futures contracts
INSERT INTO futures_contracts (symbol, name, category, exchange, contract_size, tick_size, tick_value, initial_margin, maintenance_margin, expiry_date) VALUES
  ('ES', 'S&P 500 Futures', 'index', 'CME', 50, 0.25, 12.50, 12650, 11500, '2026-03-15 00:00:00+00'),
  ('NQ', 'NASDAQ 100 Futures', 'index', 'CME', 20, 0.25, 5.00, 18200, 16500, '2026-03-15 00:00:00+00'),
  ('CL', 'Crude Oil Futures', 'commodity', 'NYMEX', 1000, 0.01, 10.00, 6500, 5900, '2026-02-20 00:00:00+00'),
  ('GC', 'Gold Futures', 'commodity', 'COMEX', 100, 0.10, 10.00, 9350, 8500, '2026-04-27 00:00:00+00'),
  ('SI', 'Silver Futures', 'commodity', 'COMEX', 5000, 0.005, 25.00, 8250, 7500, '2026-05-27 00:00:00+00'),
  ('NG', 'Natural Gas Futures', 'commodity', 'NYMEX', 10000, 0.001, 10.00, 2500, 2275, '2026-01-28 00:00:00+00'),
  ('HSI', 'Hang Seng Index Futures', 'index', 'HKEX', 50, 1, 50, 85000, 68000, '2026-01-29 00:00:00+00'),
  ('NK', 'Nikkei 225 Futures', 'index', 'OSE', 1000, 5, 5000, 1250000, 1000000, '2026-03-12 00:00:00+00')
ON CONFLICT (symbol) DO NOTHING;