-- Migration: Meal Rating System
-- Date: 2025-04-01
-- Description: Adds meal rating functionality to APEX

-- Add rating columns to meal_library table
ALTER TABLE meal_library 
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;

-- Create meal_ratings table
CREATE TABLE IF NOT EXISTS meal_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  meal_id UUID NOT NULL REFERENCES meal_library(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  quick_feedback TEXT CHECK (quick_feedback IN ('loved', 'too_spicy', 'will_make_again', 'too_complicated')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(client_id, meal_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_meal_ratings_meal_id ON meal_ratings(meal_id);
CREATE INDEX IF NOT EXISTS idx_meal_ratings_client_id ON meal_ratings(client_id);
CREATE INDEX IF NOT EXISTS idx_meal_ratings_created_at ON meal_ratings(created_at DESC);

-- Create function to update meal average rating
CREATE OR REPLACE FUNCTION update_meal_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate average rating and count for the meal
  UPDATE meal_library
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM meal_ratings
      WHERE meal_id = NEW.meal_id
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM meal_ratings
      WHERE meal_id = NEW.meal_id
    ),
    updated_at = NOW()
  WHERE id = NEW.meal_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update meal rating when ratings change
DROP TRIGGER IF EXISTS update_meal_rating_trigger ON meal_ratings;
CREATE TRIGGER update_meal_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON meal_ratings
FOR EACH ROW
EXECUTE FUNCTION update_meal_rating();

-- Create meal_insights view
CREATE OR REPLACE VIEW meal_insights AS
SELECT 
  ml.id AS meal_id,
  ml.name AS meal_name,
  ml.average_rating,
  ml.rating_count,
  COUNT(DISTINCT mps.id) AS total_servings,
  COALESCE(
    jsonb_object_agg(
      'loved', COUNT(CASE WHEN mr.quick_feedback = 'loved' THEN 1 END)
    ) || 
    jsonb_object_agg(
      'too_spicy', COUNT(CASE WHEN mr.quick_feedback = 'too_spicy' THEN 1 END)
    ) ||
    jsonb_object_agg(
      'will_make_again', COUNT(CASE WHEN mr.quick_feedback = 'will_make_again' THEN 1 END)
    ) ||
    jsonb_object_agg(
      'too_complicated', COUNT(CASE WHEN mr.quick_feedback = 'too_complicated' THEN 1 END)
    ),
    '{"loved": 0, "too_spicy": 0, "will_make_again": 0, "too_complicated": 0}'::jsonb
  ) AS quick_feedback_counts,
  ARRAY_AGG(DISTINCT 
    CASE 
      WHEN mr.feedback IS NOT NULL AND LENGTH(mr.feedback) > 0 
      THEN LOWER(SUBSTRING(mr.feedback FROM 1 FOR 50))
    END
  ) FILTER (WHERE mr.feedback IS NOT NULL) AS common_feedback_themes,
  ml.meal_type,
  ml.cuisine,
  ml.difficulty,
  ml.gym_id
FROM meal_library ml
LEFT JOIN meal_plan_slots mps ON ml.id = mps.meal_id
LEFT JOIN meal_ratings mr ON ml.id = mr.meal_id
GROUP BY ml.id, ml.name, ml.average_rating, ml.rating_count, ml.meal_type, ml.cuisine, ml.difficulty, ml.gym_id;

-- Create client_meal_preferences view
CREATE OR REPLACE VIEW client_meal_preferences AS
SELECT 
  c.id AS client_id,
  c.user_id,
  c.gym_id,
  c.assigned_pt_id,
  jsonb_agg(
    jsonb_build_object(
      'meal_id', mr.meal_id,
      'rating', mr.rating,
      'feedback', mr.feedback,
      'quick_feedback', mr.quick_feedback,
      'rated_at', mr.created_at
    )
    ORDER BY mr.created_at DESC
  ) AS meal_ratings,
  COUNT(mr.id) AS total_ratings,
  COALESCE(AVG(mr.rating), 0) AS average_rating_given,
  COUNT(DISTINCT 
    CASE 
      WHEN mr.rating >= 4 THEN mr.meal_id 
    END
  ) AS loved_meals_count,
  COUNT(DISTINCT 
    CASE 
      WHEN mr.rating <= 2 THEN mr.meal_id 
    END
  ) AS disliked_meals_count
FROM clients c
LEFT JOIN meal_ratings mr ON c.id = mr.client_id
GROUP BY c.id, c.user_id, c.gym_id, c.assigned_pt_id;

-- Create function to get meal recommendations with ratings
CREATE OR REPLACE FUNCTION get_meal_recommendations_with_ratings(
  p_client_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  meal_id UUID,
  meal_name TEXT,
  meal_type TEXT,
  cuisine TEXT,
  difficulty TEXT,
  prep_time_minutes INTEGER,
  calories INTEGER,
  average_rating DECIMAL(3,2),
  rating_count INTEGER,
  client_rating INTEGER,
  recommendation_score DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  WITH client_prefs AS (
    SELECT 
      allergies,
      dislikes,
      dietary_preferences,
      cooking_skill,
      available_time_minutes,
      has_oven,
      has_blender
    FROM client_dietary_preferences
    WHERE client_id = p_client_id
  ),
  client_ratings AS (
    SELECT meal_id, rating
    FROM meal_ratings
    WHERE client_id = p_client_id
  )
  SELECT 
    ml.id,
    ml.name,
    ml.meal_type,
    ml.cuisine,
    ml.difficulty,
    ml.prep_time_minutes,
    ml.calories,
    ml.average_rating,
    ml.rating_count,
    cr.rating AS client_rating,
    -- Simplified recommendation score calculation
    CASE
      WHEN cr.rating IS NOT NULL THEN
        -- If client has rated this meal, use their rating (scaled to 0-100)
        cr.rating * 20.0
      ELSE
        -- Otherwise use average rating (scaled to 0-100) with bonus for highly rated meals
        COALESCE(ml.average_rating * 20.0, 50.0) + 
        CASE WHEN ml.rating_count >= 10 THEN 10.0 ELSE 0.0 END
    END AS recommendation_score
  FROM meal_library ml
  LEFT JOIN client_ratings cr ON ml.id = cr.meal_id
  CROSS JOIN client_prefs cp
  WHERE ml.gym_id = (SELECT gym_id FROM clients WHERE id = p_client_id)
    AND ml.is_global = false
    -- Exclude meals the client rated 1 or 2 stars
    AND (cr.rating IS NULL OR cr.rating >= 3)
  ORDER BY recommendation_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Create grocery_lists table
CREATE TABLE IF NOT EXISTS grocery_lists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meal_plan_id UUID NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'shopped', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create grocery_list_items table
CREATE TABLE IF NOT EXISTS grocery_list_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  grocery_list_id UUID NOT NULL REFERENCES grocery_lists(id) ON DELETE CASCADE,
  ingredient_name TEXT NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL,
  purchased BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for grocery lists
CREATE INDEX IF NOT EXISTS idx_grocery_lists_meal_plan_id ON grocery_lists(meal_plan_id);
CREATE INDEX IF NOT EXISTS idx_grocery_lists_client_id ON grocery_lists(client_id);
CREATE INDEX IF NOT EXISTS idx_grocery_list_items_grocery_list_id ON grocery_list_items(grocery_list_id);
CREATE INDEX IF NOT EXISTS idx_grocery_list_items_category ON grocery_list_items(category);

-- Create function to generate grocery list from meal plan
CREATE OR REPLACE FUNCTION generate_grocery_list_from_meal_plan(
  p_meal_plan_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_client_id UUID;
  v_grocery_list_id UUID;
  v_ingredients JSONB;
BEGIN
  -- Get client ID from meal plan
  SELECT client_id INTO v_client_id
  FROM meal_plans
  WHERE id = p_meal_plan_id;
  
  IF v_client_id IS NULL THEN
    RAISE EXCEPTION 'Meal plan not found';
  END IF;
  
  -- Aggregate ingredients from all meals in the plan
  SELECT jsonb_agg(
    jsonb_build_object(
      'ingredient_name', ingredient->>'name',
      'category', 
        CASE 
          WHEN LOWER(ingredient->>'name') LIKE '%chicken%' OR 
               LOWER(ingredient->>'name') LIKE '%beef%' OR 
               LOWER(ingredient->>'name') LIKE '%fish%' OR 
               LOWER(ingredient->>'name') LIKE '%tofu%' THEN 'protein'
          WHEN LOWER(ingredient->>'name') LIKE '%broccoli%' OR 
               LOWER(ingredient->>'name') LIKE '%spinach%' OR 
               LOWER(ingredient->>'name') LIKE '%carrot%' OR 
               LOWER(ingredient->>'name') LIKE '%tomato%' THEN 'produce'
          WHEN LOWER(ingredient->>'name') LIKE '%milk%' OR 
               LOWER(ingredient->>'name') LIKE '%yogurt%' OR 
               LOWER(ingredient->>'name') LIKE '%cheese%' THEN 'dairy'
          WHEN LOWER(ingredient->>'name') LIKE '%rice%' OR 
               LOWER(ingredient->>'name') LIKE '%pasta%' OR 
               LOWER(ingredient->>'name') LIKE '%bread%' OR 
               LOWER(ingredient->>'name') LIKE '%oats%' THEN 'grains'
          WHEN LOWER(ingredient->>'name') LIKE '%oil%' OR 
               LOWER(ingredient->>'name') LIKE '%salt%' OR 
               LOWER(ingredient->>'name') LIKE '%pepper%' OR 
               LOWER(ingredient->>'name') LIKE '%spice%' THEN 'pantry'
          ELSE 'other'
        END,
      'amount', (ingredient->>'amount')::DECIMAL,
      'unit', ingredient->>'unit'
    )
  ) INTO v_ingredients
  FROM (
    SELECT jsonb_array_elements(ml.ingredients) AS ingredient
    FROM meal_plan_slots mps
    JOIN meal_library ml ON mps.meal_id = ml.id
    WHERE mps.meal_plan_id = p_meal_plan_id
  ) AS all_ingredients;
  
  -- Create grocery list
  INSERT INTO grocery_lists (meal_plan_id, client_id, items)
  VALUES (p_meal_plan_id, v_client_id, COALESCE(v_ingredients, '[]'::jsonb))
  RETURNING id INTO v_grocery_list_id;
  
  -- Insert individual items for easier querying
  INSERT INTO grocery_list_items (grocery_list_id, ingredient_name, category, amount, unit)
  SELECT 
    v_grocery_list_id,
    item->>'ingredient_name',
    item->>'category',
    (item->>'amount')::DECIMAL,
    item->>'unit'
  FROM jsonb_array_elements(
    (SELECT items FROM grocery_lists WHERE id = v_grocery_list_id)
  ) AS item;
  
  RETURN v_grocery_list_id;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies for new tables
ALTER TABLE meal_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_list_items ENABLE ROW LEVEL SECURITY;

-- RLS policy for meal_ratings
CREATE POLICY "Users can view their own meal ratings" ON meal_ratings
  FOR SELECT USING (
    auth.uid() = client_id OR
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = meal_ratings.client_id 
      AND clients.assigned_pt_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'owner'
      AND users.gym_id = (
        SELECT gym_id FROM clients WHERE clients.id = meal_ratings.client_id
      )
    )
  );

CREATE POLICY "Users can create their own meal ratings" ON meal_ratings
  FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Users can update their own meal ratings" ON meal_ratings
  FOR UPDATE USING (auth.uid() = client_id);

-- RLS policy for grocery_lists
CREATE POLICY "Users can view their own grocery lists" ON grocery_lists
  FOR SELECT USING (
    auth.uid() = client_id OR
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = grocery_lists.client_id 
      AND clients.assigned_pt_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'owner'
      AND users.gym_id = (
        SELECT gym_id FROM clients WHERE clients.id = grocery_lists.client_id
      )
    )
  );

CREATE POLICY "PTs and owners can create grocery lists" ON grocery_lists
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('pt', 'owner')
    )
  );

