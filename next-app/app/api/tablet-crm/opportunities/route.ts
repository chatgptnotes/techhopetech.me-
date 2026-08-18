import { NextRequest, NextResponse } from 'next/server';
import {
  getOpportunities,
  updateOpportunity,
  closeOpportunity
} from '@/lib/tablet-crm';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const employeeId = searchParams.get('employeeId');
    const status = searchParams.get('status');

    if (!employeeId) {
      return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });
    }

    const opportunities = await getOpportunities(employeeId, status || undefined);

    return NextResponse.json({ success: true, data: opportunities });
  } catch (error: any) {
    console.error('Error fetching opportunities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch opportunities', details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { opportunityId, action, actualRevenue } = body;

    if (!opportunityId) {
      return NextResponse.json({ error: 'Opportunity ID is required' }, { status: 400 });
    }

    let result;
    if (action === 'close') {
      const status = body.status === 'won' ? 'won' : 'lost';
      result = await closeOpportunity(opportunityId, status, actualRevenue);
    } else {
      const { opportunityId: _, action:__, ...updates } = body;
      result = await updateOpportunity(opportunityId, updates);
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Error updating opportunity:', error);
    return NextResponse.json(
      { error: 'Failed to update opportunity', details: error.message },
      { status: 500 }
    );
  }
}
