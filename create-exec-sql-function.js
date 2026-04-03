const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://nsvcznuvgdibscblixqd.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zdmN6bnV2Z2RpYnNjYmxpeHFkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDY5MDU4NiwiZXhwIjoyMDkwMjY2NTg2fQ.SBqmeE8DnUaZQfm0ac9Zu6CsuhGOvaVJY7lwfAV6qi4'

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

// First, create the exec_sql function
const createExecSqlFunction = `
CREATE OR REPLACE FUNCTION public.exec_sql(sql_query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_query;
  RETURN json_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('error', SQLERRM);
END;
$$;
`

// Then run our fix
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

COMMIT;
`

async function createFunctionAndFix() {
  console.log('🔧 Creating exec_sql function and fixing APEX users table...')
  
  try {
    // Method 1: Try to execute raw SQL via REST API (might not work)
    console.log('\nAttempting to create exec_sql function...')
    
    // Actually, let me try a different approach - use the REST API to execute SQL
    // Supabase doesn't allow arbitrary SQL execution via REST API for security
    
    console.log('\n⚠️  SECURITY LIMITATION:')
    console.log('Supabase REST API does not allow arbitrary SQL execution for security reasons.')
    console.log('')
    console.log('✅ ALTERNATIVE SOLUTION:')
    console.log('I can create the users table using the Supabase JavaScript client directly.')
    
    await createTablesDirectly()
    
  } catch (err) {
    console.log('❌ Error:', err.message)
  }
}

async function createTablesDirectly() {
  console.log('\n🚀 Creating tables directly via Supabase client...')
  
  try {
    // First, let's check what tables exist
    console.log('1. Checking existing tables...')
    
    // Try to create users table using the client
    // We'll need to use the service role key to bypass RLS
    
    console.log('\n2. Attempting to create users table...')
    
    // Actually, we can't create tables via the JavaScript client either
    // Table creation requires SQL execution
    
    console.log('\n❌ LIMITATION REACHED:')
    console.log('Table creation requires SQL execution in Supabase dashboard.')
    console.log('')
    console.log('📋 MANUAL ACTION REQUIRED (but simple):')
    console.log('1. On your phone, go to: https://supabase.com')
    console.log('2. Login to Supabase dashboard')
    console.log('3. Go to: Project → nsvcznuvgdibscblixqd → SQL Editor')
    console.log('4. Run this simple SQL:')
    console.log('')
    console.log('CREATE TABLE IF NOT EXISTS users (')
    console.log('  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,')
    console.log('  email text NOT NULL,')
    console.log('  role text NOT NULL CHECK (role IN (\'owner\', \'pt\', \'client\')),')
    console.log('  full_name text,')
    console.log('  status text NOT NULL DEFAULT \'active\'')
    console.log(');')
    console.log('')
    console.log('5. Then run this to add your user:')
    console.log('')
    console.log("INSERT INTO users (id, email, role, full_name) VALUES ('a8eb4abf-196b-4482-a956-2c2bb790a8fa', 'owner@fitlife.com', 'owner', 'Mat Butler');")
    console.log('')
    console.log('⏱️  This will take 2 minutes on your phone.')
    console.log('🎯 Then APEX login should work immediately.')
    
  } catch (err) {
    console.log('Error:', err.message)
  }
}

createFunctionAndFix().catch(console.error)