-- RLS policy for grocery_list_items
CREATE POLICY "Users can view items from their grocery lists" ON grocery_list_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM grocery_lists gl
      WHERE gl.id = grocery_list_items.grocery_list_id
      AND (
        gl.client_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM clients 
          WHERE clients.id = gl.client_id 
          AND clients.assigned_pt_id = auth.uid()
        ) OR
        EXISTS (
          SELECT 1 FROM users 
          WHERE users.id = auth.uid() 
          AND users.role = 'owner'
          AND users.gym_id = (
            SELECT gym_id FROM clients WHERE clients.id = gl.client_id
          )
        )
      )
    )
  );

-- Update existing meal-generation-algorithm.ts with rating support
-- Note: This is a SQL comment - the actual TypeScript update should be done in the codebase
-- The algorithm should be enhanced to consider:
-- 1. Client's previous ratings (exclude meals rated ≤2 stars)
-- 2. Global average ratings (weighted 30% of score)
-- 3. Exploration bonus for new/unrated meals

-- Migration complete message
COMMENT ON TABLE meal_ratings IS 'Stores client ratings for meals (1-5 stars) with optional feedback';
COMMENT ON TABLE grocery_lists IS 'Shopping lists generated from meal plans';
COMMENT ON VIEW meal_insights IS 'Aggregated meal performance analytics for PTs/owners';
COMMENT ON VIEW client_meal_preferences IS 'Client meal rating history and preferences';