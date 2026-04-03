const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://nsvcznuvgdibscblixqd.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zdmN6bnV2Z2RpYnNjYmxpeHFkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDY5MDU4NiwiZXhwIjoyMDkwMjY2NTg2fQ.SBqmeE8DnUaZQfm0ac9Zu6CsuhGOvaVJY7lwfAV6qi4'

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

const sqlFix = `
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

-- Create test owner user (owner@fitlife.com)
-- First check if auth user exists, then create users record
INSERT INTO users (id, email, role, full_name, status)
SELECT 
  'a8eb4abf-196b-4482-a956-2c2bb790a8fa', -- Your user ID from auth.users
  'owner@fitlife.com',
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
`

async function runSqlFix() {
  console.log('🚀 Running SQL fix for missing APEX users table...')
  console.log('Project:', supabaseUrl)
  console.log('')
  
  try {
    // Execute the SQL
    const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql_query: sqlFix })
    
    if (error) {
      console.log('❌ SQL execution failed:', error.message)
      
      // Try alternative approach - execute SQL directly via REST API
      console.log('\nTrying alternative approach...')
      await executeSqlDirectly()
    } else {
      console.log('✅ SQL executed successfully!')
      await verifyFix()
    }
  } catch (err) {
    console.log('❌ Error:', err.message)
    console.log('\nTrying alternative approach...')
    await executeSqlDirectly()
  }
}

async function executeSqlDirectly() {
  console.log('Executing SQL statements individually...')
  
  try {
    // We'll need to execute each statement separately
    // For now, let me check if exec_sql function exists
    const { data: funcCheck, error: funcError } = await supabaseAdmin.rpc('exec_sql', { sql_query: 'SELECT 1' })
    
    if (funcError && funcError.message.includes('function exec_sql')) {
      console.log('❌ exec_sql function does not exist')
      console.log('\n⚠️  MANUAL ACTION REQUIRED:')
      console.log('You need to run the SQL manually in Supabase dashboard:')
      console.log('1. Go to: https://supabase.com/dashboard/project/nsvcznuvgdibscblixqd/sql')
      console.log('2. Copy the SQL from fix-missing-users-table.sql')
      console.log('3. Run it')
    }
  } catch (err) {
    console.log('Error checking exec_sql:', err.message)
  }
}

async function verifyFix() {
  console.log('\n🔍 Verifying the fix...')
  
  try {
    // Check users table
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, role, gym_id')
      .eq('email', 'owner@fitlife.com')
      .single()
    
    if (usersError) {
      console.log('❌ Error checking users:', usersError.message)
    } else {
      console.log('✅ User record created:')
      console.log(`   - Email: ${users.email}`)
      console.log(`   - Role: ${users.role}`)
      console.log(`   - Gym ID: ${users.gym_id}`)
    }
    
    // Check gyms table
    const { data: gyms, error: gymsError } = await supabaseAdmin
      .from('gyms')
      .select('id, name, owner_id')
      .eq('id', 'a1b2c3d4-0000-0000-0000-000000000001')
      .single()
    
    if (gymsError) {
      console.log('❌ Error checking gyms:', gymsError.message)
    } else {
      console.log('✅ Gym record created:')
      console.log(`   - Name: ${gyms.name}`)
      console.log(`   - Owner ID: ${gyms.owner_id}`)
    }
    
  } catch (err) {
    console.log('❌ Verification error:', err.message)
  }
}

runSqlFix().catch(console.error)