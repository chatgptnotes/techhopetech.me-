import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;

if (!url || !key) {
  throw new Error('SUPABASE_URL and SUPABASE_KEY must be configured for the Next.js server');
}

export const db = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});
