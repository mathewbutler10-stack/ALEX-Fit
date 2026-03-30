-- APEX Phase 3: Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid REFERENCES gyms(id) ON DELETE CASCADE NOT NULL,
  pt_id uuid REFERENCES pts(id) ON DELETE SET NULL,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  session_type text NOT NULL DEFAULT 'Personal Training',
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer DEFAULT 60,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled','completed','cancelled','no_show')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- PTs see their own sessions
CREATE POLICY "sessions: pt view own" ON sessions FOR SELECT
  USING (pt_id = auth.uid() OR auth_role() = 'owner');

-- PTs can create sessions for their clients
CREATE POLICY "sessions: pt insert" ON sessions FOR INSERT
  WITH CHECK (auth_role() IN ('owner', 'pt'));

-- PTs can update their own sessions
CREATE POLICY "sessions: pt update own" ON sessions FOR UPDATE
  USING (pt_id = auth.uid() OR auth_role() = 'owner');

-- Owners can delete sessions
CREATE POLICY "sessions: owner delete" ON sessions FOR DELETE
  USING (auth_role() = 'owner' AND gym_id = auth_gym_id());
