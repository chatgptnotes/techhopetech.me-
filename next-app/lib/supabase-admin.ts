import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase client (service role key).
 *
 * Initialized lazily so importing this module — e.g. while Next.js collects
 * page data during `next build` in an environment without the service role
 * key — does not crash the build. A clear error is thrown on first actual
 * use instead.
 */
let adminClient: SupabaseClient | undefined;

function getAdminClient(): SupabaseClient {
  if (adminClient) {
    return adminClient;
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured for the Next.js server');
  }

  adminClient = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return adminClient;
}

export const db: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = getAdminClient();
    const value = Reflect.get(client as object, prop, receiver);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});
