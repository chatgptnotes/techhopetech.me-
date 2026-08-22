/**
 * API Route to create WhatsApp Communication Marketing Head
 * Call: POST /api/create-whatsapp-user
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName } = await request.json();

    const supabaseUrl = process.env.SUPABASE_URL || `https://ssmdztkqfvgqajzggwjp.supabase.co`;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ACCESS_TOKEN || '';

    if (!supabaseKey) {
      throw new Error('SUPABASE_ACCESS_TOKEN not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create user with marketing_head role
    const { data, error } = await supabase.auth.signUp({
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

    if (error) {
      // If user exists, try to update them
      if (error.message.includes('already registered')) {
        return NextResponse.json({
          success: true,
          message: 'User already exists. You can login with the provided credentials.',
          credentials: {
            email,
            password,
            loginUrl: 'https://hopetech.me/whatsapp-communication/login'
          }
        });
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'WhatsApp Communication Marketing Head created successfully!',
      user: data,
      credentials: {
        email,
        password,
        loginUrl: 'https://hopetech.me/whatsapp-communication/login'
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      credentials: {
        email: 'marketing@hopehospital.com',
        password: 'Marketing Head',
        loginUrl: 'https://hopetech.me/whatsapp-communication/login',
        note: 'Try these credentials - the user may already exist'
      }
    }, { status: 500 });
  }
}