import { NextRequest, NextResponse } from 'next/server';
import { dbError } from '@/lib/api';
import { db } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get('q')?.trim();
    let query = db.from('bni_contacts').select('*').order('updated_at', { ascending: false });
    if (q) query = query.or(`first.ilike.%${q}%,last.ilike.%${q}%,company.ilike.%${q}%,city.ilike.%${q}%`);
    const { data, error } = await query;
    if (error) return dbError(error);
    return NextResponse.json(data || []);
  } catch (error) { return dbError(error); }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const row = {
      id: body.id || crypto.randomUUID(),
      first: body.first || '', last: body.last || '', company: body.company || '',
      city: body.city || '', phone: body.phone || '', email: body.email || '',
      chapter: body.chapter || '', segment: body.segment || 'Other',
      status: body.status || 'Identified', notes: body.notes || '',
      tenure: body.tenure || null, assignee_id: body.assignee_id || null,
      hidden: body.hidden === true,
    };
    const { data, error } = await db.from('bni_contacts').upsert(row).select().single();
    if (error) return dbError(error);
    return NextResponse.json(data, { status: 201 });
  } catch (error) { return dbError(error); }
}
