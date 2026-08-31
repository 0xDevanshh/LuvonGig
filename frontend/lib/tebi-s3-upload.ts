// Tebi S3 Configuration (client-side only needs public config)
const getTebiConfig = () => {
  return {
    bucket: process.env.NEXT_PUBLIC_TEBI_BUCKET_NAME!,
    endpoint: process.env.NEXT_PUBLIC_TEBI_ENDPOINT!
  }
}

export interface UploadResult {
  success: boolean
  url?: string
  key?: string
  error?: string
}

/**
 * Upload an image file to Tebi S3 storage
 * @param file The image file to upload
 * @param folder Optional folder path (e.g., 'portfolio', 'cover-images')
 * @returns Promise<UploadResult> containing the upload result
 */
export async function uploadImageToTebi(
  file: File,
  folder: string = 'portfolio'
): Promise<UploadResult> {
  try {
    // Validate file
    if (!file) {
      return { success: false, error: 'No file provided' }
    }

    // Check file type (only images)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: 'Invalid file type. Only images are allowed.' }
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB in bytes
    if (file.size > maxSize) {
      return { success: false, error: 'File too large. Maximum size is 10MB.' }
    }

    // Create FormData to send to server
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)

    // Upload via server-side API
    const response = await fetch('/api/upload/s3', {
      method: 'POST',
      body: formData
    })

    const result = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Upload failed'
      }
    }

    return result

  } catch (error) {
    console.error('Error uploading to Tebi S3:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    }
  }
}

/**
 * Delete an image from Tebi S3 storage
 * @param key The S3 key of the file to delete
 * @returns Promise<UploadResult> containing the deletion result
 */
export async function deleteImageFromTebi(key: string): Promise<UploadResult> {
  // TODO: Implement server-side delete API if needed
  console.warn('deleteImageFromTebi is not yet implemented with server-side API')
  return {
    success: false,
    error: 'Delete functionality not yet implemented'
  }
}

/**
 * Upload multiple images to Tebi S3 storage
 * @param files Array of image files to upload
 * @param folder Optional folder path
 * @returns Promise<UploadResult[]> containing upload results for each file
 */
export async function uploadMultipleImagesToTebi(
  files: File[],
  folder: string = 'portfolio'
): Promise<UploadResult[]> {
  const uploadPromises = files.map(file => uploadImageToTebi(file, folder))
  return Promise.all(uploadPromises)
}

/**
 * Validate an image file before upload
 * @param file The file to validate
 * @returns Object containing validation result and error message
 */
export function validateImageFile(file: File): { isValid: boolean; error?: string } {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.' }
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024 // 10MB in bytes
  if (file.size > maxSize) {
    return { isValid: false, error: 'File too large. Maximum size is 10MB.' }
  }

  // Check minimum dimensions (optional)
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(img.src)
      if (img.width < 100 || img.height < 100) {
        resolve({ isValid: false, error: 'Image too small. Minimum dimensions are 100x100 pixels.' })
      } else {
        resolve({ isValid: true })
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(img.src)
      resolve({ isValid: false, error: 'Invalid image file.' })
    }
    img.src = URL.createObjectURL(file)
  }) as any
}

/**
 * Get a preview URL for a local file
 * @param file The file to get preview for
 * @returns Preview URL string
 */
export function getFilePreview(file: File): string {
  return URL.createObjectURL(file)
}

/**
 * Revoke a preview URL to free up memory
 * @param url The preview URL to revoke
 */
export function revokeFilePreview(url: string): void {
  URL.revokeObjectURL(url)
}