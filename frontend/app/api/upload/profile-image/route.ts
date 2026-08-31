import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/actions/auth';
import { uploadFile } from '@/lib/r2-storage';

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();

    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated',
      }, { status: 401 });
    }

    // Parse the form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    // Validate file
    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'No file provided'
      }, { status: 400 });
    }

    // Check file type (only images)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid file type. Only images are allowed.'
      }, { status: 400 });
    }

    // Check file size (max 5MB for profile images)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json({
        success: false,
        error: 'File too large. Maximum size is 5MB.'
      }, { status: 400 });
    }

    // Generate unique file key for profile images
    const fileExtension = file.name.split('.').pop();
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const key = `profile-images/${timestamp}-${randomString}.${fileExtension}`;

    // Convert File to Buffer
    const fileBuffer = await file.arrayBuffer();

    // Upload to Cloudflare R2
    console.log('Uploading profile image to Cloudflare R2:', { key, fileSize: file.size });
    const publicUrl = await uploadFile(Buffer.from(fileBuffer), key, file.type);
    console.log('Profile image upload successful to Cloudflare R2:', publicUrl);

    return NextResponse.json({
      success: true,
      fileUrl: publicUrl,
      key: key
    });

  } catch (error) {
    console.error('Error uploading profile image to Cloudflare R2:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    }, { status: 500 });
  }
}
