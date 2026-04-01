-- Migration 2024040102: Create client_dietary_preferences table (FIXED VERSION)
-- Stores comprehensive dietary preferences, allergies, cooking skills, and constraints for meal planning

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

-- Add column comments
COMMENT ON TABLE client_dietary_preferences IS 'Comprehensive dietary preferences and constraints for meal planning';
COMMENT ON COLUMN client_dietary_preferences.allergies IS 'Medical allergies that require complete avoidance';
COMMENT ON COLUMN client_dietary_preferences.dislikes IS 'Food dislikes/preferences (strong penalty in scoring)';
COMMENT ON COLUMN client_dietary_preferences.dietary_preferences IS 'Dietary choices: vegetarian, vegan, gluten-free, etc.';
COMMENT ON COLUMN client_dietary_preferences.cooking_skill_level IS 'Client cooking skill for difficulty matching';
COMMENT ON COLUMN client_dietary_preferences.equipment_available IS 'Available kitchen equipment for meal filtering';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_client_dietary_preferences_client_id ON client_dietary_preferences(client_id);
CREATE INDEX IF NOT EXISTS idx_client_dietary_preferences_allergies ON client_dietary_preferences USING GIN(allergies);
CREATE INDEX IF NOT EXISTS idx_client_dietary_preferences_dietary_prefs ON client_dietary_preferences USING GIN(dietary_preferences);

-- Enable Row Level Security
ALTER TABLE client_dietary_preferences ENABLE ROW LEVEL SECURITY;

-- SIMPLIFIED RLS Policies (avoid complex subqueries that might fail)

-- Policy 1: Users can access their own preferences
CREATE POLICY "Users can access own dietary preferences" ON client_dietary_preferences
  FOR ALL USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  );

-- Policy 2: PTs can access their clients' preferences
CREATE POLICY "PTs can access client dietary preferences" ON client_dietary_preferences
  FOR ALL USING (
    client_id IN (
      SELECT c.id FROM clients c
      JOIN users u ON u.id = c.pt_id
      WHERE u.id = auth.uid()
    )
  );

-- Policy 3: Gym owners can access all preferences in their gym
CREATE POLICY "Gym owners can access all dietary preferences" ON client_dietary_preferences
  FOR ALL USING (
    client_id IN (
      SELECT c.id FROM clients c
      JOIN users u ON u.id = c.user_id
      WHERE u.gym_id IN (
        SELECT gym_id FROM users WHERE id = auth.uid() AND role = 'owner'
      )
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER client_dietary_preferences_updated_at
  BEFORE UPDATE ON client_dietary_preferences
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

COMMIT;