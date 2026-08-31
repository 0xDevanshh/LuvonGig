import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

interface S3Config {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucket: string;
}

interface UploadOptions {
  file: Buffer;
  filename: string;
  contentType: string;
  folder?: string;
}

interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

class S3Service {
  private s3: S3Client;
  private config: S3Config;

  constructor() {
    this.config = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      region: process.env.AWS_REGION || 'us-east-1',
      bucket: process.env.AWS_S3_BUCKET || '',
    };

    this.s3 = new S3Client({
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
      region: this.config.region,
    });
  }

  private validateConfig(): void {
    if (!this.config.accessKeyId || !this.config.secretAccessKey) {
      throw new Error('AWS credentials are required');
    }
    if (!this.config.bucket) {
      throw new Error('AWS S3 bucket name is required');
    }
  }

  private generateKey(filename: string, folder?: string): string {
    const timestamp = Date.now();
    const randomId = uuidv4().substring(0, 8);
    const extension = filename.split('.').pop() || '';
    const baseName = filename.replace(/\.[^/.]+$/, '');
    const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9-_]/g, '_');
    
    const key = folder 
      ? `${folder}/${timestamp}_${randomId}_${sanitizedBaseName}.${extension}`
      : `${timestamp}_${randomId}_${sanitizedBaseName}.${extension}`;
    
    return key;
  }

  async uploadFile(options: UploadOptions): Promise<UploadResult> {
    try {
      this.validateConfig();

      const key = this.generateKey(options.filename, options.folder);
      
      const uploadParams = {
        Bucket: this.config.bucket,
        Key: key,
        Body: options.file,
        ContentType: options.contentType,
        ACL: 'public-read' as const, // Make files publicly accessible
        Metadata: {
          'original-filename': options.filename,
          'upload-timestamp': new Date().toISOString(),
        },
      };

      const command = new PutObjectCommand(uploadParams);
      await this.s3.send(command);
      
      // Construct the URL manually
      const url = `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${key}`;
      
      return {
        success: true,
        url: url,
        key: key,
      };
    } catch (error) {
      console.error('S3 upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  async uploadProfileImage(file: Buffer, filename: string, userId: string): Promise<UploadResult> {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const contentType = this.getContentType(filename);
    
    if (!allowedTypes.includes(contentType)) {
      return {
        success: false,
        error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.',
      };
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.length > maxSize) {
      return {
        success: false,
        error: 'File size too large. Maximum size is 5MB.',
      };
    }

    return this.uploadFile({
      file,
      filename,
      contentType,
      folder: `profile-images/${userId}`,
    });
  }

  async uploadResume(file: Buffer, filename: string, userId: string): Promise<UploadResult> {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];
    const contentType = this.getContentType(filename);
    
    if (!allowedTypes.includes(contentType)) {
      return {
        success: false,
        error: 'Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.',
      };
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.length > maxSize) {
      return {
        success: false,
        error: 'File size too large. Maximum size is 10MB.',
      };
    }

    return this.uploadFile({
      file,
      filename,
      contentType,
      folder: `resumes/${userId}`,
    });
  }

  async deleteFile(key: string): Promise<boolean> {
    try {
      this.validateConfig();

      const deleteParams = {
        Bucket: this.config.bucket,
        Key: key,
      };

      const command = new DeleteObjectCommand(deleteParams);
      await this.s3.send(command);
      return true;
    } catch (error) {
      console.error('S3 delete error:', error);
      return false;
    }
  }

  async getFileUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      this.validateConfig();

      const command = new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      });

      const url = await getSignedUrl(this.s3, command, { expiresIn });

      return url;
    } catch (error) {
      console.error('S3 get URL error:', error);
      throw new Error('Failed to generate file URL');
    }
  }

  private getContentType(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    const mimeTypes: Record<string, string> = {
      // Images
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      
      // Documents
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'txt': 'text/plain',
    };

    return mimeTypes[extension || ''] || 'application/octet-stream';
  }

  // Helper method to extract key from URL
  extractKeyFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      return pathParts.slice(2).join('/'); // Remove bucket name from path
    } catch {
      return null;
    }
  }
}

// Singleton instance
const s3Service = new S3Service();

export default s3Service;
export { S3Service };
