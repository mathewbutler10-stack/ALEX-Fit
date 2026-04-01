-- Migration 2024040101: Enhance meal_library table for Smart Meal Planner
-- Adds columns for meal difficulty, prep time, dietary flags, cuisine, and additional metadata

BEGIN;

-- Add new columns to meal_library for enhanced filtering and meal generation
ALTER TABLE meal_library 
ADD COLUMN IF NOT EXISTS prep_time_minutes integer,
ADD COLUMN IF NOT EXISTS difficulty text CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS dietary_flags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS cuisine text,
ADD COLUMN IF NOT EXISTS ingredients jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS instructions text,
ADD COLUMN IF NOT EXISTS ease_rating integer CHECK (ease_rating BETWEEN 1 AND 5),
ADD COLUMN IF NOT EXISTS allergens text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS equipment_required text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Add column comments for documentation
COMMENT ON COLUMN meal_library.prep_time_minutes IS 'Total preparation and cooking time in minutes';
COMMENT ON COLUMN meal_library.difficulty IS 'Cooking difficulty: easy, medium, hard';
COMMENT ON COLUMN meal_library.dietary_flags IS 'Dietary flags: vegetarian, vegan, gluten-free, dairy-free, nut-free, etc.';
COMMENT ON COLUMN meal_library.cuisine IS 'Cuisine type: Italian, Mexican, Asian, etc.';
COMMENT ON COLUMN meal_library.ingredients IS 'Structured ingredients with quantities and units';
COMMENT ON COLUMN meal_library.instructions IS 'Step-by-step cooking instructions';
COMMENT ON COLUMN meal_library.ease_rating IS 'User-rated ease of preparation (1-5)';
COMMENT ON COLUMN meal_library.allergens IS 'Common allergens present: gluten, dairy, nuts, shellfish, etc.';
COMMENT ON COLUMN meal_library.equipment_required IS 'Required equipment: oven, blender, microwave, etc.';
COMMENT ON COLUMN meal_library.tags IS 'Search tags: quick, healthy, kid-friendly, meal-prep, etc.';

-- Create indexes for faster filtering
CREATE INDEX IF NOT EXISTS idx_meal_library_difficulty ON meal_library(difficulty);
CREATE INDEX IF NOT EXISTS idx_meal_library_prep_time ON meal_library(prep_time_minutes);
CREATE INDEX IF NOT EXISTS idx_meal_library_cuisine ON meal_library(cuisine);
CREATE INDEX IF NOT EXISTS idx_meal_library_dietary_flags ON meal_library USING GIN(dietary_flags);
CREATE INDEX IF NOT EXISTS idx_meal_library_tags ON meal_library USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_meal_library_allergens ON meal_library USING GIN(allergens);

-- Update existing meals with default values where needed
UPDATE meal_library 
SET 
  prep_time_minutes = COALESCE(prep_time_minutes, 30),
  difficulty = COALESCE(difficulty, 'medium'),
  dietary_flags = COALESCE(dietary_flags, '{}'),
  tags = COALESCE(tags, '{}')
WHERE prep_time_minutes IS NULL OR difficulty IS NULL;

COMMIT;