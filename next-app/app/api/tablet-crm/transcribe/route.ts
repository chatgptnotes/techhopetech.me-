import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// Speech-to-text using Web Speech API (client-side) or mock transcription
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { audioUrl, duration } = body;

    if (!audioUrl) {
      return NextResponse.json({ error: 'Audio URL is required' }, { status: 400 });
    }

    // For demo purposes, return a mock transcription
    // In production, you would integrate with a real speech-to-text service
    // like Google Cloud Speech-to-Text, AWS Transcribe, or Azure Speech Services

    const mockTranscriptions = [
      "Doctor showed interest in our cardiology services. Follow up next week regarding patient referral opportunities.",
      "Meeting went well. Doctor wants to discuss the corporate health checkup packages in detail.",
      "Hospital administration is considering our proposal. Need to send detailed pricing by Friday.",
      "Doctor appreciated the demo. They particularly liked the telemedicine features.",
      "Visit was productive. Doctor agreed to refer patients for our specialized treatments.",
      "Discussion focused on insurance claim processing efficiency. They want a demo.",
      "Doctor expressed concerns about implementation timeline. Need to address technical questions.",
      "Meeting resulted in agreement for pilot program starting next month.",
      "Hospital is reviewing our proposal against competitors. Follow up scheduled for Thursday.",
      "Doctor requested information about our diagnostic center partnerships and referral process."
    ];

    // Select a random transcription
    const transcription = mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)];

    return NextResponse.json({
      success: true,
      data: {
        transcription,
        confidence: 0.95,
        language: 'en-US',
        duration: duration || 30
      }
    });

  } catch (error: any) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio', details: error.message },
      { status: 500 }
    );
  }
}

// For production, you would implement actual speech-to-text integration:
/*
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { audioUrl } = body;

    // Google Cloud Speech-to-Text example
    const speech = require('@google-cloud/speech');
    const client = new speech.SpeechClient();

    const audio = {
      uri: audioUrl,
    };

    const config = {
      encoding: 'WEBM_OPUS',
      sampleRateHertz: 48000,
      languageCode: 'en-US',
    };

    const request_data = {
      audio: audio,
      config: config,
    };

    const [response] = await client.recognize(request_data);

    const transcription = response.results
      .map(result => result.alternatives[0].transcript)
      .join('\n');

    return NextResponse.json({
      success: true,
      data: { transcription }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 });
  }
}
*/
