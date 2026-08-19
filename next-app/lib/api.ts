import { NextResponse } from 'next/server';
import { HttpError } from '@/lib/marketing-auth';

export function apiError(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status });
}

export function dbError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Database request failed';
  return apiError(message, 500);
}

export function routeError(error: unknown) {
  if (error instanceof HttpError) return apiError(error.message, error.status);
  return dbError(error);
}
