/*
  # Create Trade Landing Page Features

  1. New Tables
    - `user_trades`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `asset_symbol` (text)
      - `asset_name` (text)
      - `side` (text) - buy/sell
      - `quantity` (numeric)
      - `price` (numeric)
      - `total` (numeric)
      - `order_type` (text)
      - `created_at` (timestamp)
    
    - `recently_viewed_assets`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `asset_symbol` (text)
      - `asset_name` (text)
      - `asset_type` (text) - stock/option/future
      - `viewed_at` (timestamp)
      - Unique constraint on (user_id, asset_symbol)
    
    - `favorite_assets`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `asset_symbol` (text)
      - `asset_name` (text)
      - `asset_type` (text)
      - `created_at` (timestamp)
      - Unique constraint on (user_id, asset_symbol)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create user_trades table
CREATE TABLE IF NOT EXISTS user_trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  asset_symbol text NOT NULL,
  asset_name text NOT NULL,
  side text NOT NULL CHECK (side IN ('buy', 'sell')),
  quantity numeric NOT NULL CHECK (quantity > 0),
  price numeric NOT NULL CHECK (price > 0),
  total numeric NOT NULL,
  order_type text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trades"
  ON user_trades FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trades"
  ON user_trades FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create recently_viewed_assets table
CREATE TABLE IF NOT EXISTS recently_viewed_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  asset_symbol text NOT NULL,
  asset_name text NOT NULL,
  asset_type text NOT NULL DEFAULT 'stock' CHECK (asset_type IN ('stock', 'option', 'future')),
  viewed_at timestamptz DEFAULT now(),
  UNIQUE(user_id, asset_symbol)
);

ALTER TABLE recently_viewed_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recently viewed assets"
  ON recently_viewed_assets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recently viewed assets"
  ON recently_viewed_assets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recently viewed assets"
  ON recently_viewed_assets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own recently viewed assets"
  ON recently_viewed_assets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create favorite_assets table
CREATE TABLE IF NOT EXISTS favorite_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  asset_symbol text NOT NULL,
  asset_name text NOT NULL,
  asset_type text NOT NULL DEFAULT 'stock' CHECK (asset_type IN ('stock', 'option', 'future')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, asset_symbol)
);

ALTER TABLE favorite_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorite assets"
  ON favorite_assets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorite assets"
  ON favorite_assets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorite assets"
  ON favorite_assets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_trades_user_id ON user_trades(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_user_id ON recently_viewed_assets(user_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_favorite_assets_user_id ON favorite_assets(user_id, created_at DESC);
