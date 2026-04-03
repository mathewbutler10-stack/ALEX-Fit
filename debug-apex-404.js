const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://nsvcznuvgdibscblixqd.supabase.co'
const supabaseAnonKey = 'sb_publishable_SykQYawz3iufQ41e6HSqDw_tpmHmp1h'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zdmN6bnV2Z2RpYnNjYmxpeHFkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDY5MDU4NiwiZXhwIjoyMDkwMjY2NTg2fQ.SBqmeE8DnUaZQfm0ac9Zu6CsuhGOvaVJY7lwfAV6qi4'

const supabase = createClient(supabaseUrl, supabaseAnonKey)
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

async function debugApex404() {
  console.log('🔍 Debugging APEX 404 error...')
  console.log('')
  
  // Test 1: Check if APEX app can connect to Supabase
  console.log('1. Testing Supabase connection from APEX app...')
  try {
    // Try to login with your credentials (simulating APEX app)
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'owner@fitlife.com',
      password: 'password123'
    })
    
    if (authError) {
      console.log('❌ APEX auth failed:', authError.message)
      console.log('   This means APEX app cannot connect to Supabase')
    } else {
      console.log('✅ APEX auth SUCCESSFUL!')
      console.log('   User ID:', authData.user.id)
      console.log('   Session created')
      
      // Test 2: Check if user exists in users table
      console.log('\n2. Checking users table record...')
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single()
      
      if (userError) {
        console.log('❌ User not found in users table:', userError.message)
        console.log('   APEX auth works but role system broken')
      } else {
        console.log('✅ User found in users table:')
        console.log('   - Role:', userData.role)
        console.log('   - Email:', userData.email)
        console.log('   - Status:', userData.status)
      }
    }
  } catch (err) {
    console.log('❌ Connection error:', err.message)
  }
  
  console.log('\n3. Checking APEX app configuration...')
  console.log('   Current APEX .env.local:')
  console.log('   - URL:', supabaseUrl)
  console.log('   - Anon Key:', supabaseAnonKey.substring(0, 20) + '...')
  
  console.log('\n4. Possible causes of 404:')
  console.log('   a) APEX app not deployed with updated .env.local')
  console.log('   b) Vercel needs environment variable update')
  console.log('   c) APEX app routing issue (not Supabase)')
  console.log('   d) Wrong APEX URL')
  
  console.log('\n🎯 QUICK DIAGNOSIS:')
  console.log('===================')
  console.log('')
  console.log('Try these URLs:')
  console.log('1. Login page: https://apex-fit-prod.netlify.app/auth/owner-login')
  console.log('2. Direct dashboard: https://apex-fit-prod.netlify.app/owner/dashboard')
  console.log('3. Home page: https://apex-fit-prod.netlify.app/')
  console.log('')
  console.log('Which URLs give 404?')
  console.log('')
  console.log('🔧 IMMEDIATE FIXES:')
  console.log('===================')
  console.log('')
  console.log('Option A: Check Netlify environment variables')
  console.log('1. Go to: https://app.netlify.com/sites/apex-fit-prod/settings/deploys#environment')
  console.log('2. Verify NEXT_PUBLIC_SUPABASE_URL = https://nsvcznuvgdibscblixqd.supabase.co')
  console.log('3. Redeploy if changed')
  console.log('')
  console.log('Option B: Test local APEX build')
  console.log('1. On your computer, run APEX locally')
  console.log('2. Test login at http://localhost:3000/auth/owner-login')
  console.log('3. If local works → Netlify deployment issue')
  console.log('')
  console.log('Option C: Check APEX routing')
  console.log('1. The 404 might be a Next.js routing issue')
  console.log('2. Check if auth pages exist in the build')
  console.log('')
  console.log('📱 NEXT STEP:')
  console.log('Which URL are you getting 404 on?')
}

debugApex404().catch(console.error)