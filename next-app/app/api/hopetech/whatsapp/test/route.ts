import { NextResponse } from 'next/server';
import { sendGoodMorningMessage, validateDoubletickConfig } from '@/lib/doubletick-service';

export async function POST(request: Request) {
  try {
    // Validate configuration
    const configCheck = validateDoubletickConfig();
    if (!configCheck.valid) {
      return NextResponse.json({
        success: false,
        error: configCheck.error
      }, { status: 500 });
    }

    // Get test parameters from request body
    const body = await request.json();
    const { doctorName, phoneNumber } = body;

    if (!doctorName || !phoneNumber) {
      return NextResponse.json({
        success: false,
        error: 'doctorName and phoneNumber are required'
      }, { status: 400 });
    }

    // Send test message
    const result = await sendGoodMorningMessage(doctorName, phoneNumber);

    return NextResponse.json({
      success: result.success,
      message: result.success
        ? `Test message sent to ${doctorName} at ${phoneNumber}`
        : 'Failed to send test message',
      data: result
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}