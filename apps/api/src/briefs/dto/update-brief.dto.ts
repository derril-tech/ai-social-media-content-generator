import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  ValidateNested,
  IsNumber,
  Min,
  Max,
  IsBoolean,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Tone, Platform } from '@shared/types';
import { BriefConstraintsDto, BriefMetadataDto } from './create-brief.dto';

export class UpdateBriefDto {
  @ApiPropertyOptional({
    description: 'Main topic or theme for content generation',
    example: 'AI Content Generation Benefits',
  })
  @IsOptional()
  @IsString()
  @Min(5, { message: 'Topic must be at least 5 characters long' })
  @Max(200, { message: 'Topic must not exceed 200 characters' })
  topic?: string;

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
  })
  @IsOptional()
  @IsEnum(['professional', 'casual', 'humorous', 'educational', 'promotional', 'controversial'])
  tone?: Tone;

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'string' },
    description: 'Languages for content generation',
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

  @ApiPropertyOptional({
    enum: ['draft', 'ready', 'generating', 'completed', 'failed'],
    description: 'Brief status',
  })
  @IsOptional()
  @IsEnum(['draft', 'ready', 'generating', 'completed', 'failed'])
  status?: 'draft' | 'ready' | 'generating' | 'completed' | 'failed';
}
