const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://nsvcznuvgdibscblixqd.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zdmN6bnV2Z2RpYnNjYmxpeHFkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDY5MDU4NiwiZXhwIjoyMDkwMjY2NTg2fQ.SBqmeE8DnUaZQfm0ac9Zu6CsuhGOvaVJY7lwfAV6qi4'

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

async function debugUsersTable() {
  console.log('🔍 Debugging users table issue...')
  
  try {
    // First, let's see what tables exist
    console.log('\n1. Checking existing tables...')
    
    // Try to list all tables (this is a bit hacky)
    const testTables = ['users', 'gyms', 'pts', 'clients', 'auth.users']
    
    for (const table of testTables) {
      try {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select('count')
          .limit(1)
        
        if (error && error.message.includes('relation') && error.message.includes('does not exist')) {
          console.log(`❌ Table "${table}" does NOT exist`)
        } else if (error) {
          console.log(`⚠️  Table "${table}" error:`, error.message)
        } else {
          console.log(`✅ Table "${table}" EXISTS`)
        }
      } catch (err) {
        console.log(`⚠️  Error testing table "${table}":`, err.message)
      }
    }
    
    // Now let me try to create the users table with a simpler approach
    console.log('\n2. Testing table creation issue...')
    
    // The issue might be with the FOREIGN KEY constraint
    // Let me create a simpler version without the foreign key first
    
    console.log('\n🎯 SIMPLE WORKING SQL:')
    console.log('=====================')
    console.log('')
    console.log('-- Step 1: Create users table WITHOUT foreign key first')
    console.log('CREATE TABLE IF NOT EXISTS users (')
    console.log('  id uuid PRIMARY KEY,')
    console.log('  email text NOT NULL,')
    console.log('  role text NOT NULL,')
    console.log('  full_name text,')
    console.log('  status text DEFAULT \'active\'')
    console.log(');')
    console.log('')
    console.log('-- Step 2: Add your user')
    console.log("INSERT INTO users (id, email, role, full_name) VALUES ('a8eb4abf-196b-4482-a956-2c2bb790a8fa', 'owner@fitlife.com', 'owner', 'Mat Butler');")
    console.log('')
    console.log('-- Step 3: Add foreign key constraint later (optional)')
    console.log('ALTER TABLE users ADD CONSTRAINT users_auth_fk FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;')
    console.log('')
    console.log('-- Step 4: Add check constraint')
    console.log("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('owner', 'pt', 'client'));")
    console.log('')
    console.log('⏱️  Run Step 1 and Step 2 ONLY for now')
    
    // Also check if there's a schema issue
    console.log('\n🔧 POSSIBLE SCHEMA ISSUE:')
    console.log('The FOREIGN KEY to auth.users might be failing because:')
    console.log('1. Your user ID might be different in auth.users')
    console.log('2. The auth schema might not be accessible')
    console.log('')
    console.log('💡 QUICK FIX: Create table without foreign key, then test APEX login')
    console.log('If login works, the foreign key is not critical immediately')
    
  } catch (err) {
    console.log('❌ Error:', err.message)
  }
}

debugUsersTable().catch(console.error)