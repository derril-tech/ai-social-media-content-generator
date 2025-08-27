import { IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@shared/types';

export class UpdateMembershipDto {
  @ApiProperty({
    example: 'editor',
    description: 'User role in the organization',
    required: false,
    enum: ['owner', 'admin', 'editor', 'reviewer', 'viewer'],
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
