/**
 * Setup WhatsApp Communication Admin User
 * Run: node scripts/setup-whatsapp-admin.mjs <email> <password> <name>
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ACCESS_TOKEN;

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

    // Create new user with marketing_head role
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

    if (createError) {
      // If user exists, try to update
      if (createError.message.includes('already exists')) {
        console.log('⚠️  User already exists, updating role...');

        const { data: users } = await supabase.auth.admin.listUsers();
        const existingUser = users.users.find(u => u.email === email);

        if (existingUser) {
          const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
            user_metadata: {
              full_name: fullName,
              role: 'marketing_head',
              whatsapp_access: true
            }
          });

          if (updateError) throw updateError;
          console.log('✅ User role updated successfully!');
        }
      } else {
        throw createError;
      }
    } else {
      console.log('✅ WhatsApp Communication Admin created successfully!');
    }

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