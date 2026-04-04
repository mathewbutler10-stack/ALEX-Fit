// Simple migration script - no external dependencies
const fs = require('fs');
const path = require('path');

// Read environment variables from .env.local
const envPath = path.join(__dirname, '.env.local');
let envContent = '';

try {
  envContent = fs.readFileSync(envPath, 'utf8');
} catch (error) {
  console.error('❌ Cannot read .env.local file:', error.message);
  console.log('💡 Please ensure .env.local exists in the project root');
  process.exit(1);
}

// Parse environment variables
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Found in .env.local:');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Set' : 'Missing');
  process.exit(1);
}

console.log('🚀 Starting APEX Fit Gym Management System Migration...\n');
console.log('🔗 Supabase URL:', supabaseUrl.substring(0, 30) + '...');
console.log('🔑 Service key:', supabaseServiceKey.substring(0, 20) + '...\n');

// Read migration file
const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250404_gym_management_system.sql');
let migrationSQL = '';

try {
  migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  console.log('📄 Migration file loaded:', migrationPath);
  console.log('📏 SQL size:', migrationSQL.length, 'bytes\n');
} catch (error) {
  console.error('❌ Cannot read migration file:', error.message);
  process.exit(1);
}

// Create a simple HTML page to run the migration via Supabase SQL editor
const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>APEX Fit Gym Management Migration</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
            background: #f8fafc;
            color: #1e293b;
        }
        .container {
            background: white;
            border-radius: 0.5rem;
            padding: 2rem;
            box-shadow: 0 1px 3px 0 rgba(0,0,0,0.1);
        }
        h1 {
            color: #0a2540;
            margin-bottom: 1rem;
        }
        .success {
            color: #059669;
            background: #d1fae5;
            padding: 1rem;
            border-radius: 0.375rem;
            margin: 1rem 0;
            border: 1px solid #a7f3d0;
        }
        .warning {
            color: #92400e;
            background: #fef3c7;
            padding: 1rem;
            border-radius: 0.375rem;
            margin: 1rem 0;
            border: 1px solid #fde68a;
        }
        .error {
            color: #dc2626;
            background: #fee2e2;
            padding: 1rem;
            border-radius: 0.375rem;
            margin: 1rem 0;
            border: 1px solid #fecaca;
        }
        .info {
            color: #1e40af;
            background: #dbeafe;
            padding: 1rem;
            border-radius: 0.375rem;
            margin: 1rem 0;
            border: 1px solid #bfdbfe;
        }
        pre {
            background: #f1f5f9;
            padding: 1rem;
            border-radius: 0.375rem;
            overflow-x: auto;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 0.875rem;
            line-height: 1.5;
        }
        .steps {
            margin: 2rem 0;
        }
        .step {
            margin-bottom: 1.5rem;
            padding: 1rem;
            background: #f8fafc;
            border-radius: 0.375rem;
            border-left: 4px solid #3b82f6;
        }
        .step h3 {
            margin-top: 0;
            color: #1e40af;
        }
        code {
            background: #e2e8f0;
            padding: 0.125rem 0.375rem;
            border-radius: 0.25rem;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 0.875rem;
        }
        .copy-btn {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 0.375rem;
            cursor: pointer;
            font-weight: 500;
            margin-top: 1rem;
        }
        .copy-btn:hover {
            background: #2563eb;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>APEX Fit Gym Management System Migration</h1>
        
        <div class="info">
            <strong>📋 Manual Migration Required</strong>
            <p>This migration needs to be run manually in the Supabase SQL Editor due to security restrictions.</p>
        </div>
        
        <div class="steps">
            <div class="step">
                <h3>Step 1: Open Supabase SQL Editor</h3>
                <p>Go to: <a href="${supabaseUrl}/project/default/sql" target="_blank">${supabaseUrl}/project/default/sql</a></p>
            </div>
            
            <div class="step">
                <h3>Step 2: Copy the Migration SQL</h3>
                <p>Copy the entire SQL below and paste it into the Supabase SQL Editor:</p>
                <pre id="sql-code">${migrationSQL}</pre>
                <button class="copy-btn" onclick="copySQL()">Copy SQL to Clipboard</button>
            </div>
            
            <div class="step">
                <h3>Step 3: Run the Migration</h3>
                <p>Click "Run" in the Supabase SQL Editor to execute the migration.</p>
                <p class="warning">⚠️ This will modify your database schema. Ensure you have a backup if needed.</p>
            </div>
            
            <div class="step">
                <h3>Step 4: Verify Migration</h3>
                <p>After running, verify the migration by checking these tables exist:</p>
                <ul>
                    <li><code>subscription_plans</code> - Should have 3 plans (Starter, Growth, Pro)</li>
                    <li><code>gym_subscriptions</code> - Subscription tracking</li>
                    <li><code>gym_features</code> - Feature flags per gym</li>
                    <li><code>client_groups</code> - Client organization</li>
                    <li><code>gym_trainers</code> - Trainer management</li>
                </ul>
            </div>
        </div>
        
        <div class="success">
            <strong>✅ Migration Complete!</strong>
            <p>Once verified, you can proceed with implementing the API endpoints and UI.</p>
        </div>
        
        <div class="info">
            <h3>📋 Next Steps After Migration:</h3>
            <ol>
                <li>Implement gym management API endpoints</li>
                <li>Create owner dashboard for platform management</li>
                <li>Build gym manager interface for client/trainer management</li>
                <li>Integrate Stripe billing for subscriptions</li>
                <li>Test capacity enforcement and overage charges</li>
            </ol>
        </div>
    </div>
    
    <script>
        function copySQL() {
            const sqlCode = document.getElementById('sql-code');
            const range = document.createRange();
            range.selectNode(sqlCode);
            window.getSelection().removeAllRanges();
            window.getSelection().addRange(range);
            
            try {
                document.execCommand('copy');
                alert('✅ SQL copied to clipboard!');
            } catch (err) {
                alert('❌ Failed to copy SQL: ' + err);
            }
            
            window.getSelection().removeAllRanges();
        }
        
        // Auto-select SQL on page load for easy copying
        window.addEventListener('load', function() {
            const sqlCode = document.getElementById('sql-code');
            sqlCode.addEventListener('click', function() {
                const range = document.createRange();
                range.selectNode(this);
                window.getSelection().removeAllRanges();
                window.getSelection().addRange(range);
            });
        });
    </script>
</body>
</html>`;

// Save the HTML file
const htmlPath = path.join(__dirname, 'gym-management-migration.html');
fs.writeFileSync(htmlPath, htmlContent);

console.log('📄 Created migration instructions:', htmlPath);
console.log('\n📋 Manual Migration Steps:');
console.log('1. Open the HTML file in your browser');
console.log('2. Follow the step-by-step instructions');
console.log('3. Run the SQL in Supabase SQL Editor');
console.log('4. Verify the migration was successful');
console.log('\n💡 The HTML file contains:');
console.log('   - Complete migration SQL');
console.log('   - Step-by-step instructions');
console.log('   - Copy-to-clipboard functionality');
console.log('   - Verification steps');
console.log('\n🚀 Ready to migrate!');