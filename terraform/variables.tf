# AWS Configuration
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (staging, production)"
  type        = string
  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "Environment must be either 'staging' or 'production'."
  }
}

# VPC Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

# Domain Configuration
variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "ai-social-media.com"
}

# Database Configuration
variable "database_name" {
  description = "Database name"
  type        = string
  default     = "ai_social_media"
}

variable "database_username" {
  description = "Database username"
  type        = string
  default     = "postgres"
}

variable "database_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "database_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "database_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 20
}

# Redis Configuration
variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.t3.micro"
}

variable "redis_num_cache_nodes" {
  description = "Number of Redis cache nodes"
  type        = number
  default     = 1
}

# NATS Configuration
variable "nats_instance_type" {
  description = "NATS instance type"
  type        = string
  default     = "t3.small"
}

# ECS Configuration
variable "api_image_uri" {
  description = "API Docker image URI"
  type        = string
}

variable "api_cpu" {
  description = "API service CPU units"
  type        = number
  default     = 256
}

variable "api_memory" {
  description = "API service memory in MiB"
  type        = number
  default     = 512
}

variable "api_desired_count" {
  description = "API service desired count"
  type        = number
  default     = 2
}

variable "frontend_image_uri" {
  description = "Frontend Docker image URI"
  type        = string
}

variable "frontend_cpu" {
  description = "Frontend service CPU units"
  type        = number
  default     = 256
}

variable "frontend_memory" {
  description = "Frontend service memory in MiB"
  type        = number
  default     = 512
}

variable "frontend_desired_count" {
  description = "Frontend service desired count"
  type        = number
  default     = 2
}

variable "workers_image_uri" {
  description = "Workers Docker image URI"
  type        = string
}

variable "workers_cpu" {
  description = "Workers service CPU units"
  type        = number
  default     = 512
}

variable "workers_memory" {
  description = "Workers service memory in MiB"
  type        = number
  default     = 1024
}

variable "workers_desired_count" {
  description = "Workers service desired count"
  type        = number
  default     = 3
}

# Auto Scaling Configuration
variable "min_capacity" {
  description = "Minimum capacity for auto scaling"
  type        = number
  default     = 2
}

variable "max_capacity" {
  description = "Maximum capacity for auto scaling"
  type        = number
  default     = 10
}

variable "target_cpu_utilization" {
  description = "Target CPU utilization for auto scaling"
  type        = number
  default     = 70
}

# Security Configuration
variable "jwt_secret" {
  description = "JWT secret key"
  type        = string
  sensitive   = true
}

variable "api_keys" {
  description = "API keys for external services"
  type        = map(string)
  sensitive   = true
  default     = {}
}

# Monitoring Configuration
variable "enable_cloudwatch_alarms" {
  description = "Enable CloudWatch alarms"
  type        = bool
  default     = true
}

variable "enable_xray_tracing" {
  description = "Enable X-Ray tracing"
  type        = bool
  default     = true
}

# Backup Configuration
variable "backup_retention_days" {
  description = "Backup retention period in days"
  type        = number
  default     = 30
}

variable "enable_point_in_time_recovery" {
  description = "Enable point-in-time recovery for RDS"
  type        = bool
  default     = true
}

# SSL/TLS Configuration
variable "certificate_arn" {
  description = "SSL certificate ARN"
  type        = string
  default     = ""
}

# Tags
variable "tags" {
  description = "Additional tags for resources"
  type        = map(string)
  default     = {}
}

# Feature Flags
variable "enable_waf" {
  description = "Enable WAF protection"
  type        = bool
  default     = true
}

variable "enable_cdn" {
  description = "Enable CloudFront CDN"
  type        = bool
  default     = true
}

variable "enable_auto_scaling" {
  description = "Enable auto scaling"
  type        = bool
  default     = true
}

# Cost Optimization
variable "enable_spot_instances" {
  description = "Enable spot instances for cost optimization"
  type        = bool
  default     = false
}

