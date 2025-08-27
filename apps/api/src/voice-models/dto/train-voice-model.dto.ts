import {
  IsOptional,
  IsArray,
  ValidateNested,
  IsBoolean,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TrainingExampleDto } from './create-voice-model.dto';

export class TrainVoiceModelDto {
  @ApiPropertyOptional({
    type: [TrainingExampleDto],
    description: 'Additional training examples to include',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TrainingExampleDto)
  additionalExamples?: TrainingExampleDto[];

  @ApiPropertyOptional({
    type: 'boolean',
    description: 'Whether to use existing brand content for training',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  useExistingContent?: boolean;

  @ApiPropertyOptional({
    type: 'number',
    minimum: 1,
    maximum: 100,
    description: 'Maximum number of epochs for training',
    default: 50,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  maxEpochs?: number;

  @ApiPropertyOptional({
    type: 'number',
    minimum: 0.0001,
    maximum: 0.1,
    description: 'Learning rate for training',
    default: 0.001,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.0001)
  @Max(0.1)
  learningRate?: number;

  @ApiPropertyOptional({
    type: 'boolean',
    description: 'Whether to fine-tune existing model or train from scratch',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  fineTune?: boolean;
}
