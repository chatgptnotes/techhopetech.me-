import { NextResponse } from 'next/server';

export function apiError(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status });
}

export function dbError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Database request failed';
  return apiError(message, 500);
}
