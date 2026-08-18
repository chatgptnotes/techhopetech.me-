import { NextRequest, NextResponse } from 'next/server';
import {
  createDoctorVisit,
  getDoctorVisits,
  updateDoctorVisit,
  markVisitCompleted,
  getAllDoctorVisits
} from '@/lib/tablet-crm';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const employeeId = searchParams.get('employeeId');
    const date = searchParams.get('date');
    const allVisits = searchParams.get('all') === 'true';

    if (!employeeId) {
      return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });
    }

    let visits;
    if (allVisits) {
      visits = await getAllDoctorVisits(employeeId);
    } else if (date) {
      visits = await getDoctorVisits(employeeId, date);
    } else {
      return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: visits });
  } catch (error: any) {
    console.error('Error fetching visits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch visits', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const visit = await createDoctorVisit(body);

    return NextResponse.json({ success: true, data: visit }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating visit:', error);
    return NextResponse.json(
      { error: 'Failed to create visit', details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const visitId = searchParams.get('visitId');
    const action = searchParams.get('action');

    if (!visitId) {
      return NextResponse.json({ error: 'Visit ID is required' }, { status: 400 });
    }

    let result;
    if (action === 'complete') {
      result = await markVisitCompleted(visitId);
    } else {
      const body = await request.json();
      result = await updateDoctorVisit(visitId, body);
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Error updating visit:', error);
    return NextResponse.json(
      { error: 'Failed to update visit', details: error.message },
      { status: 500 }
    );
  }
}