variable "enable_savings_plans" {
  description = "Enable AWS Savings Plans"
  type        = bool
  default     = false
}

# Performance Configuration
variable "enable_connection_pooling" {
  description = "Enable RDS connection pooling"
  type        = bool
  default     = true
}

variable "enable_read_replicas" {
  description = "Enable RDS read replicas"
  type        = bool
  default     = false
}

# Disaster Recovery
variable "enable_multi_az" {
  description = "Enable multi-AZ deployment"
  type        = bool
  default     = true
}

variable "enable_cross_region_backup" {
  description = "Enable cross-region backup"
  type        = bool
  default     = false
}

variable "backup_region" {
  description = "Backup region for cross-region backup"
  type        = string
  default     = "us-west-2"
}

# Compliance and Security
variable "enable_encryption_at_rest" {
  description = "Enable encryption at rest"
  type        = bool
  default     = true
}

variable "enable_encryption_in_transit" {
  description = "Enable encryption in transit"
  type        = bool
  default     = true
}

variable "enable_vpc_flow_logs" {
  description = "Enable VPC flow logs"
  type        = bool
  default     = true
}

variable "enable_cloudtrail" {
  description = "Enable CloudTrail logging"
  type        = bool
  default     = true
}

# Development and Testing
variable "enable_dev_tools" {
  description = "Enable development tools (staging only)"
  type        = bool
  default     = false
}

variable "enable_debug_logging" {
  description = "Enable debug logging"
  type        = bool
  default     = false
}

# External Services
variable "sentry_dsn" {
  description = "Sentry DSN for error tracking"
  type        = string
  default     = ""
}

variable "slack_webhook_url" {
  description = "Slack webhook URL for notifications"
  type        = string
  default     = ""
}

variable "pagerduty_api_key" {
  description = "PagerDuty API key"
  type        = string
  default     = ""
}

# AI/ML Configuration
variable "openai_api_key" {
  description = "OpenAI API key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "anthropic_api_key" {
  description = "Anthropic API key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "google_ai_api_key" {
  description = "Google AI API key"
  type        = string
  sensitive   = true
  default     = ""
}

# Social Media API Keys
variable "twitter_api_key" {
  description = "Twitter API key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "linkedin_api_key" {
  description = "LinkedIn API key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "facebook_api_key" {
  description = "Facebook API key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "instagram_api_key" {
  description = "Instagram API key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "youtube_api_key" {
  description = "YouTube API key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "tiktok_api_key" {
  description = "TikTok API key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "pinterest_api_key" {
  description = "Pinterest API key"
  type        = string
  sensitive   = true
  default     = ""
}

# Third-party Service Keys
variable "bitly_api_key" {
  description = "Bitly API key for link shortening"
  type        = string
  sensitive   = true
  default     = ""
}

variable "cloudinary_api_key" {
  description = "Cloudinary API key for image processing"
  type        = string
  sensitive   = true
  default     = ""
}

variable "stripe_api_key" {
  description = "Stripe API key for payments"
  type        = string
  sensitive   = true
  default     = ""
}

variable "sendgrid_api_key" {
  description = "SendGrid API key for email"
  type        = string
  sensitive   = true
  default     = ""
}

# Monitoring and Analytics
variable "datadog_api_key" {
  description = "Datadog API key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "newrelic_license_key" {
  description = "New Relic license key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "mixpanel_token" {
  description = "Mixpanel token for analytics"
  type        = string
  sensitive   = true
  default     = ""
}

# Development and Testing
variable "test_mode" {
  description = "Enable test mode"
  type        = bool
  default     = false
}

variable "mock_external_apis" {
  description = "Mock external APIs for testing"
  type        = bool
  default     = false
}

variable "enable_rate_limiting" {
  description = "Enable rate limiting"
  type        = bool
  default     = true
}

variable "rate_limit_requests_per_minute" {
  description = "Rate limit requests per minute"
  type        = number
  default     = 1000
}
