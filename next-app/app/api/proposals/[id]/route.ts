import { NextRequest, NextResponse } from 'next/server';
import { dbError } from '@/lib/api';
import { db } from '@/lib/supabase-admin';

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { data, error } = await db.from('bni_proposals').update({
      status: body.status, reviewer_notes: body.reviewer_notes || null,
      reviewed_at: new Date().toISOString(),
    }).eq('id', id).select().single();
    if (error) return dbError(error);
    return NextResponse.json(data);
  } catch (error) { return dbError(error); }
}
