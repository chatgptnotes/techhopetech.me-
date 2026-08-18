import { NextRequest, NextResponse } from 'next/server';
import { getAllEmployeesPerformanceMetrics } from '@/lib/tablet-crm';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');

    const metrics = await getAllEmployeesPerformanceMetrics(
      date || new Date().toISOString().split('T')[0]
    );

    return NextResponse.json({ success: true, data: metrics });
  } catch (error: any) {
    console.error('Error fetching management metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch management metrics', details: error.message },
      { status: 500 }
    );
  }
}
