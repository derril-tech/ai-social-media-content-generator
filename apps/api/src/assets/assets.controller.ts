import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AssetsService } from './assets.service';

@ApiTags('assets')
@ApiBearerAuth('JWT-auth')
@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post('upload-url')
  @ApiOperation({ summary: 'Generate signed upload URL' })
  @ApiResponse({ status: 200 })
  async generateUploadUrl(
    @Body() body: { filename: string; contentType: string },
  ) {
    const url = await this.assetsService.generateUploadUrl(body.filename, body.contentType);
    return { uploadUrl: url };
  }

  @Get(':assetId/metadata')
  @ApiOperation({ summary: 'Get asset metadata' })
  @ApiResponse({ status: 200 })
  async getMetadata(@Param('assetId') assetId: string) {
    return this.assetsService.getAssetMetadata(assetId);
  }

  @Get(':assetId/preview')
  @ApiOperation({ summary: 'Get preview URL' })
  @ApiResponse({ status: 200 })
  async getPreviewUrl(@Param('assetId') assetId: string) {
    const url = await this.assetsService.generatePreviewUrl(assetId);
    return { previewUrl: url };
  }
}
