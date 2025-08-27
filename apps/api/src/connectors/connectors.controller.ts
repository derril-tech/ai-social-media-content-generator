import { Controller, Get, Post, Patch, Delete, Param, Body, Request, HttpStatus, UseGuards, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { ConnectorsService } from './connectors.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('connectors')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('connectors')
export class ConnectorsController {
  constructor(private readonly connectorsService: ConnectorsService) {}

  @Post()
  @ApiOperation({ summary: 'Create connector for brand' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Connector created' })
  create(@Body() body: { brandId: string; platform: any; config?: any }, @Request() req) {
    return this.connectorsService.create(body.brandId, body.platform, body.config || {}, req.user.id);
  }

  @Get('brand/:brandId')
  @ApiOperation({ summary: 'List connectors for brand' })
  @ApiParam({ name: 'brandId' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Connectors retrieved' })
  findByBrand(@Param('brandId') brandId: string, @Request() req) {
    return this.connectorsService.findByBrand(brandId, req.user.id);
  }

  @Get('status')
  @ApiOperation({ summary: 'Get connector status for all brands' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Connector status retrieved' })
  getStatus(@Request() req) {
    return this.connectorsService.getStatus(req.user.id);
  }

  @Get('status/detailed')
  @ApiOperation({ summary: 'Get detailed connector status for all brands' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Detailed connector status retrieved' })
  getDetailedStatus(@Request() req) {
    return this.connectorsService.getDetailedStatus(req.user.id);
  }

  @Post('config')
  @ApiOperation({ summary: 'Save connector configuration' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Configuration saved' })
  saveConfig(@Body() body: { platform: string; clientId: string; clientSecret: string; autoSync?: boolean; syncInterval?: string }, @Request() req) {
    return this.connectorsService.saveConfig(body, req.user.id);
  }

  @Post(':platform/test')
  @ApiOperation({ summary: 'Test connector connection' })
  @ApiParam({ name: 'platform' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Connection test completed' })
  testConnection(@Param('platform') platform: string, @Request() req) {
    return this.connectorsService.testConnection(platform, req.user.id);
  }

  @Post(':platform/oauth/url')
  @ApiOperation({ summary: 'Generate OAuth URL' })
  @ApiParam({ name: 'platform' })
  @ApiResponse({ status: HttpStatus.OK, description: 'OAuth URL generated' })
  generateOAuthUrl(@Param('platform') platform: string, @Request() req) {
    return this.connectorsService.generateOAuthUrl(platform, req.user.id);
  }

  @Post('oauth/callback')
  @ApiOperation({ summary: 'Handle OAuth callback' })
  @ApiResponse({ status: HttpStatus.OK, description: 'OAuth callback processed' })
  handleOAuthCallback(@Body() body: { platform: string; code: string }, @Request() req) {
    return this.connectorsService.handleOAuthCallback(body.platform, body.code, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update connector' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Connector updated' })
  update(@Param('id') id: string, @Body() body: any, @Request() req) {
    return this.connectorsService.update(id, body, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete connector' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Connector deleted' })
  remove(@Param('id') id: string, @Request() req) {
    return this.connectorsService.remove(id, req.user.id);
  }
}


