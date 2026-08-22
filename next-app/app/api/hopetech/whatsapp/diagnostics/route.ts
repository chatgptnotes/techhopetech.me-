import { NextResponse } from 'next/server';
import { validateDoubletickConfig } from '@/lib/doubletick-service';

export async function GET() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    doubletick: {
      configured: false,
      apiKey: process.env.DOUBLETICK_API_KEY ? '✓ Set' : '✗ Missing',
      apiUrl: process.env.DOUBLETICK_API_URL || 'Not configured',
      fromNumber: process.env.DOUBLETICK_FROM_NUMBER || 'Not configured',
      defaultLanguage: process.env.DOUBLETICK_DEFAULT_LANGUAGE || 'en',
      templateName: process.env.GOOD_MORNING_TEMPLATE_NAME || 'Not configured'
    },
    validation: validateDoubletickConfig()
  };

  if (diagnostics.doubletick.apiKey === '✓ Set' &&
      diagnostics.doubletick.fromNumber !== 'Not configured' &&
      diagnostics.doubletick.apiUrl !== 'Not configured') {
    diagnostics.doubletick.configured = true;
  }

  return NextResponse.json(diagnostics);
}