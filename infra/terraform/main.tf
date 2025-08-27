# AI Social Media Content Generator - S3 Infrastructure
# Terraform configuration for S3 buckets and CloudFront distribution

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket = "ai-social-media-terraform-state"
    key    = "infrastructure.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
}

# S3 Bucket for original assets (private)
resource "aws_s3_bucket" "assets_originals" {
  bucket = "${var.project_name}-assets-originals-${var.environment}"

  tags = {
    Name        = "${var.project_name}-assets-originals"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_s3_bucket_versioning" "assets_originals" {
  bucket = aws_s3_bucket.assets_originals.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "assets_originals" {
  bucket = aws_s3_bucket.assets_originals.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "assets_originals" {
  bucket = aws_s3_bucket.assets_originals.id

  rule {
    id     = "delete_old_versions"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }

  rule {
    id     = "transition_to_ia"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }
  }

  rule {
    id     = "delete_expired_assets"
    status = "Enabled"

    expiration {
      days = 365
    }

    filter {
      tag {
        key   = "expires"
        value = "true"
      }
    }
  }
}

# S3 Bucket for processed previews (public read)
resource "aws_s3_bucket" "assets_previews" {
  bucket = "${var.project_name}-assets-previews-${var.environment}"

  tags = {
    Name        = "${var.project_name}-assets-previews"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_s3_bucket_versioning" "assets_previews" {
  bucket = aws_s3_bucket.assets_previews.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "assets_previews" {
  bucket = aws_s3_bucket.assets_previews.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "assets_previews" {
  bucket = aws_s3_bucket.assets_previews.id

  rule {
    id     = "delete_old_versions"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = 7
    }
  }

  rule {
    id     = "transition_to_ia"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }
  }
}

# Make previews bucket public
resource "aws_s3_bucket_public_access_block" "assets_previews" {
  bucket = aws_s3_bucket.assets_previews.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "assets_previews_public_read" {
  bucket = aws_s3_bucket.assets_previews.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource = [
          aws_s3_bucket.assets_previews.arn,
          "${aws_s3_bucket.assets_previews.arn}/*",
        ]
      },
    ]
  })
}

# S3 Bucket for exports (private, temporary)
resource "aws_s3_bucket" "assets_exports" {
  bucket = "${var.project_name}-assets-exports-${var.environment}"

  tags = {
    Name        = "${var.project_name}-assets-exports"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_s3_bucket_versioning" "assets_exports" {
  bucket = aws_s3_bucket.assets_exports.id
  versioning_configuration {
    status = "Suspended"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "assets_exports" {
  bucket = aws_s3_bucket.assets_exports.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "assets_exports" {
  bucket = aws_s3_bucket.assets_exports.id

  rule {
    id     = "delete_exports_after_7_days"
    status = "Enabled"

    expiration {
      days = 7
    }
  }
}

# CloudFront Origin Access Identity
resource "aws_cloudfront_origin_access_identity" "assets_previews" {
  comment = "OAI for ${var.project_name} assets previews"
}

# CloudFront Distribution for previews
resource "aws_cloudfront_distribution" "assets_previews" {
  origin {
    domain_name = aws_s3_bucket.assets_previews.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.assets_previews.id}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.assets_previews.cloudfront_access_identity_path
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "${var.project_name} Assets Previews CDN"
  default_root_object = ""

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.assets_previews.id}"

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400

    compress = true
  }

  price_class = "PriceClass_100"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name        = "${var.project_name}-assets-previews-cdn"
    Environment = var.environment
    Project     = var.project_name
  }
}

# IAM Policy for application to access S3 buckets
resource "aws_iam_policy" "s3_assets_access" {
  name        = "${var.project_name}-s3-assets-access-${var.environment}"
  description = "IAM policy for application to access S3 asset buckets"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.assets_originals.arn,
          "${aws_s3_bucket.assets_originals.arn}/*",
          aws_s3_bucket.assets_previews.arn,
          "${aws_s3_bucket.assets_previews.arn}/*",
          aws_s3_bucket.assets_exports.arn,
          "${aws_s3_bucket.assets_exports.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject"
        ]
        Resource = [
          aws_s3_bucket.assets_previews.arn,
          "${aws_s3_bucket.assets_previews.arn}/*"
        ]
      }
    ]
  })
}

# Outputs
output "assets_originals_bucket_name" {
  description = "Name of the S3 bucket for original assets"
  value       = aws_s3_bucket.assets_originals.bucket
}

output "assets_originals_bucket_arn" {
  description = "ARN of the S3 bucket for original assets"
  value       = aws_s3_bucket.assets_originals.arn
}

output "assets_previews_bucket_name" {
  description = "Name of the S3 bucket for preview assets"
  value       = aws_s3_bucket.assets_previews.bucket
}

output "assets_previews_bucket_arn" {
  description = "ARN of the S3 bucket for preview assets"
  value       = aws_s3_bucket.assets_previews.arn
}

output "assets_previews_cloudfront_url" {
  description = "CloudFront URL for preview assets"
  value       = aws_cloudfront_distribution.assets_previews.domain_name
}

output "assets_exports_bucket_name" {
  description = "Name of the S3 bucket for export assets"
  value       = aws_s3_bucket.assets_exports.bucket
}

output "assets_exports_bucket_arn" {
  description = "ARN of the S3 bucket for export assets"
  value       = aws_s3_bucket.assets_exports.arn
}

output "s3_assets_access_policy_arn" {
  description = "ARN of the IAM policy for S3 assets access"
  value       = aws_iam_policy.s3_assets_access.arn
}
