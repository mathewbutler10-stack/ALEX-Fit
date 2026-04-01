const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://nsvcznuvgdibscblixqd.supabase.co'
const supabaseAnonKey = 'sb_publishable_SykQYawz3iufQ41e6HSqDw_tpmHmp1h'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zdmN6bnV2Z2RpYnNjYmxpeHFkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDY5MDU4NiwiZXhwIjoyMDkwMjY2NTg2fQ.SBqmeE8DnUaZQfm0ac9Zu6CsuhGOvaVJY7lwfAV6qi4'

const supabase = createClient(supabaseUrl, supabaseAnonKey)
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

async function testUserRole() {
  console.log('Testing APEX user role for mathewbutler10@gmail.com...')
  
  // First, login to get user ID
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'mathewbutler10@gmail.com',
    password: 'Oliver12'
  })

  if (authError) {
    console.error('Auth failed:', authError.message)
    return
  }

  const userId = authData.user.id
  console.log('Auth successful. User ID:', userId)
  
  // Check if user exists in users table
  const { data: userData, error: userError } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (userError) {
    console.error('Error checking users table:', userError.message)
    
    // User doesn't exist in users table - need to create it
    console.log('\nUser not found in users table. Creating user record...')
    
    const { data: newUser, error: createError } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        email: 'mathewbutler10@gmail.com',
        role: 'owner',  // Default to owner role
        full_name: 'Mat Butler',
        status: 'active'
      })
      .select()
      .single()

    if (createError) {
      console.error('Failed to create user record:', createError.message)
    } else {
      console.log('User record created:', newUser)
      
      // Also need to create a gym for this owner
      console.log('\nCreating gym for owner...')
      const { data: gym, error: gymError } = await supabaseAdmin
        .from('gyms')
        .insert({
          name: 'Test Gym',
          owner_id: userId
        })
        .select()
        .single()

      if (gymError) {
        console.error('Failed to create gym:', gymError.message)
      } else {
        console.log('Gym created:', gym)
        
        // Update user with gym_id
        const { error: updateError } = await supabaseAdmin
          .from('users')
          .update({ gym_id: gym.id })
          .eq('id', userId)

        if (updateError) {
          console.error('Failed to update user with gym_id:', updateError.message)
        } else {
          console.log('User updated with gym_id:', gym.id)
        }
      }
    }
  } else {
    console.log('User found in users table:')
    console.log('- Role:', userData.role)
    console.log('- Status:', userData.status)
    console.log('- Gym ID:', userData.gym_id)
    
    // Check if gym exists
    if (userData.gym_id) {
      const { data: gymData, error: gymError } = await supabaseAdmin
        .from('gyms')
        .select('*')
        .eq('id', userData.gym_id)
        .single()

      if (gymError) {
        console.error('Gym not found:', gymError.message)
      } else {
        console.log('Gym:', gymData.name)
      }
    }
  }
  
  // Test role switching - check if user can access different portals
  console.log('\n--- Testing Role Access ---')
  
  // Check what roles are available
  const { data: roles, error: rolesError } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('email', 'mathewbutler10@gmail.com')

  if (rolesError) {
    console.error('Error checking roles:', rolesError.message)
  } else {
    console.log('Available roles for this email:', roles.map(r => r.role))
  }
}

testUserRole().catch(console.error)