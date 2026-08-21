/**
 * WhatsApp Module Authentication System
 * Separate authentication and authorization for WhatsApp Communication Module
 */

import { createClient } from '@supabase/supabase-js';
import { db } from '@/lib/supabase-admin';

/**
 * Non-admin client used to verify passwords.
 * The admin API cannot sign users in, so a client with the publishable key is required.
 */
function getAuthClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_KEY must be configured for WhatsApp authentication');
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export interface WhatsAppAuthUser {
  id: string;
  email: string;
  full_name: string;
  role: 'marketing_head' | 'marketing_team';
  created_at: string;
  last_login: string;
}

export interface WhatsAppAuthToken {
  token: string;
  user: WhatsAppAuthUser;
  expires_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Authenticate WhatsApp module user
 */
export async function authenticateWhatsAppUser(email: string, password: string): Promise<WhatsAppAuthToken | null> {
  try {
    // Verify email + password using Supabase auth (non-admin client)
    const { data: signInData, error: signInError } = await getAuthClient().auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (signInError || !signInData.user) {
      throw new Error('Invalid credentials');
    }

    // Check if user has WhatsApp module access
    const userMetadata = signInData.user.user_metadata || {};
    if (!userMetadata.whatsapp_access && userMetadata.role !== 'admin') {
      throw new Error('No access to WhatsApp module');
    }

    // Generate JWT token for WhatsApp module
    const token = await generateWhatsAppToken({
      user_id: signInData.user.id,
      email: signInData.user.email,
      full_name: `${signInData.user.user_metadata?.full_name || email}`,
      role: userMetadata.role
    });

    // Update last login
    await updateLastLogin(signInData.user.id);

    return {
      token: token,
      user: {
        id: signInData.user.id,
        email: signInData.user.email!,
        full_name: userMetadata.full_name || email,
        role: userMetadata.role || 'marketing_team',
        created_at: signInData.user.created_at,
        last_login: new Date().toISOString()
      },
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };

  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

/**
 * Generate JWT token for WhatsApp module access
 */
async function generateWhatsAppToken(claims: any): Promise<string> {
  // Simple JWT generation (in production, use proper JWT library)
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    ...claims,
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    iat: Math.floor(Date.now() / 1000)
  }));

  const secret = process.env.JWT_SECRET || 'whatsapp-module-secret';
  const signature = btoa(`${header}.${payload}.${secret}`);

  return `${header}.${payload}.${signature}`;
}

/**
 * Verify WhatsApp module token
 */
export function verifyWhatsAppToken(token: string): WhatsAppAuthUser | null {
  try {
    const [header, payload, signature] = token.split('.');
    const secret = process.env.JWT_SECRET || 'whatsapp-module-secret';

    // Verify signature
    const expectedSignature = btoa(`${header}.${payload}.${secret}`);
    if (signature !== expectedSignature) {
      return null;
    }

    const user = JSON.parse(atob(payload));

    // Check expiration
    if (user.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return {
      id: user.user_id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      created_at: user.created_at,
      last_login: user.last_login
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

/**
 * Update last login timestamp
 */
async function updateLastLogin(userId: string): Promise<void> {
  try {
    await db
      .from('auth.users')
      .update({
        user_metadata: {
          ...((await db.from('auth.users').select('user_metadata').eq('id', userId).single()).data?.user_metadata || {}),
          last_login: new Date().toISOString()
        }
      })
      .eq('id', userId);
  } catch (error) {
    console.error('Error updating last login:', error);
  }
}

/**
 * Grant WhatsApp module access to user
 */
export async function grantWhatsAppAccess(userId: string, grantedBy: string): Promise<boolean> {
  try {
    const { data: user } = await db
      .from('auth.users')
      .update({
        user_metadata: {
          ...((await db.from('auth.users').select('user_metadata').eq('id', userId).single()).data?.user_metadata || {}),
          whatsapp_access: true
        }
      })
      .eq('id', userId)
      .single();

    return !!user;
  } catch (error) {
    console.error('Error granting WhatsApp access:', error);
    return false;
  }
}

/**
 * Check if user has WhatsApp module access
 */
export async function hasWhatsAppAccess(userId: string): Promise<boolean> {
  try {
    const { data: user } = await db
      .from('auth.users')
      .select('user_metadata')
      .eq('id', userId)
      .single();

    const metadata = user?.user_metadata || {};
    return metadata.whatsapp_access === true || metadata.role === 'admin';
  } catch (error) {
    console.error('Error checking WhatsApp access:', error);
    return false;
  }
}