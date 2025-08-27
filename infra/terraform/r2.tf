# Cloudflare R2 Configuration (Alternative to S3)
# This file contains R2 bucket configurations for Cloudflare R2

terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

# Note: Cloudflare R2 buckets are created through the Cloudflare dashboard
# or API. This file documents the required R2 bucket structure.

# R2 Bucket: ai-social-media-assets-originals-{environment}
# - Private bucket for original uploaded assets
# - Should have CORS configured for the application domain
# - Lifecycle: Delete objects after 365 days
# - Encryption: Enabled at bucket level

# R2 Bucket: ai-social-media-assets-previews-{environment}
# - Public bucket for processed preview images/thumbnails
# - Should have public read access
# - CORS configured for web access
# - Lifecycle: Delete objects after 30 days
# - Custom domain: previews.yourdomain.com (via Cloudflare Pages/Custom Domain)

# R2 Bucket: ai-social-media-assets-exports-{environment}
# - Private bucket for temporary exports (CSV, PDF, etc.)
# - Should be cleaned up regularly
# - Lifecycle: Delete objects after 7 days
# - CORS configured for application access

# Example R2 bucket configuration using Cloudflare API
# (This would typically be done via Cloudflare dashboard or API calls)

# CORS Configuration for previews bucket
resource "cloudflare_record" "previews_custom_domain" {
  count = var.enable_r2_custom_domain ? 1 : 0

  zone_id = var.cloudflare_zone_id
  name    = "previews"
  value   = var.r2_custom_domain
  type    = "CNAME"
  ttl     = 1
  proxied = true
}

# Worker script for R2 access control (example)
resource "cloudflare_worker_script" "r2_access_control" {
  count = var.enable_r2_workers ? 1 : 0

  name    = "${var.project_name}-r2-access-${var.environment}"
  content = file("${path.module}/workers/r2-access.js")

  plain_text_binding {
    name = "ALLOWED_ORIGINS"
    text = jsonencode(var.cors_allowed_origins)
  }
}

# Example Worker script for R2 access control
# File: infra/terraform/workers/r2-access.js
/*
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  }

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Add CORS headers to all responses
  const response = await fetch(request)
  const newResponse = new Response(response.body, response)
  Object.keys(corsHeaders).forEach(key => {
    newResponse.headers.set(key, corsHeaders[key])
  })

  return newResponse
}
*/

# Variables for R2 configuration
variable "enable_r2_custom_domain" {
  description = "Whether to configure custom domain for R2 previews"
  type        = bool
  default     = false
}

variable "enable_r2_workers" {
  description = "Whether to deploy Cloudflare Workers for R2 access control"
  type        = bool
  default     = false
}

variable "cloudflare_zone_id" {
  description = "Cloudflare zone ID for custom domain configuration"
  type        = string
  default     = ""
}

variable "r2_custom_domain" {
  description = "Custom domain for R2 previews bucket"
  type        = string
  default     = ""
}

variable "cloudflare_api_token" {
  description = "Cloudflare API token for R2 management"
  type        = string
  sensitive   = true
  default     = ""
}
