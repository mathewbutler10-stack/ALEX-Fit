-- Migration 2024040104: Meal generation algorithm functions
-- PostgreSQL functions for deterministic meal scoring and plan generation

BEGIN;

-- Function: Calculate meal score for a client (0-100)
-- Deterministic scoring based on client preferences
CREATE OR REPLACE FUNCTION calculate_meal_score(
  p_meal_id uuid,
  p_client_id uuid,
  OUT score integer,
  OUT exclusion_reason text,
  OUT match_details jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_meal record;
  v_prefs record;
  v_temp_score integer := 100; -- Start with perfect score
  v_exclusion text := NULL;
  v_details jsonb := '{}'::jsonb;
  v_ingredient text;
  v_allergy text;
  v_dislike text;
  v_preference text;
  v_equipment text;
BEGIN
  -- Get meal details
  SELECT * INTO v_meal FROM meal_library WHERE id = p_meal_id;
  IF NOT FOUND THEN
    score := 0;
    exclusion_reason := 'Meal not found';
    match_details := '{"error": "Meal not found"}'::jsonb;
    RETURN;
  END IF;

  -- Get client preferences
  SELECT * INTO v_prefs FROM client_dietary_preferences WHERE client_id = p_client_id;
  IF NOT FOUND THEN
    -- No preferences set, use default scoring
    score := 70; -- Default score for no preferences
    exclusion_reason := NULL;
    match_details := '{"note": "No preferences set, using default score"}'::jsonb;
    RETURN;
  END IF;

  -- 1. Check for allergies (automatic exclusion)
  IF v_prefs.allergies IS NOT NULL AND v_meal.allergens IS NOT NULL THEN
    FOREACH v_allergy IN ARRAY v_prefs.allergies LOOP
      IF v_allergy = ANY(v_meal.allergens) THEN
        score := 0;
        exclusion_reason := 'Contains allergen: ' || v_allergy;
        match_details := jsonb_build_object('allergen', v_allergy, 'excluded', true);
        RETURN;
      END IF;
    END LOOP;
  END IF;

  -- 2. Check for dislikes (heavy penalty)
  IF v_prefs.dislikes IS NOT NULL AND v_meal.ingredients IS NOT NULL THEN
    FOREACH v_dislike IN ARRAY v_prefs.dislikes LOOP
      -- Check if dislike appears in ingredients (simplified check)
      IF v_meal.ingredients::text ILIKE '%' || v_dislike || '%' THEN
        v_temp_score := v_temp_score - 50; -- Heavy penalty for dislikes
        v_details := v_details || jsonb_build_object('dislikes_found', jsonb_build_array(v_dislike));
      END IF;
    END LOOP;
  END IF;

  -- 3. Check dietary preferences match
  IF v_prefs.dietary_preferences IS NOT NULL AND v_meal.dietary_flags IS NOT NULL THEN
    -- Count matching preferences
    DECLARE
      v_matches integer := 0;
      v_total integer := array_length(v_prefs.dietary_preferences, 1);
    BEGIN
      FOREACH v_preference IN ARRAY v_prefs.dietary_preferences LOOP
        IF v_preference = ANY(v_meal.dietary_flags) THEN
          v_matches := v_matches + 1;
        END IF;
      END LOOP;
      
      IF v_total > 0 THEN
        IF v_matches = v_total THEN
          v_temp_score := v_temp_score + 20; -- Perfect match bonus
          v_details := v_details || jsonb_build_object('dietary_match', 'perfect', 'matches', v_matches, 'total', v_total);
        ELSIF v_matches > 0 THEN
          v_temp_score := v_temp_score + 10; -- Partial match bonus
          v_details := v_details || jsonb_build_object('dietary_match', 'partial', 'matches', v_matches, 'total', v_total);
        ELSE
          v_temp_score := v_temp_score - 10; -- No match penalty
          v_details := v_details || jsonb_build_object('dietary_match', 'none', 'matches', 0, 'total', v_total);
        END IF;
      END IF;
    END;
  END IF;

  -- 4. Check cooking skill compatibility
  IF v_meal.difficulty = 'easy' AND v_prefs.cooking_skill_level = 'beginner' THEN
    v_temp_score := v_temp_score + 15; -- Bonus for easy meals for beginners
    v_details := v_details || jsonb_build_object('skill_match', 'excellent');
  ELSIF v_meal.difficulty = 'hard' AND v_prefs.cooking_skill_level = 'beginner' THEN
    v_temp_score := v_temp_score - 20; -- Penalty for hard meals for beginners
    v_details := v_details || jsonb_build_object('skill_match', 'poor');
  END IF;

  -- 5. Check prep time vs available time
  IF v_meal.prep_time_minutes IS NOT NULL AND v_prefs.available_cooking_time_minutes IS NOT NULL THEN
    IF v_meal.prep_time_minutes <= v_prefs.available_cooking_time_minutes THEN
      v_temp_score := v_temp_score + 10; -- Bonus for fitting within available time
      v_details := v_details || jsonb_build_object('time_match', 'good');
    ELSE
      v_temp_score := v_temp_score - 15; -- Penalty for exceeding available time
      v_details := v_details || jsonb_build_object('time_match', 'exceeds');
    END IF;
  END IF;

  -- 6. Check equipment availability
  IF v_meal.equipment_required IS NOT NULL AND v_prefs.equipment_available IS NOT NULL THEN
    FOREACH v_equipment IN ARRAY v_meal.equipment_required LOOP
      IF NOT (v_equipment = ANY(v_prefs.equipment_available)) THEN
        v_temp_score := v_temp_score - 25; -- Penalty for missing equipment
        v_details := v_details || jsonb_build_object('missing_equipment', v_equipment);
        EXIT;
      END IF;
    END LOOP;
  END IF;

  -- 7. Check calorie appropriateness (simplified)
  IF v_meal.calories IS NOT NULL AND v_prefs.target_calories IS NOT NULL THEN
    DECLARE
      v_calorie_diff integer := ABS(v_meal.calories - v_prefs.target_calories);
      v_percent_diff float := v_calorie_diff::float / GREATEST(v_prefs.target_calories, 1);
    BEGIN
      IF v_percent_diff < 0.1 THEN -- Within 10%
        v_temp_score := v_temp_score + 15;
        v_details := v_details || jsonb_build_object('calorie_match', 'excellent', 'percent_diff', round(v_percent_diff * 100, 1));
      ELSIF v_percent_diff < 0.25 THEN -- Within 25%
        v_temp_score := v_temp_score + 5;
        v_details := v_details || jsonb_build_object('calorie_match', 'good', 'percent_diff', round(v_percent_diff * 100, 1));
      ELSE
        v_temp_score := v_temp_score - 10;
        v_details := v_details || jsonb_build_object('calorie_match', 'poor', 'percent_diff', round(v_percent_diff * 100, 1));
      END IF;
    END;
  END IF;

  -- Ensure score is within 0-100 bounds
  v_temp_score := GREATEST(0, LEAST(100, v_temp_score));
  
  -- Return results
  score := v_temp_score;
  exclusion_reason := v_exclusion;
  match_details := v_details;
END;
$$;

-- Function: Generate meal recommendations for a client
CREATE OR REPLACE FUNCTION generate_meal_recommendations(
  p_client_id uuid,
  p_meal_type text DEFAULT NULL,
  p_limit integer DEFAULT 10
)
RETURNS TABLE (
  meal_id uuid,
  meal_name text,
  meal_type text,
  score integer,
  exclusion_reason text,
  match_details jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ml.id as meal_id,
    ml.name as meal_name,
    ml.meal_type,
    (calculate_meal_score(ml.id, p_client_id)).score,
    (calculate_meal_score(ml.id, p_client_id)).exclusion_reason,
    (calculate_meal_score(ml.id, p_client_id)).match_details
  FROM meal_library ml
  WHERE (p_meal_type IS NULL OR ml.meal_type = p_meal_type)
    AND (calculate_meal_score(ml.id, p_client_id)).score > 0
  ORDER BY (calculate_meal_score(ml.id, p_client_id)).score DESC
  LIMIT p_limit;
END;
$$;

-- Function: Generate weekly meal plan for a client
CREATE OR REPLACE FUNCTION generate_weekly_meal_plan(
  p_client_id uuid,
  p_start_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  day_of_week integer,
  meal_type text,
  meal_id uuid,
  meal_name text,
  score integer,
  total_calories integer,
  total_protein integer,
  total_carbs integer,
  total_fat integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_day integer;
  v_meal_type text;
  v_meal_record record;
  v_meal_types text[] := ARRAY['breakfast', 'lunch', 'dinner', 'snack'];
BEGIN
  -- For each day (0=Sunday to 6=Saturday)
  FOR v_day IN 0..6 LOOP
    -- For each meal type
    FOREACH v_meal_type IN ARRAY v_meal_types LOOP
      -- Get top recommendation for this meal type
      SELECT * INTO v_meal_record
      FROM generate_meal_recommendations(p_client_id, v_meal_type, 1)
      LIMIT 1;
      
      IF FOUND THEN
        -- Get nutritional info for the meal
        SELECT 
          v_meal_record.meal_id,
          v_meal_record.meal_name,
          v_meal_record.score,
          COALESCE(ml.calories, 0),
          COALESCE(ml.protein, 0),
          COALESCE(ml.carbs, 0),
          COALESCE(ml.fat, 0)
        INTO 
          meal_id,
          meal_name,
          score,
          total_calories,
          total_protein,
          total_carbs,
          total_fat
        FROM meal_library ml
        WHERE ml.id = v_meal_record.meal_id;
        
        day_of_week := v_day;
        meal_type := v_meal_type;
        RETURN NEXT;
      END IF;
    END LOOP;
  END LOOP;
END;
$$;

-- Function: Generate grocery list from meal plan
CREATE OR REPLACE FUNCTION generate_grocery_list(
  p_meal_plan_id uuid
)
RETURNS uuid -- Returns the grocery list ID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_id uuid;
  v_grocery_list_id uuid;
  v_meal_record record;
BEGIN
  -- Get client from meal plan
  SELECT client_id INTO v_client_id FROM meal_plans WHERE id = p_meal_plan_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Meal plan not found';
  END IF;

  -- Create grocery list
  INSERT INTO grocery_lists (client_id, meal_plan_id, name, week_start_date)
  VALUES (
    v_client_id,
    p_meal_plan_id,
    'Grocery List - Week of ' || TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD'),
    DATE_TRUNC('week', CURRENT_DATE)::date
  )
  RETURNING id INTO v_grocery_list_id;

  -- TODO: In a real implementation, this would:
  -- 1. Aggregate ingredients from all meals in the plan
  -- 2. Group by ingredient, sum quantities
  -- 3. Categorize items
  -- 4. Insert into grocery_list_items

  -- For now, return the list ID
  RETURN v_grocery_list_id;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION calculate_meal_score TO authenticated;
GRANT EXECUTE ON FUNCTION generate_meal_recommendations TO authenticated;
GRANT EXECUTE ON FUNCTION generate_weekly_meal_plan TO authenticated;
GRANT EXECUTE ON FUNCTION generate_grocery_list TO authenticated;

COMMIT;