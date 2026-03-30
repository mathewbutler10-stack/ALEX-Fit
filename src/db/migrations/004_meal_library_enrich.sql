-- APEX Phase 4: Enrich meal_library for planner
ALTER TABLE meal_library ADD COLUMN IF NOT EXISTS ingredients jsonb DEFAULT '[]';
ALTER TABLE meal_library ADD COLUMN IF NOT EXISTS instructions text;
ALTER TABLE meal_library ADD COLUMN IF NOT EXISTS ease_rating integer DEFAULT 3 CHECK (ease_rating BETWEEN 1 AND 5);
ALTER TABLE meal_library ADD COLUMN IF NOT EXISTS prep_time_minutes integer DEFAULT 20;
ALTER TABLE meal_library ADD COLUMN IF NOT EXISTS allergens text[] DEFAULT '{}';
ALTER TABLE meal_library ADD COLUMN IF NOT EXISTS cuisine text DEFAULT 'General';

-- meal_plans table: a plan is a week of assigned meals for a client
CREATE TABLE IF NOT EXISTS meal_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid REFERENCES gyms(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  pt_id uuid REFERENCES pts(id) ON DELETE SET NULL,
  name text DEFAULT 'Weekly Meal Plan',
  week_start date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- meal_plan_slots: each assigned meal on the plan
CREATE TABLE IF NOT EXISTS meal_plan_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid REFERENCES meal_plans(id) ON DELETE CASCADE NOT NULL,
  meal_id uuid REFERENCES meal_library(id) ON DELETE CASCADE NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Mon, 6=Sun
  meal_type text NOT NULL CHECK (meal_type IN ('breakfast','lunch','dinner','snack')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meal_plans: gym access" ON meal_plans FOR ALL
  USING (gym_id = auth_gym_id());
CREATE POLICY "meal_plan_slots: via plan" ON meal_plan_slots FOR ALL
  USING (plan_id IN (SELECT id FROM meal_plans WHERE gym_id = auth_gym_id()));
