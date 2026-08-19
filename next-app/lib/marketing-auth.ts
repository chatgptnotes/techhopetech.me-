import type { NextRequest } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { db } from '@/lib/supabase-admin';

export class HttpError extends Error {
  constructor(
    message: string,
    public status = 500,
  ) {
    super(message);
  }
}

function bearerToken(request: NextRequest) {
  const authorization = request.headers.get('authorization') || '';
  return authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
}

export async function requireMarketingAdmin(request: NextRequest): Promise<User> {
  const token = bearerToken(request);
  if (!token) throw new HttpError('Sign in is required', 401);

  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) throw new HttpError('Your session is invalid or expired', 401);

  const { data: admin } = await db
    .from('marketing_admins')
    .select('user_id')
    .eq('user_id', data.user.id)
    .eq('active', true)
    .maybeSingle();

  if (admin) return data.user;

  const email = String(data.user.email || '').trim();
  if (email) {
    const { data: member } = await db
      .from('bni_members')
      .select('id')
      .ilike('email', email)
      .eq('active', true)
      .maybeSingle();

    if (member) {
      await db.from('marketing_admins').upsert({
        user_id: data.user.id,
        email,
        active: true,
        updated_at: new Date().toISOString(),
      });
      return data.user;
    }
  }

  throw new HttpError('This account does not have marketing administrator access', 403);
}

export function requireCron(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) throw new HttpError('CRON_SECRET is not configured', 503);
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    throw new HttpError('Invalid cron authorization', 401);
  }
}

export async function authenticateUser(request: NextRequest): Promise<User> {
  const token = bearerToken(request);
  if (!token) throw new HttpError('Authentication is required', 401);

  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) throw new HttpError('Your session is invalid or expired', 401);

  return data.user;
}