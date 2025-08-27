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
import { BriefsService } from './briefs.service';
import { CreateBriefDto } from './dto/create-brief.dto';
import { UpdateBriefDto } from './dto/update-brief.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@shared/types';

@ApiTags('briefs')
@Controller('briefs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class BriefsController {
  constructor(private readonly briefsService: BriefsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.EDITOR)
  @ApiOperation({ summary: 'Create a new content generation brief' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Brief successfully created',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid brief data or parameters',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'No access to the specified campaign',
  })
  create(@Body() createBriefDto: CreateBriefDto, @Request() req) {
    return this.briefsService.create(createBriefDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all briefs accessible to the user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Briefs retrieved successfully',
  })
  findAll(@Request() req) {
    return this.briefsService.findAll(req.user.id);
  }

  @Get('campaign/:campaignId')
  @ApiOperation({ summary: 'Get briefs for a specific campaign' })
  @ApiParam({ name: 'campaignId', description: 'Campaign ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Campaign briefs retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'No access to this campaign',
  })
  findByCampaign(@Param('campaignId') campaignId: string, @Request() req) {
    return this.briefsService.findByCampaign(campaignId, req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get brief by ID' })
  @ApiParam({ name: 'id', description: 'Brief ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Brief retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Brief not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'No access to this brief',
  })
  findOne(@Param('id') id: string, @Request() req) {
    return this.briefsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.EDITOR)
  @ApiOperation({ summary: 'Update brief information' })
  @ApiParam({ name: 'id', description: 'Brief ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Brief updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Brief not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
  })
  update(
    @Param('id') id: string,
    @Body() updateBriefDto: UpdateBriefDto,
    @Request() req,
  ) {
    return this.briefsService.update(id, updateBriefDto, req.user.id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Delete brief' })
  @ApiParam({ name: 'id', description: 'Brief ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Brief deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Brief not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Only organization owners and admins can delete briefs',
  })
  remove(@Param('id') id: string, @Request() req) {
    return this.briefsService.remove(id, req.user.id);
  }

  @Post(':id/ready')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.EDITOR)
  @ApiOperation({ summary: 'Mark brief as ready for generation' })
  @ApiParam({ name: 'id', description: 'Brief ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Brief marked as ready successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Brief is missing required fields',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
  })
  markReady(@Param('id') id: string, @Request() req) {
    return this.briefsService.markReady(id, req.user.id);
  }

  @Post(':id/generate')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.EDITOR)
  @ApiOperation({ summary: 'Start content generation for brief' })
  @ApiParam({ name: 'id', description: 'Brief ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Content generation started successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Brief must be in ready status',
  })
  startGeneration(@Param('id') id: string, @Request() req) {
    return this.briefsService.startGeneration(id, req.user.id);
  }
}
