import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class AssetsService {
  private s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }

  async generateUploadUrl(filename: string, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET || 'ai-social-assets',
      Key: `uploads/${filename}`,
      ContentType: contentType,
    });
    
    return getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
  }

  async getAssetMetadata(assetId: string) {
    // TODO: Query asset metadata from database
    return {
      id: assetId,
      filename: 'example.jpg',
      size: 1024000,
      contentType: 'image/jpeg',
      uploadedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    };
  }

  async generatePreviewUrl(assetId: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET || 'ai-social-assets',
      Key: `previews/${assetId}.jpg`,
    });
    
    return getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
  }
}
