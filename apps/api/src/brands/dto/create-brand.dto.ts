import {
  IsString,
  IsArray,
  IsOptional,
  ArrayMinSize,
  ArrayMaxSize,
  MinLength,
  MaxLength,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBrandDto {
  @ApiProperty({
    example: 'Acme Corporation',
    description: 'Brand name',
  })
  @IsString()
  @MinLength(2, { message: 'Brand name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Brand name must not exceed 100 characters' })
  name: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Organization ID (optional - will use current user organization)',
  })
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @ApiPropertyOptional({
    example: ['#3B82F6', '#1E40AF', '#FFFFFF'],
    description: 'Brand colors as hex codes',
    default: [],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(0)
  @ArrayMaxSize(10)
  colors?: string[];

  @ApiPropertyOptional({
    example: ['Inter', 'Arial', 'Helvetica'],
    description: 'Brand fonts',
    default: [],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(0)
  @ArrayMaxSize(10)
  fonts?: string[];

  @ApiPropertyOptional({
    example: 'Professional and modern tone. Use clear, concise language. Focus on innovation and customer success.',
    description: 'Brand guidelines and voice description',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Guidelines must not exceed 2000 characters' })
  guidelines?: string;
}
