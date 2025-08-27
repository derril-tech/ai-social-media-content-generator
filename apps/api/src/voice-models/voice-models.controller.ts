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
import { VoiceModelsService } from './voice-models.service';
import { CreateVoiceModelDto } from './dto/create-voice-model.dto';
import { TrainVoiceModelDto } from './dto/train-voice-model.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@shared/types';

@ApiTags('voice-models')
@Controller('voice-models')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class VoiceModelsController {
  constructor(private readonly voiceModelsService: VoiceModelsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Create a new voice model for a brand' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Voice model successfully created',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Voice model already exists for this brand',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'No access to the specified brand',
  })
  create(@Body() createVoiceModelDto: CreateVoiceModelDto, @Request() req) {
    return this.voiceModelsService.create(createVoiceModelDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all voice models accessible to the user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Voice models retrieved successfully',
  })
  findAll(@Request() req) {
    return this.voiceModelsService.findAll(req.user.id);
  }

  @Get('brand/:brandId')
  @ApiOperation({ summary: 'Get voice model for a specific brand' })
  @ApiParam({ name: 'brandId', description: 'Brand ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Voice model retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No voice model found for this brand',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'No access to the specified brand',
  })
  findByBrand(@Param('brandId') brandId: string, @Request() req) {
    return this.voiceModelsService.findByBrand(brandId, req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get voice model by ID' })
  @ApiParam({ name: 'id', description: 'Voice model ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Voice model retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Voice model not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'No access to this voice model',
  })
  findOne(@Param('id') id: string, @Request() req) {
    return this.voiceModelsService.findOne(id, req.user.id);
  }

  @Post(':id/train')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Start training a voice model' })
  @ApiParam({ name: 'id', description: 'Voice model ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Training started successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Voice model is already being trained',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'No access to this voice model',
  })
  train(
    @Param('id') id: string,
    @Body() trainVoiceModelDto: TrainVoiceModelDto,
    @Request() req,
  ) {
    return this.voiceModelsService.train(id, trainVoiceModelDto, req.user.id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Delete voice model' })
  @ApiParam({ name: 'id', description: 'Voice model ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Voice model deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'No permission to delete this voice model',
  })
  remove(@Param('id') id: string, @Request() req) {
    return this.voiceModelsService.remove(id, req.user.id);
  }
}
