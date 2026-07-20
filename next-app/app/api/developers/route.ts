import { NextResponse } from 'next/server';
import { dbError } from '@/lib/api';
import { db } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const { data, error } = await db.from('developers').select('id,name,role').order('name');
    if (error) return dbError(error);
    return NextResponse.json(data || []);
  } catch (error) { return dbError(error); }
}
