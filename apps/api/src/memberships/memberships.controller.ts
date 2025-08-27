import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { MembershipsService } from './memberships.service';
import { CreateMembershipDto } from './dto/create-membership.dto';
import { UpdateMembershipDto } from './dto/update-membership.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@shared/types';

@ApiTags('memberships')
@Controller('memberships')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Add user to organization' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Membership created successfully',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'User is already a member of this organization',
  })
  create(@Body() createMembershipDto: CreateMembershipDto) {
    return this.membershipsService.create(createMembershipDto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all memberships' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Memberships retrieved successfully',
  })
  findAll() {
    return this.membershipsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get membership by ID' })
  @ApiParam({ name: 'id', description: 'Membership ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Membership retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Membership not found',
  })
  findOne(@Param('id') id: string) {
    return this.membershipsService.findOne(id);
  }

  @Get('organization/:organizationId')
  @ApiOperation({ summary: 'Get memberships for organization' })
  @ApiParam({ name: 'organizationId', description: 'Organization ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Organization memberships retrieved successfully',
  })
  findByOrganization(@Param('organizationId') organizationId: string) {
    return this.membershipsService.findByOrganization(organizationId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get memberships for user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User memberships retrieved successfully',
  })
  findByUser(@Param('userId') userId: string) {
    return this.membershipsService.findByUser(userId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Update membership' })
  @ApiParam({ name: 'id', description: 'Membership ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Membership updated successfully',
  })
  update(
    @Param('id') id: string,
    @Body() updateMembershipDto: UpdateMembershipDto,
  ) {
    return this.membershipsService.update(id, updateMembershipDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Remove membership' })
  @ApiParam({ name: 'id', description: 'Membership ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Membership removed successfully',
  })
  remove(@Param('id') id: string) {
    return this.membershipsService.remove(id);
  }

  @Post('organization/:organizationId/user/:userId/role')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Change user role in organization' })
  @ApiParam({ name: 'organizationId', description: 'Organization ID' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User role changed successfully',
  })
  changeRole(
    @Param('organizationId') organizationId: string,
    @Param('userId') userId: string,
    @Body() body: { role: UserRole },
    @Request() req,
  ) {
    return this.membershipsService.changeUserRole(
      organizationId,
      userId,
      body.role,
      req.user.id,
    );
  }

  @Delete('organization/:organizationId/user/:userId')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Remove user from organization' })
  @ApiParam({ name: 'organizationId', description: 'Organization ID' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User removed from organization successfully',
  })
  removeUserFromOrganization(
    @Param('organizationId') organizationId: string,
    @Param('userId') userId: string,
  ) {
    return this.membershipsService.removeUserFromOrganization(
      organizationId,
      userId,
    );
  }
}
