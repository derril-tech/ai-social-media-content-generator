import { IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@shared/types';

export class CreateMembershipDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Organization ID',
  })
  @IsString()
  organizationId: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'User ID',
  })
  @IsString()
  userId: string;

  @ApiProperty({
    example: 'editor',
    description: 'User role in the organization',
    enum: ['owner', 'admin', 'editor', 'reviewer', 'viewer'],
  })
  @IsEnum(UserRole)
  role: UserRole;
}
