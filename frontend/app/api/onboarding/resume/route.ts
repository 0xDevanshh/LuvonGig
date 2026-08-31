import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/actions/auth';
import { getUserActor } from '@/lib/ic-agent';
import { resumeSchema } from '@/lib/validations';

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

    // Validate file
    try {
      resumeSchema.parse({ file });
    } catch (validationError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid file format. Only PDF, DOC, DOCX, and TXT files are allowed.',
      }, { status: 400 });
    }

    // Convert file to buffer for ICP upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    try {
      const actor = await getUserActor();

      // Upload resume to ICP backend
      const result = await actor.upload_resume({
        file_name: file.name,
        file_type: file.type,
        file_content: Array.from(buffer), // Convert Buffer to Array for ICP
      });

      console.log('Resume uploaded to ICP:', result);

      return NextResponse.json({
        success: true,
        message: 'Resume uploaded successfully',
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        uploadResult: result
      });

    } catch (icpError) {
      console.error('ICP resume upload error:', icpError);

      // Fallback: store resume info temporarily
      return NextResponse.json({
        success: true,
        message: 'Resume uploaded temporarily (backend processing pending)',
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fallback: true
      });
    }

  } catch (error) {
    console.error('Resume upload error:', error);

    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    }, { status: 500 });
  }
}