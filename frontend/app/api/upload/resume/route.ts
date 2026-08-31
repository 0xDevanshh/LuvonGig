import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/actions/auth';
import { uploadFile } from '@/lib/r2-storage';

async function uploadToR2(file: File): Promise<{ url: string; key: string }> {
  // Convert File to Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Create unique file key
  const fileExtension = file.name.split('.').pop();
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const key = `resumes/${timestamp}-${randomString}.${fileExtension}`;

  try {
    // Upload to Cloudflare R2
    console.log('Uploading resume to Cloudflare R2:', { key, fileSize: file.size });
    const publicUrl = await uploadFile(buffer, key, file.type);
    console.log('Resume upload successful to Cloudflare R2:', publicUrl);

    return {
      url: publicUrl,
      key: key
    };
  } catch (error: any) {
    console.error('Resume upload to Cloudflare R2 error:', error);
    throw new Error(`Failed to upload file to Cloudflare R2: ${error.message}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();

    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated',
      }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'No file provided',
      }, { status: 400 });
    }

    // Validate file type - only PDF allowed
    if (file.type !== 'application/pdf') {
      return NextResponse.json({
        success: false,
        error: 'Only PDF files are allowed',
      }, { status: 400 });
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({
        success: false,
        error: 'File size must be less than 10MB',
      }, { status: 400 });
    }

    // Upload to Cloudflare R2
    const uploadResult = await uploadToR2(file);

    console.log('Resume uploaded successfully:', uploadResult);

    return NextResponse.json({
      success: true,
      url: uploadResult.url,
      key: uploadResult.key,
      fileName: file.name,
      fileSize: file.size,
    });

  } catch (error) {
    console.error('Resume upload error:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.',
    }, { status: 500 });
  }
}