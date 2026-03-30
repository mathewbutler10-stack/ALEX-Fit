-- =============================================================================
-- APEX PT Platform - Schema Migration 001
-- Creates all core tables, helper functions, triggers, and RLS policies
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- TABLES
-- ---------------------------------------------------------------------------

-- 1. gyms
CREATE TABLE IF NOT EXISTS gyms (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  abn         text,
  logo_url    text,
  owner_id    uuid,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- 2. users
CREATE TABLE IF NOT EXISTS users (
  id          uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email       text NOT NULL,
  role        text NOT NULL CHECK (role IN ('owner', 'pt', 'client')),
  full_name   text,
  avatar_url  text,
  status      text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  gym_id      uuid REFERENCES gyms(id),
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- 3. pts
CREATE TABLE IF NOT EXISTS pts (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  gym_id              uuid NOT NULL REFERENCES gyms(id),
  abn                 text,
  phone               text,
  address             text,
  suburb              text,
  state               text,
  postcode            text,
  bio                 text,
  specialisations     text[] DEFAULT '{}',
  rating              decimal(3,2) DEFAULT 0,
  payout_tier         text DEFAULT 'Bronze',
  payout_rate         decimal(10,2) DEFAULT 0,
  max_clients         int DEFAULT 20,
  prefers_virtual     bool DEFAULT true,
  prefers_in_person   bool DEFAULT false,
  prefers_nutrition   bool DEFAULT false,
  joined_date         date DEFAULT CURRENT_DATE,
  status              text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

-- 4. clients
CREATE TABLE IF NOT EXISTS clients (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  gym_id                    uuid NOT NULL REFERENCES gyms(id),
  assigned_pt_id            uuid REFERENCES pts(id),
  subscription_type         text,
  subscription_id           uuid,
  phone                     text,
  mobile                    text,
  address                   text,
  date_of_birth             date,
  preferred_contact         text,
  preferred_contact_detail  text,
  contact_notes             text,
  emergency_name            text,
  emergency_phone           text,
  emergency_rel             text,
  calorie_goal              int DEFAULT 2000,
  protein_goal              int DEFAULT 150,
  carbs_goal                int DEFAULT 200,
  fat_goal                  int DEFAULT 65,
  weekly_workout_goal       int DEFAULT 3,
  goals                     text,
  context                   text,
  motivation                text,
  pt_notes                  text,
  at_risk                   bool DEFAULT false,
  last_login_at             timestamptz,
  created_at                timestamptz DEFAULT now(),
  updated_at                timestamptz DEFAULT now()
);

-- 5. meal_library
CREATE TABLE IF NOT EXISTS meal_library (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  calories    int NOT NULL,
  protein     int NOT NULL,
  carbs       int NOT NULL,
  fat         int NOT NULL,
  tags        text[] DEFAULT '{}',
  ingredients text[] DEFAULT '{}',
  created_by  uuid REFERENCES users(id),
  is_global   bool DEFAULT false,
  gym_id      uuid REFERENCES gyms(id),
  created_at  timestamptz DEFAULT now()
);

-- 6. weekly_meal_plans
CREATE TABLE IF NOT EXISTS weekly_meal_plans (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id           uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  pt_id               uuid NOT NULL REFERENCES pts(id),
  gym_id              uuid NOT NULL REFERENCES gyms(id),
  week_start          date NOT NULL,
  day                 text NOT NULL,
  meal_type           text NOT NULL,
  meal_id             uuid REFERENCES meal_library(id),
  client_swap_meal_id uuid,
  created_at          timestamptz DEFAULT now()
);

-- 7. food_log
CREATE TABLE IF NOT EXISTS food_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  gym_id      uuid NOT NULL REFERENCES gyms(id),
  log_date    date NOT NULL DEFAULT CURRENT_DATE,
  meal_id     uuid,
  name        text NOT NULL,
  calories    int NOT NULL DEFAULT 0,
  protein     int NOT NULL DEFAULT 0,
  carbs       int NOT NULL DEFAULT 0,
  fat         int NOT NULL DEFAULT 0,
  source      text DEFAULT 'manual',
  created_at  timestamptz DEFAULT now()
);

-- 8. food_favourites
CREATE TABLE IF NOT EXISTS food_favourites (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  meal_id     uuid,
  name        text NOT NULL,
  calories    int NOT NULL DEFAULT 0,
  protein     int NOT NULL DEFAULT 0,
  carbs       int NOT NULL DEFAULT 0,
  fat         int NOT NULL DEFAULT 0,
  sort_order  int DEFAULT 0
);

-- 9. workouts
CREATE TABLE IF NOT EXISTS workouts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id      uuid REFERENCES gyms(id),
  name        text NOT NULL,
  focus       text,
  difficulty  text,
  description text,
  exercises   text[] DEFAULT '{}',
  created_by  uuid REFERENCES users(id),
  is_global   bool DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

-- 10. client_workouts
CREATE TABLE IF NOT EXISTS client_workouts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  workout_id  uuid NOT NULL REFERENCES workouts(id),
  assigned_by uuid REFERENCES users(id),
  sort_order  int DEFAULT 0,
  assigned_at timestamptz DEFAULT now()
);

-- 11. appointments
CREATE TABLE IF NOT EXISTS appointments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  pt_id       uuid NOT NULL REFERENCES pts(id),
  gym_id      uuid NOT NULL REFERENCES gyms(id),
  title       text NOT NULL,
  type        text DEFAULT 'virtual',
  date        date NOT NULL,
  start_time  time NOT NULL,
  end_time    time NOT NULL,
  location    text,
  notes       text,
  status      text DEFAULT 'confirmed',
  ics_uid     text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- 12. messages
CREATE TABLE IF NOT EXISTS messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  gym_id      uuid NOT NULL REFERENCES gyms(id),
  sender_id   uuid NOT NULL REFERENCES users(id),
  sender_role text NOT NULL,
  text        text NOT NULL,
  read_at     timestamptz,
  created_at  timestamptz DEFAULT now()
);

