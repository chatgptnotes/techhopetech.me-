import { NextRequest, NextResponse } from 'next/server';
import { dbError, apiError } from '@/lib/api';
import { db } from '@/lib/supabase-admin';

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { data, error } = await db.from('bni_contacts').update(body).eq('id', id).select().single();
    if (error) return dbError(error);
    return NextResponse.json(data);
  } catch (error) { return dbError(error); }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const { error } = await db.from('bni_contacts').update({ hidden: true }).eq('id', id);
    if (error) return dbError(error);
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error instanceof Error ? error.message : 'Delete failed'); }
}
