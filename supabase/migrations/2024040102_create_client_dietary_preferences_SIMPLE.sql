-- Migration 2024040102: Create client_dietary_preferences table (SIMPLE VERSION)
-- Basic table creation without complex RLS for now

BEGIN;

-- Create client_dietary_preferences table
CREATE TABLE IF NOT EXISTS client_dietary_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  
  -- Allergies and restrictions
  allergies text[] DEFAULT '{}',
  dislikes text[] DEFAULT '{}',
  dietary_preferences text[] DEFAULT '{}',
  
  -- Nutritional targets
  target_calories integer,
  target_protein_grams integer,
  target_carbs_grams integer,
  target_fat_grams integer,
  
  -- Cooking constraints
  cooking_skill_level text CHECK (cooking_skill_level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'intermediate',
  available_cooking_time_minutes integer DEFAULT 60,
  equipment_available text[] DEFAULT '{}',
  
  -- Budget and practical constraints
  weekly_budget_dollars decimal(10,2),
  preferred_serving_size integer DEFAULT 1,
  
  -- Meal preferences
  preferred_meal_types text[] DEFAULT '{}',
  avoid_cuisines text[] DEFAULT '{}',
  preferred_cuisines text[] DEFAULT '{}',
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints
  UNIQUE(client_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_client_dietary_preferences_client_id ON client_dietary_preferences(client_id);

-- Enable Row Level Security (we'll add policies separately if needed)
ALTER TABLE client_dietary_preferences ENABLE ROW LEVEL SECURITY;

-- Basic policy: Only authenticated users can access
CREATE POLICY "Enable access for authenticated users" ON client_dietary_preferences
  FOR ALL USING (auth.role() = 'authenticated');

-- Create updated_at trigger (function should already exist)
CREATE TRIGGER client_dietary_preferences_updated_at
  BEFORE UPDATE ON client_dietary_preferences
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

COMMIT;