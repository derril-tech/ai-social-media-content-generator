import {
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  Min,
  Max,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CampaignSettingsDto } from './create-campaign.dto';

export class UpdateCampaignDto {
  @ApiPropertyOptional({
    description: 'Campaign name',
    example: 'Q1 Product Launch Campaign',
  })
  @IsOptional()
  @IsString()
  @Min(3, { message: 'Campaign name must be at least 3 characters long' })
  @Max(100, { message: 'Campaign name must not exceed 100 characters' })
  name?: string;

  @ApiPropertyOptional({
    description: 'Campaign description',
    example: 'Launch campaign for our new AI-powered content generator',
  })
  @IsOptional()
  @IsString()
  @Max(500, { message: 'Description must not exceed 500 characters' })
  description?: string;

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
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  budget?: number;

  @ApiPropertyOptional({
    description: 'Budget currency code',
    example: 'USD',
  })
  @IsOptional()
  @IsString()
  currency?: string;
}
