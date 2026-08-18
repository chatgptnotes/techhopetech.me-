import { NextRequest, NextResponse } from 'next/server';
import {
  createFollowUpTask,
  getFollowUpTasks,
  completeFollowUpTask,
  updateFollowUpTask
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

    const followUps = await getFollowUpTasks(employeeId, status || undefined);

    return NextResponse.json({ success: true, data: followUps });
  } catch (error: any) {
    console.error('Error fetching follow-ups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch follow-ups', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const followUp = await createFollowUpTask(body);

    return NextResponse.json({ success: true, data: followUp }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating follow-up:', error);
    return NextResponse.json(
      { error: 'Failed to create follow-up', details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const followUpId = searchParams.get('followUpId');
    const action = searchParams.get('action');

    if (!followUpId) {
      return NextResponse.json({ error: 'Follow-up ID is required' }, { status: 400 });
    }

    let result;
    if (action === 'complete') {
      result = await completeFollowUpTask(followUpId);
    } else {
      const body = await request.json();
      result = await updateFollowUpTask(followUpId, body);
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Error updating follow-up:', error);
    return NextResponse.json(
      { error: 'Failed to update follow-up', details: error.message },
      { status: 500 }
    );
  }
}
