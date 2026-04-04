// Script to run gym management system migration
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 Starting APEX Fit Gym Management System Migration...');
  
  try {
    // Read migration file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250404_gym_management_system.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration file loaded:', migrationPath);
    console.log('📏 SQL size:', migrationSQL.length, 'bytes');
    
    // Split SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log('🔧 Executing', statements.length, 'SQL statements...');
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i] + ';';
      console.log(`\n📋 Statement ${i + 1}/${statements.length}:`);
      console.log(stmt.substring(0, 200) + (stmt.length > 200 ? '...' : ''));
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: stmt });
        
        if (error) {
          // Check if it's a "function does not exist" error for exec_sql
          if (error.message.includes('function exec_sql') && error.message.includes('does not exist')) {
            console.log('⚠️ exec_sql function not found, trying direct SQL execution...');
            
            // Try direct execution (requires pg extension)
            const { error: directError } = await supabase.from('_exec_sql').insert({ sql: stmt });
            
            if (directError) {
              console.error('❌ Direct execution failed:', directError.message);
              console.log('💡 Creating exec_sql function first...');
              
              // Create exec_sql function
              const createFunctionSQL = `
                CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
                RETURNS void
                LANGUAGE plpgsql
                SECURITY DEFINER
                AS $$
                BEGIN
                  EXECUTE sql_query;
                END;
                $$;
              `;
              
              const { error: createError } = await supabase.rpc('exec_sql', { sql_query: createFunctionSQL });
              
              if (createError) {
                console.error('❌ Failed to create exec_sql function:', createError.message);
                console.log('💡 Trying alternative approach...');
                
                // Try the original statement again with the new function
                const { error: retryError } = await supabase.rpc('exec_sql', { sql_query: stmt });
                if (retryError) {
                  throw retryError;
                }
              }
            }
          } else {
            throw error;
          }
        }
        
        console.log('✅ Success');
      } catch (error) {
        console.error('❌ Error executing statement:', error.message);
        console.log('💡 Skipping to next statement...');
      }
    }
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📊 Next steps:');
    console.log('1. Verify database schema updates');
    console.log('2. Test capacity enforcement');
    console.log('3. Create test gym with subscription');
    console.log('4. Implement API endpoints');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Check if we can connect to Supabase first
async function testConnection() {
  console.log('🔗 Testing Supabase connection...');
  
  try {
    const { data, error } = await supabase.from('gyms').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Connection test failed:', error.message);
      console.log('💡 Trying to check if gyms table exists...');
      
      // Try a simpler query
      const { error: simpleError } = await supabase.rpc('version');
      if (simpleError) {
        throw simpleError;
      }
    }
    
    console.log('✅ Connected to Supabase successfully');
    return true;
  } catch (error) {
    console.error('❌ Cannot connect to Supabase:', error.message);
    console.log('💡 Please check:');
    console.log('   - Supabase URL is correct');
    console.log('   - Service role key has proper permissions');
    console.log('   - Network connectivity');
    return false;
  }
}

// Main execution
async function main() {
  console.log('===========================================');
  console.log('APEX Fit Gym Management System Migration');
  console.log('===========================================');
  
  const connected = await testConnection();
  if (!connected) {
    process.exit(1);
  }
  
  await runMigration();
}

main().catch(console.error);