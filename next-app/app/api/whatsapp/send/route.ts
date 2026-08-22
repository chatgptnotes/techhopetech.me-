import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { sendTextMessage } from '@/lib/doubletick-service';

// Lazy admin client so `next build` page-data collection never crashes when
// env vars are absent in the build environment.
let anonClient: SupabaseClient | undefined;

function getAnonClient(): SupabaseClient {
  if (anonClient) return anonClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be configured');
  }

  anonClient = createClient(url, key, { auth: { persistSession: false } });
  return anonClient;
}

export async function POST(request: NextRequest) {
  try {
    // Only signed-in portal users may trigger real WhatsApp sends.
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await getAnonClient().auth.getUser(token);
    if (userError || !userData.user) {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
    }

    const { to, message } = (await request.json()) as { to?: string; message?: string };
    if (!to || !message) {
      return NextResponse.json(
        { success: false, error: 'to and message are required' },
        { status: 400 }
      );
    }

    const result = await sendTextMessage(to, message);

    return NextResponse.json(result, { status: result.success ? 200 : 502 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
