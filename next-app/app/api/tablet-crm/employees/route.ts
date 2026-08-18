import { NextRequest, NextResponse } from 'next/server';
import { getMarketingEmployees, getMarketingEmployeeById } from '@/lib/tablet-crm';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const employeeId = searchParams.get('employeeId');

    if (employeeId) {
      const employee = await getMarketingEmployeeById(employeeId);
      return NextResponse.json({ success: true, data: employee });
    } else {
      const employees = await getMarketingEmployees();
      return NextResponse.json({ success: true, data: employees });
    }
  } catch (error: any) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employees', details: error.message },
      { status: 500 }
    );
  }
}
