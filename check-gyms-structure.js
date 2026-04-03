const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://nsvcznuvgdibscblixqd.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zdmN6bnV2Z2RpYnNjYmxpeHFkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDY5MDU4NiwiZXhwIjoyMDkwMjY2NTg2fQ.SBqmeE8DnUaZQfm0ac9Zu6CsuhGOvaVJY7lwfAV6qi4'

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

async function checkGymsStructure() {
  console.log('🔍 Checking gyms table structure...')
  
  try {
    // First, check if gyms table exists and get its structure
    const { data: tableInfo, error: tableError } = await supabaseAdmin
      .from('gyms')
      .select('*')
      .limit(1)
    
    if (tableError) {
      console.log('❌ Error accessing gyms table:', tableError.message)
      
      // Try to get table schema information
      console.log('\nTrying to infer table structure...')
      
      // Check what columns exist by trying different selects
      const testColumns = ['id', 'name', 'owner_id', 'created_at', 'updated_at']
      
      for (const column of testColumns) {
        try {
          const { data, error } = await supabaseAdmin
            .from('gyms')
            .select(column)
            .limit(1)
          
          if (error && error.message.includes('column')) {
            console.log(`❌ Column "${column}" does NOT exist`)
          } else if (error) {
            console.log(`⚠️  Error checking column "${column}":`, error.message)
          } else {
            console.log(`✅ Column "${column}" exists`)
          }
        } catch (err) {
          console.log(`⚠️  Error testing column "${column}":`, err.message)
        }
      }
    } else {
      console.log('✅ gyms table exists')
      
      // Try to get a sample row to see structure
      const { data: sample, error: sampleError } = await supabaseAdmin
        .from('gyms')
        .select('*')
        .limit(1)
      
      if (sampleError) {
        console.log('Error getting sample:', sampleError.message)
      } else if (sample && sample.length > 0) {
        console.log('\nSample gym row:')
        Object.keys(sample[0]).forEach(key => {
          console.log(`  ${key}: ${sample[0][key]}`)
        })
      } else {
        console.log('No rows in gyms table')
      }
    }
    
    // Now let me check the APEX schema to see what the gyms table should look like
    console.log('\n📋 Checking APEX schema definition...')
    
    // Based on the error, the gyms table might have different columns
    // Let me create a corrected SQL statement
    
    console.log('\n🎯 CORRECTED SQL FOR YOU TO RUN:')
    console.log('===================================')
    console.log('')
    console.log('-- First, check what columns gyms table has')
    console.log('SELECT column_name, data_type FROM information_schema.columns WHERE table_name = \'gyms\';')
    console.log('')
    console.log('-- Then create users table (simplified)')
    console.log('CREATE TABLE IF NOT EXISTS users (')
    console.log('  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,')
    console.log('  email text NOT NULL,')
    console.log('  role text NOT NULL CHECK (role IN (\'owner\', \'pt\', \'client\')),')
    console.log('  full_name text,')
    console.log('  status text NOT NULL DEFAULT \'active\'')
    console.log(');')
    console.log('')
    console.log('-- Add your user')
    console.log("INSERT INTO users (id, email, role, full_name) VALUES ('a8eb4abf-196b-4482-a956-2c2bb790a8fa', 'owner@fitlife.com', 'owner', 'Mat Butler');")
    console.log('')
    console.log('⏱️  Run these 3 SQL statements separately in Supabase SQL Editor')
    
  } catch (err) {
    console.log('❌ Error:', err.message)
  }
}

checkGymsStructure().catch(console.error)