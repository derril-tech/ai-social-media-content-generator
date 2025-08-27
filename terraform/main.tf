terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket = "ai-social-media-terraform-state"
    key    = "terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "ai-social-media-content-generator"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# VPC and Networking
module "vpc" {
  source = "./modules/vpc"
  
  environment = var.environment
  vpc_cidr    = var.vpc_cidr
  azs         = var.availability_zones
}

# RDS Database
module "database" {
  source = "./modules/database"
  
  environment     = var.environment
  vpc_id          = module.vpc.vpc_id
  private_subnets = module.vpc.private_subnets
  db_name         = var.database_name
  db_username     = var.database_username
  db_password     = var.database_password
  instance_class  = var.database_instance_class
  allocated_storage = var.database_allocated_storage
}

# ElastiCache Redis
module "redis" {
  source = "./modules/redis"
  
  environment     = var.environment
  vpc_id          = module.vpc.vpc_id
  private_subnets = module.vpc.private_subnets
  node_type       = var.redis_node_type
  num_cache_nodes = var.redis_num_cache_nodes
}

# NATS Streaming Server
module "nats" {
  source = "./modules/nats"
  
  environment     = var.environment
  vpc_id          = module.vpc.vpc_id
  private_subnets = module.vpc.private_subnets
  instance_type   = var.nats_instance_type
}

# S3 Buckets
module "storage" {
  source = "./modules/storage"
  
  environment = var.environment
  bucket_names = {
    assets      = "${var.environment}-ai-social-media-assets"
    originals   = "${var.environment}-ai-social-media-originals"
    previews    = "${var.environment}-ai-social-media-previews"
    exports     = "${var.environment}-ai-social-media-exports"
    backups     = "${var.environment}-ai-social-media-backups"
  }
}

# ECS Cluster and Services
module "ecs" {
  source = "./modules/ecs"
  
  environment     = var.environment
  vpc_id          = module.vpc.vpc_id
  public_subnets  = module.vpc.public_subnets
  private_subnets = module.vpc.private_subnets
  
  # API Service
  api_image_uri = var.api_image_uri
  api_cpu       = var.api_cpu
  api_memory    = var.api_memory
  api_desired_count = var.api_desired_count
  
  # Frontend Service
  frontend_image_uri = var.frontend_image_uri
  frontend_cpu       = var.frontend_cpu
  frontend_memory    = var.frontend_memory
  frontend_desired_count = var.frontend_desired_count
  
  # Workers Service
  workers_image_uri = var.workers_image_uri
  workers_cpu       = var.workers_cpu
  workers_memory    = var.workers_memory
  workers_desired_count = var.workers_desired_count
  
  # Environment variables
  database_url = module.database.connection_string
  redis_url    = module.redis.connection_string
  nats_url     = module.nats.connection_string
}

# Application Load Balancer
module "alb" {
  source = "./modules/alb"
  
  environment     = var.environment
  vpc_id          = module.vpc.vpc_id
  public_subnets  = module.vpc.public_subnets
  api_target_group_arn = module.ecs.api_target_group_arn
  frontend_target_group_arn = module.ecs.frontend_target_group_arn
}

# CloudWatch Logs
module "monitoring" {
  source = "./modules/monitoring"
  
  environment = var.environment
  log_groups = [
    "/aws/ecs/api-${var.environment}",
    "/aws/ecs/frontend-${var.environment}",
    "/aws/ecs/workers-${var.environment}",
    "/aws/rds/instance/${var.environment}-database",
    "/aws/elasticache/${var.environment}-redis",
  ]
}

# Secrets Manager
module "secrets" {
  source = "./modules/secrets"
  
  environment = var.environment
  secrets = {
    database_password = var.database_password
    jwt_secret        = var.jwt_secret
    api_keys          = jsonencode(var.api_keys)
  }
}

# Route53 DNS
module "dns" {
  source = "./modules/dns"
  
  environment = var.environment
  domain_name = var.domain_name
  alb_dns_name = module.alb.alb_dns_name
  alb_zone_id  = module.alb.alb_zone_id
}

# CloudFront CDN
module "cdn" {
  source = "./modules/cdn"
  
  environment = var.environment
  domain_name = var.domain_name
  s3_bucket_domain_name = module.storage.assets_bucket_domain_name
  origin_access_identity = module.storage.origin_access_identity
}

# WAF Web Application Firewall
module "waf" {
  source = "./modules/waf"
  
  environment = var.environment
  alb_arn = module.alb.alb_arn
}

# Auto Scaling
module "autoscaling" {
  source = "./modules/autoscaling"
  
  environment = var.environment
  api_cluster_name = module.ecs.api_cluster_name
  api_service_name = module.ecs.api_service_name
  api_target_group_arn = module.ecs.api_target_group_arn
  
  min_capacity = var.min_capacity
  max_capacity = var.max_capacity
  target_cpu_utilization = var.target_cpu_utilization
}

# Backup and Disaster Recovery
module "backup" {
  source = "./modules/backup"
  
  environment = var.environment
  rds_instance_id = module.database.instance_id
  s3_bucket_arn = module.storage.backups_bucket_arn
}

# Outputs
output "alb_dns_name" {
  description = "The DNS name of the load balancer"
  value       = module.alb.alb_dns_name
}

output "api_endpoint" {
  description = "The API endpoint URL"
  value       = "https://api.${var.domain_name}"
}

output "frontend_endpoint" {
  description = "The frontend endpoint URL"
  value       = "https://${var.domain_name}"
}

output "database_endpoint" {
  description = "The RDS database endpoint"
  value       = module.database.endpoint
  sensitive   = true
}

output "redis_endpoint" {
  description = "The ElastiCache Redis endpoint"
  value       = module.redis.endpoint
  sensitive   = true
}

output "nats_endpoint" {
  description = "The NATS streaming server endpoint"
  value       = module.nats.endpoint
  sensitive   = true
}

output "s3_buckets" {
  description = "The S3 bucket names"
  value = {
    assets    = module.storage.assets_bucket_name
    originals = module.storage.originals_bucket_name
    previews  = module.storage.previews_bucket_name
    exports   = module.storage.exports_bucket_name
    backups   = module.storage.backups_bucket_name
  }
}
