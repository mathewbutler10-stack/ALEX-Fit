// Simple migration script for gym management system
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please set in .env.local:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=your-supabase-url');
  console.log('SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 Starting APEX Fit Gym Management System Migration...\n');
  
  try {
    // Read migration file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250404_gym_management_system.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration file:', migrationPath);
    console.log('📏 SQL size:', migrationSQL.length, 'bytes\n');
    
    // Execute the entire migration as one SQL block
    console.log('🔧 Executing migration...');
    
    const { data, error } = await supabase.rpc('exec_sql', { sql_text: migrationSQL });
    
    if (error) {
      console.error('❌ Migration failed:', error.message);
      
      // Try executing in smaller chunks
      console.log('\n💡 Trying chunked execution...');
      await executeChunked(migrationSQL);
    } else {
      console.log('✅ Migration executed via exec_sql function');
      console.log('Result:', data);
    }
    
    // Verify migration
    await verifyMigration();
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

async function executeChunked(sql) {
  // Split by statements but keep transaction blocks together
  const chunks = [];
  let currentChunk = '';
  let inTransaction = false;
  
  const lines = sql.split('\n');
  
  for (const line of lines) {
    currentChunk += line + '\n';
    
    // Check for transaction boundaries
    if (line.trim().toUpperCase() === 'BEGIN') {
      inTransaction = true;
    }
    
    if (line.trim().toUpperCase() === 'COMMIT;' || line.trim().toUpperCase() === 'COMMIT') {
      inTransaction = false;
      chunks.push(currentChunk);
      currentChunk = '';
    }
    
    // For non-transactional statements ending with ;
    if (!inTransaction && line.trim().endsWith(';') && !line.trim().startsWith('--')) {
      chunks.push(currentChunk);
      currentChunk = '';
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk);
  }
  
  console.log(`📦 Executing ${chunks.length} SQL chunks...\n`);
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i].trim();
    if (!chunk) continue;
    
    console.log(`Chunk ${i + 1}/${chunks.length}:`);
    console.log(chunk.substring(0, 150) + (chunk.length > 150 ? '...' : ''));
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_text: chunk });
      
      if (error) {
        console.error(`❌ Chunk ${i + 1} failed:`, error.message);
        console.log('💡 Skipping to next chunk...');
      } else {
        console.log(`✅ Chunk ${i + 1} succeeded\n`);
      }
    } catch (error) {
      console.error(`❌ Chunk ${i + 1} error:`, error.message);
    }
  }
}

async function verifyMigration() {
  console.log('\n🔍 Verifying migration...\n');
  
  const tablesToCheck = [
    'subscription_plans',
    'gym_subscriptions',
    'gym_features',
    'client_groups',
    'gym_trainers',
    'gym_monthly_usage',
    'overage_charges',
    'platform_metrics',
    'owner_alerts'
  ];
  
  for (const table of tablesToCheck) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${table}:`, error.message);
      } else {
        console.log(`✅ ${table}: Table exists (${data?.count || 0} rows)`);
      }
    } catch (error) {
      console.log(`❌ ${table}:`, error.message);
    }
  }
  
  // Check gyms table enhancements
  console.log('\n🔍 Checking gyms table enhancements...');
  try {
    const { data, error } = await supabase
      .from('gyms')
      .select('subscription_tier, max_clients, current_clients')
      .limit(1);
    
    if (error) {
      console.log('❌ gyms enhancements:', error.message);
    } else {
      console.log('✅ gyms table has subscription fields');
    }
  } catch (error) {
    console.log('❌ gyms check:', error.message);
  }
  
  // Check subscription plans were inserted
  console.log('\n🔍 Checking subscription plans...');
  try {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('name, slug, max_clients, monthly_price')
      .order('display_order');
    
    if (error) {
      console.log('❌ subscription_plans:', error.message);
    } else if (data && data.length > 0) {
      console.log(`✅ Found ${data.length} subscription plans:`);
      data.forEach(plan => {
        console.log(`   - ${plan.name} (${plan.slug}): ${plan.max_clients} clients, $${plan.monthly_price}/month`);
      });
    } else {
      console.log('⚠️ No subscription plans found');
    }
  } catch (error) {
    console.log('❌ subscription_plans check:', error.message);
  }
}

async function testConnection() {
  console.log('🔗 Testing Supabase connection...');
  
  try {
    // Try a simple query
    const { data, error } = await supabase.rpc('version');
    
    if (error) {
      console.error('❌ Connection test failed:', error.message);
      return false;
    }
    
    console.log('✅ Connected to Supabase');
    return true;
  } catch (error) {
    console.error('❌ Connection error:', error.message);
    return false;
  }
}

// Main execution
async function main() {
  console.log('===========================================');
  console.log('APEX Fit Gym Management System Migration');
  console.log('===========================================\n');
  
  const connected = await testConnection();
  if (!connected) {
    console.log('\n💡 Troubleshooting tips:');
    console.log('1. Check .env.local file exists');
    console.log('2. Verify Supabase URL and service role key');
    console.log('3. Ensure network connectivity to Supabase');
    console.log('4. Check if Supabase project is active');
    process.exit(1);
  }
  
  await runMigration();
  
  console.log('\n===========================================');
  console.log('🎉 Migration Complete!');
  console.log('===========================================');
  console.log('\n📋 Next steps:');
  console.log('1. Review database schema changes');
  console.log('2. Test capacity enforcement with sample data');
  console.log('3. Implement API endpoints for gym management');
  console.log('4. Create owner and gym manager dashboards');
  console.log('5. Integrate Stripe billing');
  console.log('\n🚀 Ready to build the gym management system!');
}

main().catch(console.error);