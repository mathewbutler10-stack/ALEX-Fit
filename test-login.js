const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://nsvcznuvgdibscblixqd.supabase.co'
const supabaseAnonKey = 'sb_publishable_SykQYawz3iufQ41e6HSqDw_tpmHmp1h'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testLogin() {
  console.log('Testing APEX login for mathewbutler10@gmail.com...')
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'mathewbutler10@gmail.com',
    password: 'Oliver12'
  })

  if (error) {
    console.error('Login failed:', error.message)
    
    // Try to sign up if user doesn't exist
    console.log('\nTrying to sign up user...')
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: 'mathewbutler10@gmail.com',
      password: 'Oliver12',
      options: {
        data: {
          role: 'owner'
        }
      }
    })
    
    if (signupError) {
      console.error('Signup failed:', signupError.message)
    } else {
      console.log('Signup successful! User created.')
      console.log('User ID:', signupData.user?.id)
      console.log('Email confirmed:', signupData.user?.email_confirmed_at)
      
      // Try login again
      console.log('\nTrying login again...')
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: 'mathewbutler10@gmail.com',
        password: 'Oliver12'
      })
      
      if (loginError) {
        console.error('Second login failed:', loginError.message)
      } else {
        console.log('Login successful!')
        console.log('Session:', loginData.session)
      }
    }
  } else {
    console.log('Login successful!')
    console.log('User:', data.user)
    console.log('Session:', data.session)
  }
}

testLogin().catch(console.error)