-- Migration to add tag array support for settings and locations
-- This allows comma-separated tags to be stored as PostgreSQL arrays

-- Update settings table to use arrays for mood and theme
ALTER TABLE settings 
  ALTER COLUMN mood TYPE TEXT[] USING string_to_array(COALESCE(mood, ''), ','),
  ALTER COLUMN theme TYPE TEXT[] USING string_to_array(COALESCE(theme, ''), ',');

-- Set default values for new array columns
ALTER TABLE settings 
  ALTER COLUMN mood SET DEFAULT '{}',
  ALTER COLUMN theme SET DEFAULT '{}';

-- Update locations table to use arrays for ambiance and lighting  
ALTER TABLE locations
  ALTER COLUMN ambiance TYPE TEXT[] USING string_to_array(COALESCE(ambiance, ''), ','),
  ALTER COLUMN lighting TYPE TEXT[] USING string_to_array(COALESCE(lighting, ''), ',');

-- Set default values for new array columns
ALTER TABLE locations
  ALTER COLUMN ambiance SET DEFAULT '{}',
  ALTER COLUMN lighting SET DEFAULT '{}';

-- Clean up any empty string elements that may have been created
UPDATE settings 
SET 
  mood = array_remove(mood, ''),
  theme = array_remove(theme, '');

UPDATE locations 
SET 
  ambiance = array_remove(ambiance, ''),
  lighting = array_remove(lighting, '');

-- Add comments for documentation
COMMENT ON COLUMN settings.mood IS 'Array of mood tags (e.g. {cozy, mysterious, energetic})';
COMMENT ON COLUMN settings.theme IS 'Array of theme tags (e.g. {romantic, adventure, mystery})';
COMMENT ON COLUMN locations.ambiance IS 'Array of ambiance tags (e.g. {peaceful, bustling, eerie})';
COMMENT ON COLUMN locations.lighting IS 'Array of lighting tags (e.g. {dim, bright, candlelight})';