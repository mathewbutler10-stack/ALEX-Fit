-- Fix missing users table for APEX in Chore Champs Supabase project
-- Run this in Supabase SQL Editor

BEGIN;

-- Create users table if it doesn't exist
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

-- Create index for performance
CREATE INDEX IF NOT EXISTS users_gym_id_idx ON users(gym_id);
CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "users: owners can manage all users in their gym"
  ON users FOR ALL
  USING (gym_id = auth_gym_id() AND auth_role() = 'owner');

CREATE POLICY "users: pts can view clients in their gym"
  ON users FOR SELECT
  USING (
    gym_id = auth_gym_id() 
    AND auth_role() IN ('pt', 'owner')
    AND role = 'client'
  );

CREATE POLICY "users: users can view their own record"
  ON users FOR SELECT
  USING (id = auth.uid());

-- Create test owner user (mathewbutler10@gmail.com)
-- First check if auth user exists, then create users record
INSERT INTO users (id, email, role, full_name, status)
SELECT 
  'a8eb4abf-196b-4482-a956-2c2bb790a8fa', -- Your user ID from auth.users
  'mathewbutler10@gmail.com',
  'owner',
  'Mat Butler',
  'active'
WHERE EXISTS (
  SELECT 1 FROM auth.users 
  WHERE id = 'a8eb4abf-196b-4482-a956-2c2bb790a8fa'
)
ON CONFLICT (id) DO UPDATE 
SET role = 'owner', status = 'active';

-- Create a test gym for the owner
INSERT INTO gyms (id, name, owner_id)
VALUES (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'FitLife Studio',
  'a8eb4abf-196b-4482-a956-2c2bb790a8fa'
)
ON CONFLICT (id) DO NOTHING;

-- Update owner user with gym_id
UPDATE users 
SET gym_id = 'a1b2c3d4-0000-0000-0000-000000000001'
WHERE id = 'a8eb4abf-196b-4482-a956-2c2bb790a8fa';

COMMIT;

-- Verify the fix
SELECT '✅ Users table created successfully' as status;
SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as gym_count FROM gyms;