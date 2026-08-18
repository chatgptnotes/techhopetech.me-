import { NextRequest, NextResponse } from 'next/server';
import { createVisitMedia, getVisitMediaByVisit } from '@/lib/tablet-crm';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const visitId = searchParams.get('visitId');

    if (!visitId) {
      return NextResponse.json({ error: 'Visit ID is required' }, { status: 400 });
    }

    const media = await getVisitMediaByVisit(visitId);

    return NextResponse.json({ success: true, data: media });
  } catch (error: any) {
    console.error('Error fetching media:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const media = await createVisitMedia(body);

    return NextResponse.json({ success: true, data: media }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating media:', error);
    return NextResponse.json(
      { error: 'Failed to create media', details: error.message },
      { status: 500 }
    );
  }
}
