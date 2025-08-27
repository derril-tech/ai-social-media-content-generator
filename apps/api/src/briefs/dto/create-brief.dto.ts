import {
  IsString,
  IsOptional,
  IsUUID,
  IsArray,
  IsEnum,
  ValidateNested,
  IsNumber,
  Min,
  Max,
  IsBoolean,
  ArrayMinSize,
  ArrayMaxSize,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Tone, Platform } from '@shared/types';

export class BriefConstraintsDto {
  @ApiPropertyOptional({
    type: 'number',
    minimum: 10,
    maximum: 10000,
    description: 'Maximum content length in characters',
  })
  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(10000)
  maxLength?: number;

  @ApiPropertyOptional({
    type: 'number',
    minimum: 10,
    maximum: 5000,
    description: 'Minimum content length in characters',
  })
  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(5000)
  minLength?: number;

  @ApiPropertyOptional({
    description: 'Whether to include hashtags in the content',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  includeHashtags?: boolean;

  @ApiPropertyOptional({
    type: 'number',
    minimum: 0,
    maximum: 10,
    description: 'Number of hashtags to include',
    default: 3,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  hashtagCount?: number;

  @ApiPropertyOptional({
    description: 'Whether to include call-to-action phrases',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  includeCallToAction?: boolean;

  @ApiPropertyOptional({
    description: 'Whether to include emojis in the content',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  includeEmojis?: boolean;

  @ApiPropertyOptional({
    type: 'number',
    minimum: 0,
    maximum: 1,
    description: 'How strongly to enforce the specified tone (0-1)',
    default: 0.7,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  toneStrength?: number;

  @ApiPropertyOptional({
    type: 'number',
    minimum: 0,
    maximum: 1,
    description: 'Formality level (0=casual, 1=very formal)',
    default: 0.6,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  formalityLevel?: number;

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'string' },
    description: 'Words or phrases that must not appear in the content',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  bannedWords?: string[];

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'string' },
    description: 'Words or phrases that must appear in the content',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredWords?: string[];

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'string' },
    description: 'Topics to exclude from the content',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludedTopics?: string[];
}

export class BriefMetadataDto {
  @ApiPropertyOptional({
    enum: ['post', 'thread', 'carousel', 'story', 'reel', 'video'],
    description: 'Type of content to generate',
    default: 'post',
  })
  @IsOptional()
  @IsEnum(['post', 'thread', 'carousel', 'story', 'reel', 'video'])
  contentType?: 'post' | 'thread' | 'carousel' | 'story' | 'reel' | 'video';

  @ApiPropertyOptional({
    enum: ['low', 'medium', 'high', 'urgent'],
    description: 'Priority level for content generation',
    default: 'medium',
  })
  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'urgent'])
  priority?: 'low' | 'medium' | 'high' | 'urgent';

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'string' },
    description: 'Tags for organizing and categorizing the brief',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Internal notes about this brief',
  })
  @IsOptional()
  @IsString()
  internalNotes?: string;
}

export class CreateBriefDto {
  @ApiProperty({
    description: 'Campaign ID for this brief',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  campaignId: string;

  @ApiProperty({
    description: 'Main topic or theme for content generation',
    example: 'AI Content Generation Benefits',
  })
  @IsString()
  @Min(5, { message: 'Topic must be at least 5 characters long' })
  @Max(200, { message: 'Topic must not exceed 200 characters' })
  topic: string;

  @ApiPropertyOptional({
    description: 'Target audience description',
    example: 'B2B SaaS companies and marketing professionals',
  })
  @IsOptional()
  @IsString()
  @Max(500, { message: 'Audience description must not exceed 500 characters' })
  audience?: string;

  @ApiPropertyOptional({
    enum: ['professional', 'casual', 'humorous', 'educational', 'promotional', 'controversial'],
    description: 'Desired tone for the content',
    default: 'professional',
  })
  @IsOptional()
  @IsEnum(['professional', 'casual', 'humorous', 'educational', 'promotional', 'controversial'])
  tone?: Tone;

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'string' },
    description: 'Languages for content generation',
    default: ['en'],
    example: ['en', 'es', 'fr'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  languages?: string[];

  @ApiPropertyOptional({
    type: 'array',
    items: {
      type: 'string',
      enum: ['twitter', 'linkedin', 'instagram', 'facebook', 'tiktok', 'youtube', 'threads', 'pinterest']
    },
    description: 'Target platforms for content generation',
    example: ['linkedin', 'twitter'],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(['twitter', 'linkedin', 'instagram', 'facebook', 'tiktok', 'youtube', 'threads', 'pinterest'], { each: true })
  platforms?: Platform[];

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'string' },
    description: 'Target regions or locations',
    example: ['US', 'EU', 'Asia'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(50)
  regions?: string[];

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'string' },
    description: 'Competitor brands or companies to analyze',
    example: ['Jasper', 'Copy.ai', 'Writesonic'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  competitors?: string[];

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'string' },
    description: 'Additional constraints or requirements',
    example: ['Include statistics', 'Add customer testimonial'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  constraints?: string[];

  @ApiPropertyOptional({
    type: BriefConstraintsDto,
    description: 'Detailed content constraints and parameters',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => BriefConstraintsDto)
  detailedConstraints?: BriefConstraintsDto;

  @ApiPropertyOptional({
    type: BriefMetadataDto,
    description: 'Additional metadata for the brief',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => BriefMetadataDto)
  metadata?: BriefMetadataDto;
}
