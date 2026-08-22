/**
 * Direct SQL approach to create WhatsApp Communication Marketing Head
 * Run from next-app directory: node scripts/create-marketing-head.mjs
 */

import { createClient } from '@supabase/supabase-js';

// Load environment variables
const fs = require('fs');
const path = require('path');

// Read .env file
const envPath = path.join(process.cwd(), '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');

// Parse environment variables
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

const SUPABASE_URL = `https://${envVars.SUPABASE_PROJECT_REF}.supabase.co`;
const SUPABASE_ANON_KEY = envVars.SUPABASE_ACCESS_TOKEN;

async function createMarketingHead(email, password, fullName) {
  try {
    console.log('🔧 Creating WhatsApp Communication Marketing Head...');
    console.log(`📧 Email: ${email}`);
    console.log(`👤 Name: ${fullName}`);
    console.log(`🔑 Password: ${password}`);
    console.log('');

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Try to sign up the user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'marketing_head',
          whatsapp_access: true
        }
      }
    });

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        console.log('⚠️  User already exists. Please use the Supabase dashboard to:');
        console.log('   1. Go to Authentication → Users');
        console.log(`   2. Find user: ${email}`);
        console.log('   3. Update user_metadata to:');
        console.log('      {');
        console.log('        "full_name": "' + fullName + '",');
        console.log('        "role": "marketing_head",');
        console.log('        "whatsapp_access": true');
        console.log('      }');
        return;
      }
      throw signUpError;
    }

    console.log('✅ WhatsApp Communication Marketing Head created successfully!');
    console.log('');
    console.log('📋 USER DETAILS:');
    console.log('🎯 Role: marketing_head');
    console.log('🔓 WhatsApp Access: Granted');
    console.log('👤 Full Name: ' + fullName);
    console.log('');
    console.log('🔐 LOGIN CREDENTIALS:');
    console.log('🌐 URL: https://hopetech.me/whatsapp-communication/login');
    console.log('📧 Email: ' + email);
    console.log('🔑 Password: ' + password);
    console.log('');
    console.log('⚠️  PLEASE SAVE THESE CREDENTIALS SECURELY!');
    console.log('');
    console.log('🎉 You can now login to the WhatsApp Communication Portal!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('');
    console.log('📝 MANUAL SETUP INSTRUCTIONS:');
    console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Go to Authentication → Users');
    console.log('4. Click "Add user" or "Create user"');
    console.log(`5. Enter email: ${email}`);
    console.log(`6. Enter password: ${password}`);
    console.log('7. In user_metadata, add:');
    console.log('   {');
    console.log('     "full_name": "' + fullName + '",');
    console.log('     "role": "marketing_head",');
    console.log('     "whatsapp_access": true');
    console.log('   }');
    console.log('8. Confirm email creation');
    console.log('9. Login at: https://hopetech.me/whatsapp-communication/login');
  }
}

// Get command line arguments
const args = process.argv.slice(2);
const email = args[0] || 'marketing@hopehospital.com';
const password = args[1] || 'Marketing Head';
const fullName = args[2] || 'Marketing Head';

createMarketingHead(email, password, fullName);