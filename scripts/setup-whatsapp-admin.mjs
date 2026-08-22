/**
 * Setup WhatsApp Communication Admin User
 * Run: node scripts/setup-whatsapp-admin.mjs <email> <password> <name>
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.log('💡 Set it: export SUPABASE_SERVICE_ROLE_KEY="your-service-key"');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function createWhatsAppAdmin(email, password, fullName) {
  try {
    console.log(`🔧 Creating WhatsApp Communication Admin...`);
    console.log(`📧 Email: ${email}`);
    console.log(`👤 Name: ${fullName}`);

    // Check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('auth.users')
      .select('*')
      .eq('email', email)
      .single();

    if (existingUser) {
      console.log(`⚠️  User with email ${email} already exists`);
      console.log('🔄 Updating user role to marketing_head...');

      // Update existing user
      const { data: updateData, error: updateError } = await supabase
        .from('auth.users')
        .update({
          raw_user_meta_data: {
            ...existingUser.raw_user_meta_data,
            role: 'marketing_head',
            whatsapp_access: true,
            full_name: fullName
          }
        })
        .eq('id', existingUser.id);

      if (updateError) throw updateError;

      console.log('✅ User role updated successfully!');
      console.log('🎯 Role: marketing_head');
      console.log('🔓 WhatsApp Access: Granted');
      console.log('');
      console.log('📝 Login Credentials:');
      console.log(`🌐 URL: https://hopetech.me/whatsapp-communication/login`);
      console.log(`📧 Email: ${email}`);
      console.log(`🔑 Password: (use existing password)`);

      return;
    }

    // Create new user
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: 'marketing_head',
        whatsapp_access: true
      }
    });

    if (createError) throw createError;

    console.log('✅ WhatsApp Communication Admin created successfully!');
    console.log('🎯 Role: marketing_head');
    console.log('🔓 WhatsApp Access: Granted');
    console.log('');
    console.log('📝 Login Credentials:');
    console.log(`🌐 URL: https://hopetech.me/whatsapp-communication/login`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log('');
    console.log('⚠️  Store these credentials securely!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Get command line arguments
const args = process.argv.slice(2);
if (args.length < 3) {
  console.log('Usage: node scripts/setup-whatsapp-admin.mjs <email> <password> <full-name>');
  console.log('');
  console.log('Example:');
  console.log('node scripts/setup-whatsapp-admin.mjs marketing@hopehospital.com securePass123 "Dr. Marketing Head"');
  process.exit(1);
}

createWhatsAppAdmin(args[0], args[1], args[2]);