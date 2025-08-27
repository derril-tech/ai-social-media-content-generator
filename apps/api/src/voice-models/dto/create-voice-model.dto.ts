import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  Max,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Tone } from '@shared/types';

export class VoiceConstraintsDto {
  @ApiProperty({
    enum: ['professional', 'casual', 'humorous', 'educational', 'promotional', 'controversial'],
    description: 'Primary tone of the voice model',
  })
  tone: Tone;

  @ApiPropertyOptional({
    type: 'object',
    properties: {
      min: { type: 'number', minimum: 1, maximum: 50 },
      max: { type: 'number', minimum: 10, maximum: 500 },
    },
    description: 'Sentence length constraints',
    default: { min: 10, max: 150 },
  })
  @IsOptional()
  sentenceLength?: {
    min: number;
    max: number;
  };

  @ApiPropertyOptional({
    type: 'number',
    minimum: 0,
    maximum: 1,
    description: 'Emoji usage threshold (0-1)',
    default: 0.3,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  emojiThreshold?: number;

  @ApiPropertyOptional({
    type: 'number',
    minimum: 0,
    maximum: 1,
    description: 'Jargon/technical terms threshold (0-1)',
    default: 0.4,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  jargonThreshold?: number;

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
    type: 'number',
    minimum: 0,
    maximum: 1,
    description: 'Humor level (0=serious, 1=very humorous)',
    default: 0.2,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  humorLevel?: number;

  @ApiPropertyOptional({
    type: 'number',
    minimum: 0,
    maximum: 1,
    description: 'Technical complexity level (0=simple, 1=very technical)',
    default: 0.5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  technicalLevel?: number;

  @ApiPropertyOptional({
    type: 'number',
    minimum: 0,
    maximum: 1,
    description: 'Promotional tone level (0=neutral, 1=very promotional)',
    default: 0.3,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  promotionalTone?: number;
}

export class TrainingExampleDto {
  @ApiProperty({
    description: 'Sample content for training',
  })
  @IsString()
  content: string;

  @ApiPropertyOptional({
    description: 'Source of the training example',
  })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({
    type: 'number',
    minimum: 1,
    maximum: 10,
    description: 'Quality rating of the example (1-10)',
    default: 7,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  quality?: number;

  @ApiPropertyOptional({
    type: 'object',
    description: 'Additional metadata for the training example',
  })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class CreateVoiceModelDto {
  @ApiProperty({
    description: 'Brand ID for which to create the voice model',
  })
  @IsUUID()
  brandId: string;

  @ApiPropertyOptional({
    type: VoiceConstraintsDto,
    description: 'Voice constraints and parameters',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => VoiceConstraintsDto)
  constraints?: VoiceConstraintsDto;

  @ApiPropertyOptional({
    type: [TrainingExampleDto],
    description: 'Training examples for the voice model',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TrainingExampleDto)
  trainingExamples?: TrainingExampleDto[];
}
