import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export class HttpError extends Error {
  constructor(
    public message: string,
    public status: number
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export async function authenticateUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new HttpError('Unauthorized', 401);
  }

  const token = authHeader.substring(7);

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new HttpError('Invalid token', 401);
    }

    return user;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError('Authentication failed', 401);
  }
}

export async function requireMarketingAdmin(request: NextRequest) {
  const user = await authenticateUser(request);

  // Check if user has marketing admin role
  const { data: userRole } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userRole || userRole.role !== 'marketing_admin') {
    throw new HttpError('Forbidden: Marketing admin access required', 403);
  }

  return user;
}
