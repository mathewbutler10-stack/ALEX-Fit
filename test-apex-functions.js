const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://nsvcznuvgdibscblixqd.supabase.co'
const supabaseAnonKey = 'sb_publishable_SykQYawz3iufQ41e6HSqDw_tpmHmp1h'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zdmN6bnV2Z2RpYnNjYmxpeHFkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDY5MDU4NiwiZXhwIjoyMDkwMjY2NTg2fQ.SBqmeE8DnUaZQfm0ac9Zu6CsuhGOvaVJY7lwfAV6qi4'

const supabase = createClient(supabaseUrl, supabaseAnonKey)
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

async function testApexFunctions() {
  console.log('Testing APEX functions in Chore Champs Supabase project...')
  console.log('Project:', supabaseUrl)
  console.log('')
  
  // Test 1: Check if auth functions exist
  console.log('1. Testing auth functions...')
  try {
    // Try to call auth_role() function
    const { data: authRoleData, error: authRoleError } = await supabaseAdmin.rpc('auth_role')
    if (authRoleError) {
      console.log('❌ auth_role() function MISSING:', authRoleError.message)
    } else {
      console.log('✅ auth_role() function EXISTS')
    }
    
    // Try to call auth_gym_id() function
    const { data: authGymData, error: authGymError } = await supabaseAdmin.rpc('auth_gym_id')
    if (authGymError) {
      console.log('❌ auth_gym_id() function MISSING:', authGymError.message)
    } else {
      console.log('✅ auth_gym_id() function EXISTS')
    }
  } catch (err) {
    console.log('❌ Error testing auth functions:', err.message)
  }
  
  console.log('')
  
  // Test 2: Check if APEX tables exist
  console.log('2. Checking APEX tables...')
  const apexTables = ['gyms', 'users', 'pts', 'clients', 'workouts', 'meal_library']
  
  for (const table of apexTables) {
    try {
      const { data, error } = await supabaseAdmin
        .from(table)
        .select('count')
        .limit(1)
      
      if (error) {
        console.log(`❌ Table "${table}" MISSING:`, error.message)
      } else {
        console.log(`✅ Table "${table}" EXISTS`)
      }
    } catch (err) {
      console.log(`❌ Error checking table "${table}":`, err.message)
    }
  }
  
  console.log('')
  
  // Test 3: Check if seed data exists
  console.log('3. Checking seed data...')
  try {
    const { data: gyms, error: gymsError } = await supabaseAdmin
      .from('gyms')
      .select('id, name')
      .limit(3)
    
    if (gymsError) {
      console.log('❌ Error checking gyms:', gymsError.message)
    } else if (gyms && gyms.length > 0) {
      console.log(`✅ Seed data exists: ${gyms.length} gym(s)`)
      gyms.forEach(gym => console.log(`   - ${gym.name} (${gym.id})`))
    } else {
      console.log('⚠️  No gyms found - seed data may not be deployed')
    }
  } catch (err) {
    console.log('❌ Error checking seed data:', err.message)
  }
  
  console.log('')
  
  // Test 4: Check users table structure
  console.log('4. Checking users table structure...')
  try {
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, role, gym_id')
      .limit(3)
    
    if (usersError) {
      console.log('❌ Error checking users:', usersError.message)
    } else if (users && users.length > 0) {
      console.log(`✅ Users table has ${users.length} record(s)`)
      users.forEach(user => console.log(`   - ${user.email} (${user.role})`))
    } else {
      console.log('⚠️  No users found - need to create test users')
    }
  } catch (err) {
    console.log('❌ Error checking users:', err.message)
  }
  
  console.log('')
  console.log('--- SUMMARY ---')
  console.log('Next steps based on test results above...')
}

testApexFunctions().catch(console.error)