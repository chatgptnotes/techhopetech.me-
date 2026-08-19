import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase-admin';
import { routeError } from '@/lib/api';
import { requireMarketingAdmin } from '@/lib/marketing-auth';
import { hubSpotConfigured, syncHubSpotContacts } from '@/lib/hubspot';

export async function GET(request: NextRequest) {
  try {
    await requireMarketingAdmin(request);
    const { data, error } = await db.from('marketing_sync_logs')
      .select('*')
      .eq('provider', 'hubspot')
      .order('started_at', { ascending: false })
      .limit(10);
    if (error) throw error;
    return NextResponse.json({
      configured: hubSpotConfigured(),
      status: hubSpotConfigured() ? 'Ready' : 'Disconnected',
      logs: data || [],
    });
  } catch (error) {
    return routeError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireMarketingAdmin(request);
    const counts = await syncHubSpotContacts();
    return NextResponse.json({ synced: true, counts });
  } catch (error) {
    return routeError(error);
  }
}
