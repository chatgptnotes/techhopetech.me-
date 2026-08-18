import { NextRequest, NextResponse } from 'next/server';
import { createVoiceNote, getVoiceNotesByVisit } from '@/lib/tablet-crm';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const visitId = searchParams.get('visitId');

    if (!visitId) {
      return NextResponse.json({ error: 'Visit ID is required' }, { status: 400 });
    }

    const voiceNotes = await getVoiceNotesByVisit(visitId);

    return NextResponse.json({ success: true, data: voiceNotes });
  } catch (error: any) {
    console.error('Error fetching voice notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch voice notes', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const voiceNote = await createVoiceNote(body);

    return NextResponse.json({ success: true, data: voiceNote }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating voice note:', error);
    return NextResponse.json(
      { error: 'Failed to create voice note', details: error.message },
      { status: 500 }
    );
  }
}
