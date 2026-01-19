/*
  # Add Fund Asset Type Support

  1. Changes
    - Update `recently_viewed_assets` table to allow 'fund' asset type
    - Update `favorite_assets` table to allow 'fund' asset type
    
  2. Notes
    - Uses ALTER TYPE to add 'fund' to the existing CHECK constraint
    - This is a non-breaking change that extends existing functionality
*/

-- Drop existing check constraints
ALTER TABLE recently_viewed_assets DROP CONSTRAINT IF EXISTS recently_viewed_assets_asset_type_check;
ALTER TABLE favorite_assets DROP CONSTRAINT IF EXISTS favorite_assets_asset_type_check;

-- Add new check constraints with 'fund' included
ALTER TABLE recently_viewed_assets
ADD CONSTRAINT recently_viewed_assets_asset_type_check
CHECK (asset_type IN ('stock', 'option', 'future', 'fund'));

ALTER TABLE favorite_assets
ADD CONSTRAINT favorite_assets_asset_type_check
CHECK (asset_type IN ('stock', 'option', 'future', 'fund'));
