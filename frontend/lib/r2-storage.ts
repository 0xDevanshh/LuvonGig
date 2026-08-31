import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
} from '@aws-sdk/client-s3';

const {
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    R2_ENDPOINT,
    R2_BUCKET_NAME,
    R2_PUBLIC_DOMAIN,
} = process.env;

// Initialize S3 client for R2
const getS3Client = () => {
    if (
        !R2_ACCESS_KEY_ID ||
        !R2_SECRET_ACCESS_KEY ||
        !R2_ENDPOINT ||
        !R2_BUCKET_NAME
    ) {
        console.error('Missing R2 environment variables:', {
            accessKeyId: !!R2_ACCESS_KEY_ID,
            secretAccessKey: !!R2_SECRET_ACCESS_KEY,
            endpoint: !!R2_ENDPOINT,
            bucket: !!R2_BUCKET_NAME
        });
        throw new Error('Missing R2 environment variables');
    }

    return new S3Client({
        region: 'auto',
        endpoint: R2_ENDPOINT,
        forcePathStyle: true, // ✅ REQUIRED for Cloudflare R2
        credentials: {
            accessKeyId: R2_ACCESS_KEY_ID,
            secretAccessKey: R2_SECRET_ACCESS_KEY,
        },
    });
};

export async function uploadFile(
    file: Buffer,
    fileName: string,
    contentType: string
): Promise<string> {
    const s3Client = getS3Client();

    await s3Client.send(
        new PutObjectCommand({
            Bucket: R2_BUCKET_NAME!,
            Key: fileName,
            Body: file,
            ContentType: contentType,
            // R2 doesn't support ACL public-read in the same way as S3, 
            // the bucket usually needs to be public or accessed via public domain
        })
    );

    if (!R2_PUBLIC_DOMAIN) {
        throw new Error('R2_PUBLIC_DOMAIN is not defined');
    }

    // Ensure public domain doesn't have trailing slash and fileName doesn't have leading slash
    const domain = R2_PUBLIC_DOMAIN.replace(/\/$/, '');
    const key = fileName.replace(/^\//, '');

    return `${domain}/${key}`;
}

export async function deleteFile(fileName: string): Promise<void> {
    const s3Client = getS3Client();

    await s3Client.send(
        new DeleteObjectCommand({
            Bucket: R2_BUCKET_NAME!,
            Key: fileName,
        })
    );
}
