import { NextRequest, NextResponse } from 'next/server';
import {
  createLead,
  getLeads,
  convertLeadToOpportunity,
  updateLead
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

    const leads = await getLeads(employeeId, status || undefined);

    return NextResponse.json({ success: true, data: leads });
  } catch (error: any) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leads', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action;

    if (action === 'convertToOpportunity') {
      const { leadId, opportunity } = body;
      const result = await convertLeadToOpportunity(leadId, opportunity);
      return NextResponse.json({ success: true, data: result }, { status: 201 });
    } else {
      const lead = await createLead(body);
      return NextResponse.json({ success: true, data: lead }, { status: 201 });
    }
  } catch (error: any) {
    console.error('Error creating lead:', error);
    return NextResponse.json(
      { error: 'Failed to create lead', details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId, ...updates } = body;

    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 });
    }

    const lead = await updateLead(leadId, updates);

    return NextResponse.json({ success: true, data: lead });
  } catch (error: any) {
    console.error('Error updating lead:', error);
    return NextResponse.json(
      { error: 'Failed to update lead', details: error.message },
      { status: 500 }
    );
  }
}
