import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsNumber,
  Min,
  Max,
  IsEnum,
  ValidateNested,
  IsArray,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CampaignSettings } from '../entities/campaign.entity';

export class CampaignSettingsDto implements CampaignSettings {
  @ApiPropertyOptional({
    description: 'Whether to automatically generate content for this campaign',
    default: false,
  })
  @IsOptional()
  autoGenerate?: boolean;

  @ApiPropertyOptional({
    enum: ['daily', 'weekly', 'monthly'],
    description: 'How often to generate content automatically',
  })
  @IsOptional()
  @IsEnum(['daily', 'weekly', 'monthly'])
  generateFrequency?: 'daily' | 'weekly' | 'monthly';

  @ApiPropertyOptional({
    type: 'number',
    minimum: 1,
    maximum: 50,
    description: 'Maximum number of posts to generate per day',
    default: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  maxPostsPerDay?: number;

  @ApiPropertyOptional({
    description: 'Whether posts require approval before publishing',
    default: true,
  })
  @IsOptional()
  approvalRequired?: boolean;

  @ApiPropertyOptional({
    description: 'Whether to automatically publish approved content',
    default: false,
  })
  @IsOptional()
  autoPublish?: boolean;

  @ApiPropertyOptional({
    type: 'object',
    description: 'Target audience specifications',
  })
  @IsOptional()
  @IsObject()
  targetAudience?: {
    ageRange?: [number, number];
    interests?: string[];
    locations?: string[];
    languages?: string[];
  };

  @ApiPropertyOptional({
    type: 'array',
    description: 'Campaign goals and targets',
  })
  @IsOptional()
  @IsArray()
  goals?: {
    type: 'engagement' | 'leads' | 'sales' | 'awareness' | 'traffic';
    targetValue?: number;
    metric?: string;
  }[];
}

export class CreateCampaignDto {
  @ApiProperty({
    description: 'Campaign name',
    example: 'Q1 Product Launch Campaign',
  })
  @IsString()
  @Min(3, { message: 'Campaign name must be at least 3 characters long' })
  @Max(100, { message: 'Campaign name must not exceed 100 characters' })
  name: string;

  @ApiPropertyOptional({
    description: 'Campaign description',
    example: 'Launch campaign for our new AI-powered content generator',
  })
  @IsOptional()
  @IsString()
  @Max(500, { message: 'Description must not exceed 500 characters' })
  description?: string;

  @ApiProperty({
    description: 'Brand ID for this campaign',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  brandId: string;

  @ApiPropertyOptional({
    description: 'Organization ID (optional - will use current user organization)',
  })
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @ApiPropertyOptional({
    type: CampaignSettingsDto,
    description: 'Campaign settings and configuration',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CampaignSettingsDto)
  settings?: CampaignSettingsDto;

  @ApiPropertyOptional({
    enum: ['active', 'paused', 'completed', 'draft'],
    description: 'Campaign status',
    default: 'draft',
  })
  @IsOptional()
  @IsEnum(['active', 'paused', 'completed', 'draft'])
  status?: 'active' | 'paused' | 'completed' | 'draft';

  @ApiPropertyOptional({
    description: 'Campaign start date',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Campaign end date',
    example: '2024-03-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    type: 'number',
    description: 'Campaign budget',
    default: 0,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  budget?: number;

  @ApiPropertyOptional({
    description: 'Budget currency code',
    example: 'USD',
    default: 'USD',
  })
  @IsOptional()
  @IsString()
  currency?: string;
}
