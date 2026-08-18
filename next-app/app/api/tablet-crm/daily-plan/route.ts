import { NextRequest, NextResponse } from 'next/server';
import {
  createDailyVisitPlan,
  getDailyVisitPlan,
  updateDailyVisitPlan,
  getMarketingEmployees
} from '@/lib/tablet-crm';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const employeeId = searchParams.get('employeeId');
    const date = searchParams.get('date');

    if (!employeeId || !date) {
      return NextResponse.json({ error: 'Employee ID and date are required' }, { status: 400 });
    }

    const plan = await getDailyVisitPlan(employeeId, date);

    return NextResponse.json({ success: true, data: plan });
  } catch (error: any) {
    console.error('Error fetching daily plan:', error);
    return NextResponse.json(
      { error: 'Failed to fetch daily plan', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const plan = await createDailyVisitPlan(body);

    return NextResponse.json({ success: true, data: plan }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating daily plan:', error);
    return NextResponse.json(
      { error: 'Failed to create daily plan', details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { planId, ...updates } = body;

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    const plan = await updateDailyVisitPlan(planId, updates);

    return NextResponse.json({ success: true, data: plan });
  } catch (error: any) {
    console.error('Error updating daily plan:', error);
    return NextResponse.json(
      { error: 'Failed to update daily plan', details: error.message },
      { status: 500 }
    );
  }
}
