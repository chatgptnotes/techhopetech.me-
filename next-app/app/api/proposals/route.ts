import { NextRequest, NextResponse } from 'next/server';
import { dbError } from '@/lib/api';
import { db } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const [proposals, contacts, developers] = await Promise.all([
      db.from('bni_proposals').select('*').order('submitted_at', { ascending: false }),
      db.from('bni_contacts').select('id,first,last,company,status'),
      db.from('developers').select('id,name'),
    ]);
    if (proposals.error) return dbError(proposals.error);
    if (contacts.error) return dbError(contacts.error);
    if (developers.error) return dbError(developers.error);
    return NextResponse.json({ proposals: proposals.data || [], contacts: contacts.data || [], developers: developers.data || [] });
  } catch (error) { return dbError(error); }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data, error } = await db.from('bni_proposals').insert({
      contact_id: body.contact_id, assignee_id: body.assignee_id || null,
      title: body.title || '', notes: body.notes || null, file_url: body.file_url || null,
      file_name: body.file_name || null, file_size: body.file_size || null,
      status: 'pending', submitted_at: new Date().toISOString(),
    }).select().single();
    if (error) return dbError(error);
    return NextResponse.json(data, { status: 201 });
  } catch (error) { return dbError(error); }
}
