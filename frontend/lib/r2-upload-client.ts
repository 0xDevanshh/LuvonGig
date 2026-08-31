export interface UploadResult {
    success: boolean
    url?: string
    key?: string
    error?: string
}

/**
 * Upload an image file to Cloudflare R2 storage
 * @param file The image file to upload
 * @param folder Optional folder path (e.g., 'portfolio', 'cover-images')
 * @returns Promise<UploadResult> containing the upload result
 */
export async function uploadImageToR2(
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

        // Upload via server-side API (we reuse the same endpoint but update it globally)
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
        console.error('Error uploading to Cloudflare R2:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Upload failed'
        }
    }
}

/**
 * Delete an image from Cloudflare R2 storage
 * @param key The R2 key of the file to delete
 * @returns Promise<UploadResult> containing the deletion result
 */
export async function deleteImageFromR2(key: string): Promise<UploadResult> {
    try {
        const response = await fetch(`/api/upload/s3?key=${encodeURIComponent(key)}`, {
            method: 'DELETE'
        })

        const result = await response.json()

        if (!response.ok) {
            return {
                success: false,
                error: result.error || 'Delete failed'
            }
        }

        return result
    } catch (error) {
        console.error('Error deleting from Cloudflare R2:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Delete failed'
        }
    }
}

/**
 * Upload multiple images to Cloudflare R2 storage
 * @param files Array of image files to upload
 * @param folder Optional folder path
 * @returns Promise<UploadResult[]> containing upload results for each file
 */
export async function uploadMultipleImagesToR2(
    files: File[],
    folder: string = 'portfolio'
): Promise<UploadResult[]> {
    const uploadPromises = files.map(file => uploadImageToR2(file, folder))
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

    return { isValid: true };
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
