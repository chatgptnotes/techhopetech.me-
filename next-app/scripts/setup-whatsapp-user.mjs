/**
 * Create WhatsApp Communication Marketing Head User
 * Uses Supabase REST API to create user directly
 */

const https = require('https');

// Project config — access token must be provided via SUPABASE_ACCESS_TOKEN env var
const SUPABASE_PROJECT_REF = 'ssmdztkqfvgqajzggwjp';
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

const email = 'marketing@hopehospital.com';
const password = 'Marketing Head';
const fullName = 'Marketing Head';

function createSupabaseUser() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: 'marketing_head',
        whatsapp_access: true
      }
    });

    const options = {
      hostname: `${SUPABASE_PROJECT_REF}.supabase.co`,
      path: '/auth/v1/admin/users',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          if (res.statusCode === 200 || res.statusCode === 201) {
            resolve(parsed);
          } else {
            reject(new Error(parsed.message || responseData));
          }
        } catch (e) {
          reject(new Error(responseData));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('🔧 Creating WhatsApp Communication Marketing Head...');
  console.log(`📧 Email: ${email}`);
  console.log(`👤 Name: ${fullName}`);
  console.log('');

  try {
    const result = await createSupabaseUser();

    console.log('✅ WhatsApp Communication Marketing Head created successfully!');
    console.log('');
    console.log('📋 USER DETAILS:');
    console.log('🎯 Role: marketing_head');
    console.log('🔓 WhatsApp Access: Granted');
    console.log('👤 Full Name: ' + fullName);
    console.log('🆔 User ID: ' + result.id);
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
    console.log('⚠️  Note:', error.message);
    console.log('');
    console.log('If user already exists, you can still login with:');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`🌐 URL: https://hopetech.me/whatsapp-communication/login`);
  }
}

main();