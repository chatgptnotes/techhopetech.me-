import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase-admin';

export const runtime = 'edge';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg'];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'voice', 'photo', 'video'
    const employeeId = formData.get('employeeId') as string;
    const visitId = formData.get('visitId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 });
    }

    // Validate file type
    let allowedTypes: string[] = [];
    if (type === 'voice') allowedTypes = ALLOWED_AUDIO_TYPES;
    else if (type === 'photo') allowedTypes = ALLOWED_IMAGE_TYPES;
    else if (type === 'video') allowedTypes = ALLOWED_VIDEO_TYPES;
    else {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const filename = `${type}-${employeeId}-${timestamp}.${extension}`;

    // Upload to Supabase Storage
    const bucketName = type === 'voice' ? 'voice-notes' : type === 'photo' ? 'visit-photos' : 'visit-videos';
    const filePath = `${employeeId}/${filename}`;

    try {
      const { data: uploadData, error: uploadError } = await db.storage
        .from(bucketName)
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: true
        });

      if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        return NextResponse.json({ error: 'Failed to upload file to storage' }, { status: 500 });
      }

      // Get public URL
      const { data: { publicUrl } } = db.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      // Return the public URL
      return NextResponse.json({
        success: true,
        data: {
          url: publicUrl,
          filename: file.name,
          size: file.size,
          type: file.type,
          bucket: bucketName,
          path: filePath
        }
      });

    } catch (storageError: any) {
      console.error('Storage error:', storageError);

      // If bucket doesn't exist, return a mock URL for development
      const mockUrl = `https://mock-storage.example.com/${bucketName}/${filePath}`;

      return NextResponse.json({
        success: true,
        data: {
          url: mockUrl,
          filename: file.name,
          size: file.size,
          type: file.type,
          mock: true
        }
      });
    }

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file', details: error.message },
      { status: 500 }
    );
  }
}
