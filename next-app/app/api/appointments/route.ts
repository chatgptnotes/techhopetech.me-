import { NextRequest, NextResponse } from 'next/server';
import { dbError } from '@/lib/api';
import { db } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const [appointments, contacts, developers] = await Promise.all([
      db.from('bni_appointments').select('*').order('date', { ascending: false }),
      db.from('bni_contacts').select('*').in('status', ['Meeting Scheduled', 'Met', 'Follow-up', 'Converted']),
      db.from('developers').select('id,name').order('name'),
    ]);
    if (appointments.error) return dbError(appointments.error);
    if (contacts.error) return dbError(contacts.error);
    if (developers.error) return dbError(developers.error);
    return NextResponse.json({ appointments: appointments.data || [], contacts: contacts.data || [], developers: developers.data || [] });
  } catch (error) { return dbError(error); }
}