-- 13. subscription_plans
CREATE TABLE IF NOT EXISTS subscription_plans (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id            uuid NOT NULL REFERENCES gyms(id),
  name              text NOT NULL,
  description       text,
  monthly_price     decimal(10,2) DEFAULT 0,
  quarterly_price   decimal(10,2) DEFAULT 0,
  annual_price      decimal(10,2) DEFAULT 0,
  setup_fee         decimal(10,2) DEFAULT 0,
  currency          text DEFAULT 'AUD',
  features          text[] DEFAULT '{}',
  color             text,
  active            bool DEFAULT true,
  stripe_product_id text,
  created_at        timestamptz DEFAULT now()
);

-- 14. subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id             uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  gym_id                uuid NOT NULL REFERENCES gyms(id),
  plan_id               uuid NOT NULL REFERENCES subscription_plans(id),
  frequency             text DEFAULT 'monthly',
  status                text DEFAULT 'active',
  stripe_sub_id         text,
  current_period_start  date,
  current_period_end    date,
  discount_code_id      uuid,
  created_at            timestamptz DEFAULT now()
);

-- 15. discount_codes
CREATE TABLE IF NOT EXISTS discount_codes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id      uuid NOT NULL REFERENCES gyms(id),
  code        text NOT NULL,
  description text,
  type        text DEFAULT 'percent',
  value       decimal(10,2) NOT NULL,
  frequency   text,
  applies_to  uuid[] DEFAULT '{}',
  max_uses    int,
  used_count  int DEFAULT 0,
  valid_until date,
  active      bool DEFAULT true,
  UNIQUE (gym_id, code)
);

-- 16. perks
CREATE TABLE IF NOT EXISTS perks (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id           uuid NOT NULL REFERENCES gyms(id),
  category         text,
  partner_name     text NOT NULL,
  description      text,
  discount_code    text,
  price            text,
  applicable_subs  text[] DEFAULT '{}',
  active           bool DEFAULT true,
  created_at       timestamptz DEFAULT now()
);

-- 17. broadcast_messages
CREATE TABLE IF NOT EXISTS broadcast_messages (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id           uuid NOT NULL REFERENCES gyms(id),
  owner_id         uuid NOT NULL REFERENCES users(id),
  type             text NOT NULL,
  audience         text NOT NULL,
  subject          text NOT NULL,
  body             text NOT NULL,
  sent_at          timestamptz DEFAULT now(),
  recipient_count  int DEFAULT 0
);

