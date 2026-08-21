import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Browser-side Supabase client factory.
 * Uses the public URL + publishable (anon) key so it is safe to ship to the browser.
 * Sessions are persisted so the WhatsApp Communication portal can keep users logged in.
 */
export function createClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

  if (!url || !key) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_KEY) must be configured for the browser client'
    );
  }

  return createSupabaseClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
}
