const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://nsvcznuvgdibscblixqd.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zdmN6bnV2Z2RpYnNjYmxpeHFkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDY5MDU4NiwiZXhwIjoyMDkwMjY2NTg2fQ.SBqmeE8DnUaZQfm0ac9Zu6CsuhGOvaVJY7lwfAV6qi4'

// Create admin client with service role key
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

// Test users from seed data with their UUIDs
const testUsers = [
  {
    id: 'a1b2c3d4-0000-0000-0000-000000000010',
    email: 'sarah.mitchell@fitlifestudio.com.au',
    password: 'TestPassword123!',
    user_metadata: { role: 'owner' },
    email_confirm: true
  },
  {
    id: 'a1b2c3d4-0000-0000-0000-000000000020',
    email: 'jake.thompson@fitlifestudio.com.au',
    password: 'TestPassword123!',
    user_metadata: { role: 'pt' },
    email_confirm: true
  },
  {
    id: 'a1b2c3d4-0000-0000-0000-000000000021',
    email: 'emma.rodriguez@fitlifestudio.com.au',
    password: 'TestPassword123!',
    user_metadata: { role: 'pt' },
    email_confirm: true
  },
  {
    id: 'a1b2c3d4-0000-0000-0000-000000000040',
    email: 'james.anderson@email.com',
    password: 'TestPassword123!',
    user_metadata: { role: 'client' },
    email_confirm: true
  },
  {
    id: 'a1b2c3d4-0000-0000-0000-000000000041',
    email: 'sophie.chen@email.com',
    password: 'TestPassword123!',
    user_metadata: { role: 'client' },
    email_confirm: true
  }
]

async function createTestUsers() {
  console.log('🔧 Creating test users for APEX...')
  console.log('====================================')
  
  for (const user of testUsers) {
    console.log(`\nCreating user: ${user.email} (${user.user_metadata.role})`)
    
    try {
      // First check if user already exists
      const { data: existingUser, error: checkError } = await supabaseAdmin.auth.admin.getUserById(user.id)
      
      if (checkError && checkError.message.includes('User not found')) {
        // User doesn't exist, create it
        console.log(`  User doesn't exist, creating...`)
        
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          id: user.id,
          email: user.email,
          password: user.password,
          email_confirm: user.email_confirm,
          user_metadata: user.user_metadata
        })
        
        if (error) {
          console.log(`  ❌ Error creating user: ${error.message}`)
          
          // Try without ID (let Supabase generate it)
          if (error.message.includes('invalid uuid')) {
            console.log(`  Trying without fixed UUID...`)
            const { data: data2, error: error2 } = await supabaseAdmin.auth.admin.createUser({
              email: user.email,
              password: user.password,
              email_confirm: user.email_confirm,
              user_metadata: user.user_metadata
            })
            
            if (error2) {
              console.log(`  ❌ Still failed: ${error2.message}`)
            } else {
              console.log(`  ✅ User created with generated ID: ${data2.user.id}`)
            }
          }
        } else {
          console.log(`  ✅ User created successfully: ${data.user.id}`)
        }
      } else if (existingUser) {
        console.log(`  ⚠️ User already exists: ${existingUser.user.id}`)
        
        // Update password if needed
        console.log(`  Updating password...`)
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          user.id,
          { password: user.password }
        )
        
        if (updateError) {
          console.log(`  ❌ Error updating password: ${updateError.message}`)
        } else {
          console.log(`  ✅ Password updated`)
        }
      }
    } catch (err) {
      console.log(`  ❌ Unexpected error: ${err.message}`)
    }
  }
  
  console.log('\n====================================')
  console.log('✅ Test user creation process completed')
  console.log('\n📋 Test Credentials:')
  console.log('-------------------')
  testUsers.forEach(user => {
    console.log(`Email: ${user.email}`)
    console.log(`Password: ${user.password}`)
    console.log(`Role: ${user.user_metadata.role}`)
    console.log('---')
  })
  
  console.log('\n🔍 Testing authentication...')
  console.log('-------------------------')
  
  // Test authentication with one user
  const testEmail = 'sarah.mitchell@fitlifestudio.com.au'
  const testPassword = 'TestPassword123!'
  
  const supabaseAnon = createClient(supabaseUrl, 'sb_publishable_SykQYawz3iufQ41e6HSqDw_tpmHmp1h')
  
  console.log(`Testing login with: ${testEmail}`)
  const { data, error } = await supabaseAnon.auth.signInWithPassword({
    email: testEmail,
    password: testPassword
  })
  
  if (error) {
    console.log(`❌ Login failed: ${error.message}`)
  } else {
    console.log(`✅ Login successful!`)
    console.log(`   User ID: ${data.user.id}`)
    console.log(`   Email: ${data.user.email}`)
    console.log(`   Role: ${data.user.user_metadata?.role || 'not set'}`)
  }
}

createTestUsers().catch(console.error)