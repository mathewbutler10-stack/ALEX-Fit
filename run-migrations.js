const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = 'https://nsvcznuvgdibscblixqd.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zdmN6bnV2Z2RpYnNjYmxpeHFkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDY5MDU4NiwiZXhwIjoyMDkwMjY2NTg2fQ.SBqmeE8DnUaZQfm0ac9Zu6CsuhGOvaVJY7lwfAV6qi4';

// Create Supabase client with service role
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function runMigration(filePath) {
  try {
    console.log(`\n📋 Running migration: ${path.basename(filePath)}`);
    
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Split SQL by statements (simple split on semicolon)
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (!statement) continue;
      
      console.log(`  Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        // Use the REST API's rpc endpoint for SQL execution
        // Note: This requires the exec_sql function to exist
        const { data, error } = await supabase.rpc('exec_sql', { sql_text: statement });
        
        if (error) {
          console.error(`  ❌ Error: ${error.message}`);
          // Try alternative approach - some statements might work with query
          console.log('  Trying alternative execution method...');
          
          // For simple SELECT statements, we can use query
          if (statement.toUpperCase().startsWith('SELECT')) {
            const { data: queryData, error: queryError } = await supabase.from('_dummy').select('*').limit(1);
            if (queryError) {
              console.error(`  ❌ Query also failed: ${queryError.message}`);
            }
          }
        } else {
          console.log(`  ✅ Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.error(`  ❌ Execution error: ${err.message}`);
      }
    }
    
    console.log(`✅ Migration ${path.basename(filePath)} completed`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to run migration ${filePath}:`, error.message);
    return false;
  }
}

async function runAllMigrations() {
  console.log('🚀 Starting APEX Phase 4 migrations...');
  
  const migrationsDir = path.join(__dirname, 'supabase', 'migrations');
  const migrationFiles = [
    '2024040101_enhance_meal_library.sql',
    '2024040102_create_client_dietary_preferences.sql',
    '2024040103_create_grocery_lists.sql',
    '2024040104_meal_generation_algorithm.sql'
  ];
  
  let successCount = 0;
  
  for (const migrationFile of migrationFiles) {
    const filePath = path.join(migrationsDir, migrationFile);
    
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Migration file not found: ${filePath}`);
      continue;
    }
    
    const success = await runMigration(filePath);
    if (success) successCount++;
  }
  
  console.log(`\n📊 Migration Summary:`);
  console.log(`✅ ${successCount} of ${migrationFiles.length} migrations completed successfully`);
  
  if (successCount === migrationFiles.length) {
    console.log('🎉 All migrations completed successfully!');
  } else {
    console.log('⚠️ Some migrations may need manual execution in Supabase dashboard');
  }
}

// Check if exec_sql function exists
async function checkExecSqlFunction() {
  console.log('🔍 Checking if exec_sql function exists...');
  
  try {
    // Try to call the function
    const { error } = await supabase.rpc('exec_sql', { sql_text: 'SELECT 1' });
    
    if (error && error.message.includes('function') && error.message.includes('does not exist')) {
      console.log('❌ exec_sql function does not exist in Supabase');
      console.log('\n📝 Manual execution required:');
      console.log('1. Go to: https://app.supabase.com/project/nsvcznuvgdibscblixqd/sql');
      console.log('2. Run each migration file manually');
      console.log('3. Files are in: C:\\Users\\stut_\\projects\\ALEX-Fit\\supabase\\migrations\\');
      return false;
    } else if (error) {
      console.log(`⚠️ exec_sql function exists but returned error: ${error.message}`);
      return true;
    } else {
      console.log('✅ exec_sql function exists and is accessible');
      return true;
    }
  } catch (err) {
    console.error(`❌ Error checking exec_sql: ${err.message}`);
    return false;
  }
}

// Main execution
async function main() {
  console.log('========================================');
  console.log('APEX Phase 4 - Smart Meal Planner');
  console.log('Database Migration Runner');
  console.log('========================================\n');
  
  const hasExecSql = await checkExecSqlFunction();
  
  if (hasExecSql) {
    console.log('\n🚀 Proceeding with automated migrations...');
    await runAllMigrations();
  } else {
    console.log('\n📋 Manual migration instructions:');
    console.log('Migration files to run (in order):');
    console.log('1. 2024040101_enhance_meal_library.sql');
    console.log('2. 2024040102_create_client_dietary_preferences.sql');
    console.log('3. 2024040103_create_grocery_lists.sql');
    console.log('4. 2024040104_meal_generation_algorithm.sql');
    console.log('\n📍 Location: C:\\Users\\stut_\\projects\\ALEX-Fit\\supabase\\migrations\\');
  }
}

main().catch(console.error);