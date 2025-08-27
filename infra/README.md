# Infrastructure Setup

This directory contains infrastructure-as-code configurations for deploying the AI Social Media Content Generator.

## S3/R2 Bucket Structure

The application uses three types of storage buckets:

### 1. Assets Originals (`assets-originals`)
- **Purpose**: Store original uploaded assets (images, videos, documents)
- **Access**: Private - only accessible by the application
- **Lifecycle**: 365 days retention, then deletion
- **Encryption**: Server-side encryption enabled
- **Versioning**: Enabled

### 2. Assets Previews (`assets-previews`)
- **Purpose**: Store processed preview images and thumbnails
- **Access**: Public read access via CloudFront CDN
- **Lifecycle**: 30 days retention, then transition to IA storage class
- **Encryption**: Server-side encryption enabled
- **Versioning**: Enabled
- **CDN**: CloudFront distribution for fast global access

### 3. Assets Exports (`assets-exports`)
- **Purpose**: Temporary storage for generated exports (CSV, PDF, JSON)
- **Access**: Private - only accessible by the application
- **Lifecycle**: 7 days retention, then automatic deletion
- **Encryption**: Server-side encryption enabled
- **Versioning**: Disabled (not needed for temporary files)

## Deployment Options

### Option 1: Terraform (AWS S3)

1. **Prerequisites**:
   - AWS CLI configured with appropriate permissions
   - Terraform v1.0+ installed

2. **Initialize Terraform**:
   ```bash
   cd infra/terraform
   terraform init
   ```

3. **Configure variables**:
   Edit `terraform.tfvars` or use command line flags:
   ```bash
   terraform plan -var="environment=dev" -var="aws_region=us-east-1"
   ```

4. **Deploy**:
   ```bash
   terraform apply
   ```

### Option 2: CloudFormation (AWS S3)

1. **Prerequisites**:
   - AWS CLI configured with appropriate permissions

2. **Deploy CloudFormation stack**:
   ```bash
   aws cloudformation deploy \
     --template-file infra/cloudformation/s3-buckets.yaml \
     --stack-name ai-social-media-assets-dev \
     --parameter-overrides Environment=dev ProjectName=ai-social-media
   ```

### Option 3: Cloudflare R2

1. **Create buckets via Cloudflare dashboard**:
   - Go to R2 section in Cloudflare dashboard
   - Create three buckets:
     - `ai-social-media-assets-originals-dev`
     - `ai-social-media-assets-previews-dev`
     - `ai-social-media-assets-exports-dev`

2. **Configure CORS for previews bucket**:
   ```json
   {
     "cors": [
       {
         "allowedOrigins": ["*"],
         "allowedMethods": ["GET", "PUT", "POST", "DELETE"],
         "allowedHeaders": ["*"],
         "maxAgeSeconds": 3600
       }
     ]
   }
   ```

3. **Set up custom domain (optional)**:
   - Configure custom domain for previews bucket
   - Set up Cloudflare Worker for access control if needed

## Environment Variables

After deploying the infrastructure, configure these environment variables in your application:

```bash
# AWS S3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET_ORIGINALS=ai-social-media-assets-originals-dev
AWS_S3_BUCKET_PREVIEWS=ai-social-media-assets-previews-dev
AWS_S3_BUCKET_EXPORTS=ai-social-media-assets-exports-dev
AWS_S3_PUBLIC_URL=https://your-cloudfront-domain.cloudfront.net

# Cloudflare R2 (alternative)
CLOUDFLARE_R2_ACCESS_KEY=your-r2-access-key
CLOUDFLARE_R2_SECRET_KEY=your-r2-secret-key
CLOUDFLARE_R2_ORIGINALS_BUCKET=ai-social-media-assets-originals-dev
CLOUDFLARE_R2_PREVIEWS_BUCKET=ai-social-media-assets-previews-dev
CLOUDFLARE_R2_EXPORTS_BUCKET=ai-social-media-assets-exports-dev
```

## Security Considerations

1. **Private Buckets**: Originals and exports buckets should remain private
2. **Public Access**: Only previews bucket needs public read access
3. **Encryption**: All buckets have server-side encryption enabled
4. **Versioning**: Enabled on permanent buckets for recovery
5. **Lifecycle Policies**: Automatic cleanup prevents storage bloat
6. **CORS**: Properly configured for web application access

## Monitoring and Maintenance

1. **Monitor storage usage**: Set up CloudWatch alarms for bucket sizes
2. **Review lifecycle policies**: Adjust retention periods as needed
3. **Backup strategy**: Consider cross-region replication for critical assets
4. **Cost optimization**: Use appropriate storage classes and lifecycle policies

## Troubleshooting

### Common Issues:

1. **Access Denied**: Check IAM permissions and bucket policies
2. **CORS Errors**: Verify CORS configuration on buckets
3. **CloudFront Issues**: Check origin access identity configuration
4. **SSL/TLS Errors**: Ensure proper certificate configuration

### Useful Commands:

```bash
# List bucket contents
aws s3 ls s3://bucket-name/

# Test bucket access
aws s3 cp test-file.txt s3://bucket-name/test-file.txt

# Check bucket policy
aws s3api get-bucket-policy --bucket bucket-name

# View CloudFront distribution
aws cloudfront list-distributions
```
