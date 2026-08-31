import { NextRequest, NextResponse } from 'next/server'
import { uploadFile, deleteFile } from '@/lib/r2-storage'

export async function POST(request: NextRequest) {
  try {
    // Parse the form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = (formData.get('folder') as string) || 'portfolio'

    // Validate file
    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'No file provided'
      }, { status: 400 })
    }

    // Check file type (only images)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid file type. Only images are allowed.'
      }, { status: 400 })
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json({
        success: false,
        error: 'File too large. Maximum size is 10MB.'
      }, { status: 400 })
    }

    // Generate unique file key
    const fileExtension = file.name.split('.').pop()
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 8)
    const key = `${folder}/${timestamp}-${randomString}.${fileExtension}`

    // Convert File to Buffer
    const fileBuffer = await file.arrayBuffer()

    // Upload to Cloudflare R2
    console.log('Uploading to Cloudflare R2:', { key, fileSize: file.size })
    const publicUrl = await uploadFile(Buffer.from(fileBuffer), key, file.type)
    console.log('Upload successful to Cloudflare R2:', publicUrl)

    return NextResponse.json({
      success: true,
      url: publicUrl,
      key: key
    })

  } catch (error) {
    console.error('Error uploading to Cloudflare R2:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    if (!key) {
      return NextResponse.json({
        success: false,
        error: 'No key provided'
      }, { status: 400 })
    }

    console.log('Deleting from Cloudflare R2:', key)
    await deleteFile(key)
    console.log('Delete successful from Cloudflare R2')

    return NextResponse.json({
      success: true
    })

  } catch (error) {
    console.error('Error deleting from Cloudflare R2:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed'
    }, { status: 500 })
  }
}