-- 18. new_signups
CREATE TABLE IF NOT EXISTS new_signups (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id          uuid NOT NULL REFERENCES gyms(id),
  name            text NOT NULL,
  email           text NOT NULL,
  preferred_sub   text,
  signup_date     date DEFAULT CURRENT_DATE,
  assigned_pt_id  uuid,
  status          text DEFAULT 'pending',
  created_at      timestamptz DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- HELPER FUNCTIONS
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION auth_gym_id()
RETURNS uuid AS $$
  SELECT gym_id FROM users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION auth_role()
RETURNS text AS $$
  SELECT role FROM users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION update_payout_tier()
RETURNS trigger AS $$
BEGIN
  IF NEW.rating >= 4.8 THEN
    NEW.payout_tier := 'Platinum';
    NEW.payout_rate := 75.00;
  ELSIF NEW.rating >= 4.5 THEN
    NEW.payout_tier := 'Gold';
    NEW.payout_rate := 65.00;
  ELSIF NEW.rating >= 4.0 THEN
    NEW.payout_tier := 'Silver';
    NEW.payout_rate := 55.00;
  ELSE
    NEW.payout_tier := 'Bronze';
    NEW.payout_rate := 45.00;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- TRIGGERS
-- ---------------------------------------------------------------------------

-- Payout tier auto-update when rating changes on pts
CREATE OR REPLACE TRIGGER pts_payout_tier_trigger
  BEFORE UPDATE OF rating ON pts
  FOR EACH ROW EXECUTE FUNCTION update_payout_tier();

-- updated_at auto-maintenance
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER gyms_updated_at
  BEFORE UPDATE ON gyms
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER pts_updated_at
  BEFORE UPDATE ON pts
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE gyms               ENABLE ROW LEVEL SECURITY;
ALTER TABLE users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE pts                ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients            ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_library       ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_meal_plans  ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_log           ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_favourites    ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_workouts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages           ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE perks              ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcast_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE new_signups        ENABLE ROW LEVEL SECURITY;

-- ---- gyms ----
CREATE POLICY "gyms: owners full access"
  ON gyms FOR ALL
  USING (auth_gym_id() = id OR owner_id = auth.uid());

-- ---- users ----
CREATE POLICY "users: read own row"
  ON users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "users: owners read all in gym"
  ON users FOR SELECT
  USING (gym_id = auth_gym_id());

CREATE POLICY "users: owners update in gym"
  ON users FOR UPDATE
  USING (gym_id = auth_gym_id());

CREATE POLICY "users: update own row"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- ---- pts ----
CREATE POLICY "pts: owners full access"
  ON pts FOR ALL
  USING (gym_id = auth_gym_id());

CREATE POLICY "pts: pt read own row"
  ON pts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "pts: pt update own row"
  ON pts FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "pts: clients read pts in gym"
  ON pts FOR SELECT
  USING (gym_id = auth_gym_id());

-- ---- clients ----
CREATE POLICY "clients: owners full access"
  ON clients FOR ALL
  USING (gym_id = auth_gym_id());

CREATE POLICY "clients: pt access assigned clients"
  ON clients FOR ALL
  USING (assigned_pt_id = (SELECT id FROM pts WHERE user_id = auth.uid()));

CREATE POLICY "clients: client access own row"
  ON clients FOR ALL
  USING (user_id = auth.uid());

-- ---- meal_library ----
CREATE POLICY "meal_library: read gym or global"
  ON meal_library FOR SELECT
  USING (gym_id = auth_gym_id() OR is_global = true);

CREATE POLICY "meal_library: pts and owners insert"
  ON meal_library FOR INSERT
  WITH CHECK (
    auth_role() IN ('pt', 'owner')
    AND (gym_id = auth_gym_id() OR is_global = true)
  );

-- ---- weekly_meal_plans ----
CREATE POLICY "weekly_meal_plans: owners full access"
  ON weekly_meal_plans FOR ALL
  USING (gym_id = auth_gym_id());

CREATE POLICY "weekly_meal_plans: pt access own plans"
  ON weekly_meal_plans FOR ALL
  USING (pt_id = (SELECT id FROM pts WHERE user_id = auth.uid()));

CREATE POLICY "weekly_meal_plans: client read own plan"
  ON weekly_meal_plans FOR SELECT
  USING (client_id = (SELECT id FROM clients WHERE user_id = auth.uid()));

-- ---- food_log ----
CREATE POLICY "food_log: client access own log"
  ON food_log FOR ALL
  USING (client_id = (SELECT id FROM clients WHERE user_id = auth.uid()));

CREATE POLICY "food_log: pts and owners read gym logs"
  ON food_log FOR SELECT
  USING (gym_id = auth_gym_id() AND auth_role() IN ('pt', 'owner'));

-- ---- food_favourites ----
CREATE POLICY "food_favourites: client access own favourites"
  ON food_favourites FOR ALL
  USING (client_id = (SELECT id FROM clients WHERE user_id = auth.uid()));

-- ---- workouts ----
CREATE POLICY "workouts: read gym or global"
  ON workouts FOR SELECT
  USING (gym_id = auth_gym_id() OR is_global = true);

CREATE POLICY "workouts: pts and owners insert"
  ON workouts FOR INSERT
  WITH CHECK (
    auth_role() IN ('pt', 'owner')
    AND gym_id = auth_gym_id()
  );

CREATE POLICY "workouts: pts and owners update in gym"
  ON workouts FOR UPDATE
  USING (
    auth_role() IN ('pt', 'owner')
    AND gym_id = auth_gym_id()
  );

CREATE POLICY "workouts: pts and owners delete in gym"
  ON workouts FOR DELETE
  USING (
    auth_role() IN ('pt', 'owner')
    AND gym_id = auth_gym_id()
  );

-- ---- client_workouts ----
CREATE POLICY "client_workouts: owners and pts access via gym"
  ON client_workouts FOR ALL
  USING (
    auth_role() IN ('pt', 'owner')
    AND EXISTS (
      SELECT 1 FROM clients c
      WHERE c.id = client_workouts.client_id
        AND c.gym_id = auth_gym_id()
    )
  );

CREATE POLICY "client_workouts: client access own"
  ON client_workouts FOR SELECT
  USING (client_id = (SELECT id FROM clients WHERE user_id = auth.uid()));

-- ---- appointments ----
CREATE POLICY "appointments: owners full access"
  ON appointments FOR ALL
  USING (gym_id = auth_gym_id());

CREATE POLICY "appointments: pt access own appointments"
  ON appointments FOR ALL
  USING (pt_id = (SELECT id FROM pts WHERE user_id = auth.uid()));

CREATE POLICY "appointments: client access own appointments"
  ON appointments FOR ALL
  USING (client_id = (SELECT id FROM clients WHERE user_id = auth.uid()));

-- ---- messages ----
CREATE POLICY "messages: owners full access"
  ON messages FOR ALL
  USING (gym_id = auth_gym_id() AND auth_role() = 'owner');

CREATE POLICY "messages: pt access client messages"
  ON messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM clients c
      JOIN pts p ON p.id = c.assigned_pt_id
      WHERE c.id = messages.client_id
        AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "messages: client access own thread"
  ON messages FOR SELECT
  USING (client_id = (SELECT id FROM clients WHERE user_id = auth.uid()));

CREATE POLICY "messages: sender can insert"
  ON messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- ---- subscription_plans ----
CREATE POLICY "subscription_plans: owners full access"
  ON subscription_plans FOR ALL
  USING (gym_id = auth_gym_id() AND auth_role() = 'owner');

CREATE POLICY "subscription_plans: clients read in gym"
  ON subscription_plans FOR SELECT
  USING (gym_id = auth_gym_id());

-- ---- subscriptions ----
CREATE POLICY "subscriptions: owners full access"
  ON subscriptions FOR ALL
  USING (gym_id = auth_gym_id() AND auth_role() = 'owner');

CREATE POLICY "subscriptions: clients read own"
  ON subscriptions FOR SELECT
  USING (client_id = (SELECT id FROM clients WHERE user_id = auth.uid()));

-- ---- discount_codes ----
CREATE POLICY "discount_codes: owners full access"
  ON discount_codes FOR ALL
  USING (gym_id = auth_gym_id() AND auth_role() = 'owner');

-- ---- perks ----
CREATE POLICY "perks: owners full access"
  ON perks FOR ALL
  USING (gym_id = auth_gym_id() AND auth_role() = 'owner');

CREATE POLICY "perks: clients read gym perks"
  ON perks FOR SELECT
  USING (gym_id = auth_gym_id());

-- ---- broadcast_messages ----
CREATE POLICY "broadcast_messages: owners full access"
  ON broadcast_messages FOR ALL
  USING (gym_id = auth_gym_id() AND auth_role() = 'owner');

-- ---- new_signups ----
CREATE POLICY "new_signups: owners full access"
  ON new_signups FOR ALL
  USING (gym_id = auth_gym_id() AND auth_role() = 'owner');

COMMIT;
