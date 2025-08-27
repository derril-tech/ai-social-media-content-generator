import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards, Req, HttpStatus, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ShareLinkService, CreateShareLinkRequest, ShareLinkAccessRequest, ShareLinkStats } from '../services/share-link.service';
import { RbacGuard, RequireAdmin } from '../../auth/guards/rbac.guard';
import { ShareLink, ShareLinkStatus, ShareLinkType } from '../entities/share-link.entity';

export interface CreateShareLinkDto {
  title: string;
  description?: string;
  type: ShareLinkType;
  resourceData: Record<string, any>;
  expiresAt?: Date;
  maxViews?: number;
  requirePassword?: boolean;
  password?: string;
  watermarkConfig?: {
    enabled?: boolean;
    text?: string;
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    opacity?: number;
    fontSize?: number;
    color?: string;
    includeTimestamp?: boolean;
    includeUserInfo?: boolean;
  };
  allowDownload?: boolean;
  allowComments?: boolean;
  customDomain?: string;
  metadata?: Record<string, any>;
}

export interface AccessShareLinkDto {
  password?: string;
}

export interface UpdateShareLinkDto extends Partial<CreateShareLinkDto> {}

@ApiTags('Share Links')
@Controller('share-links')
@UseGuards(RbacGuard)
@ApiBearerAuth()
export class ShareLinkController {
  constructor(
    private readonly shareLinkService: ShareLinkService,
  ) {}

  @Post('organizations/:organizationId')
  @RequireAdmin()
  @ApiOperation({ summary: 'Create a new share link' })
  @ApiParam({ name: 'organizationId', description: 'Organization ID' })
  @ApiResponse({ status: 201, description: 'Share link created successfully' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async createShareLink(
    @Param('organizationId') organizationId: string,
    @Body() request: CreateShareLinkDto,
    @Req() req: any,
  ): Promise<{ message: string; shareLink: any }> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
      }

      const shareLink = await this.shareLinkService.createShareLink(
        organizationId,
        userId,
        request as CreateShareLinkRequest,
      );

      return {
        message: 'Share link created successfully',
        shareLink: {
          id: shareLink.id,
          token: shareLink.token,
          title: shareLink.title,
          type: shareLink.type,
          status: shareLink.status,
          expiresAt: shareLink.expiresAt,
          maxViews: shareLink.maxViews,
          currentViews: shareLink.currentViews,
          requirePassword: shareLink.requirePassword,
          allowDownload: shareLink.allowDownload,
          allowComments: shareLink.allowComments,
          createdAt: shareLink.createdAt,
          shareUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/share/${shareLink.token}`,
        },
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create share link',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('access/:token')
  @ApiOperation({ summary: 'Access a share link' })
  @ApiParam({ name: 'token', description: 'Share link token' })
  @ApiResponse({ status: 200, description: 'Share link accessed successfully' })
  @ApiResponse({ status: 404, description: 'Share link not found' })
  @ApiResponse({ status: 401, description: 'Password required or invalid' })
  async accessShareLink(
    @Param('token') token: string,
    @Body() request: AccessShareLinkDto,
    @Req() req: any,
  ): Promise<{ shareLink: any; watermarkData?: any }> {
    try {
      const accessRequest: ShareLinkAccessRequest = {
        token,
        password: request.password,
        ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        action: 'view',
      };

      const result = await this.shareLinkService.accessShareLink(accessRequest);

      return {
        shareLink: {
          id: result.shareLink.id,
          title: result.shareLink.title,
          description: result.shareLink.description,
          type: result.shareLink.type,
          resourceData: result.shareLink.resourceData,
          allowDownload: result.shareLink.allowDownload,
          allowComments: result.shareLink.allowComments,
          organization: result.shareLink.organization?.name,
          createdBy: result.shareLink.createdBy?.name || result.shareLink.createdBy?.email,
          createdAt: result.shareLink.createdAt,
          currentViews: result.shareLink.currentViews,
          maxViews: result.shareLink.maxViews,
        },
        watermarkData: result.watermarkData,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to access share link',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('access/:token/download')
  @ApiOperation({ summary: 'Download content from share link' })
  @ApiParam({ name: 'token', description: 'Share link token' })
  @ApiResponse({ status: 200, description: 'Download initiated successfully' })
  @ApiResponse({ status: 404, description: 'Share link not found' })
  @ApiResponse({ status: 403, description: 'Download not allowed' })
  async downloadFromShareLink(
    @Param('token') token: string,
    @Body() request: AccessShareLinkDto,
    @Req() req: any,
  ): Promise<{ message: string; downloadUrl?: string }> {
    try {
      const accessRequest: ShareLinkAccessRequest = {
        token,
        password: request.password,
        ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        action: 'download',
      };

      const result = await this.shareLinkService.accessShareLink(accessRequest);

      if (!result.shareLink.allowDownload) {
        throw new HttpException('Download not allowed for this share link', HttpStatus.FORBIDDEN);
      }

      // In a real implementation, you would generate a signed download URL
      const downloadUrl = `${process.env.API_URL || 'http://localhost:3001'}/api/share-links/download/${token}`;

      return {
        message: 'Download initiated successfully',
        downloadUrl,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to download from share link',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('organizations/:organizationId')
  @RequireAdmin()
  @ApiOperation({ summary: 'List share links for an organization' })
  @ApiParam({ name: 'organizationId', description: 'Organization ID' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by share link type' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of links to return (default: 20)' })
  @ApiQuery({ name: 'offset', required: false, description: 'Number of links to skip (default: 0)' })
  @ApiResponse({ status: 200, description: 'Share links retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async listShareLinks(
    @Param('organizationId') organizationId: string,
    @Query('userId') userId?: string,
    @Query('type') type?: ShareLinkType,
    @Query('status') status?: ShareLinkStatus,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<{ shareLinks: any[]; total: number }> {
    try {
      const result = await this.shareLinkService.listShareLinks(
        organizationId,
        userId,
        type,
        status,
        limit || 20,
        offset || 0,
      );

      return {
        shareLinks: result.shareLinks.map(link => ({
          id: link.id,
          token: link.token,
          title: link.title,
          description: link.description,
          type: link.type,
          status: link.status,
          expiresAt: link.expiresAt,
          maxViews: link.maxViews,
          currentViews: link.currentViews,
          requirePassword: link.requirePassword,
          allowDownload: link.allowDownload,
          allowComments: link.allowComments,
          createdAt: link.createdAt,
          lastAccessedAt: link.lastAccessedAt,
          createdBy: link.createdBy?.name || link.createdBy?.email,
          shareUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/share/${link.token}`,
        })),
        total: result.total,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to list share links',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('organizations/:organizationId/:shareLinkId/stats')
  @RequireAdmin()
  @ApiOperation({ summary: 'Get statistics for a share link' })
  @ApiParam({ name: 'organizationId', description: 'Organization ID' })
  @ApiParam({ name: 'shareLinkId', description: 'Share link ID' })
  @ApiResponse({ status: 200, description: 'Share link statistics retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Share link not found' })
  async getShareLinkStats(
    @Param('organizationId') organizationId: string,
    @Param('shareLinkId') shareLinkId: string,
  ): Promise<ShareLinkStats> {
    try {
      return await this.shareLinkService.getShareLinkStats(shareLinkId, organizationId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get share link statistics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('organizations/:organizationId/:shareLinkId')
  @RequireAdmin()
  @ApiOperation({ summary: 'Update a share link' })
  @ApiParam({ name: 'organizationId', description: 'Organization ID' })
  @ApiParam({ name: 'shareLinkId', description: 'Share link ID' })
  @ApiResponse({ status: 200, description: 'Share link updated successfully' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Share link not found' })
  async updateShareLink(
    @Param('organizationId') organizationId: string,
    @Param('shareLinkId') shareLinkId: string,
    @Body() updates: UpdateShareLinkDto,
  ): Promise<{ message: string; shareLink: any }> {
    try {
      const shareLink = await this.shareLinkService.updateShareLink(
        shareLinkId,
        organizationId,
        updates as CreateShareLinkRequest,
      );

      return {
        message: 'Share link updated successfully',
        shareLink: {
          id: shareLink.id,
          token: shareLink.token,
          title: shareLink.title,
          description: shareLink.description,
          type: shareLink.type,
          status: shareLink.status,
          expiresAt: shareLink.expiresAt,
          maxViews: shareLink.maxViews,
          currentViews: shareLink.currentViews,
          requirePassword: shareLink.requirePassword,
          allowDownload: shareLink.allowDownload,
          allowComments: shareLink.allowComments,
          updatedAt: shareLink.updatedAt,
        },
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to update share link',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('organizations/:organizationId/:shareLinkId')
  @RequireAdmin()
  @ApiOperation({ summary: 'Revoke a share link' })
  @ApiParam({ name: 'organizationId', description: 'Organization ID' })
  @ApiParam({ name: 'shareLinkId', description: 'Share link ID' })
  @ApiResponse({ status: 200, description: 'Share link revoked successfully' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Share link not found' })
  async revokeShareLink(
    @Param('organizationId') organizationId: string,
    @Param('shareLinkId') shareLinkId: string,
  ): Promise<{ message: string }> {
    try {
      await this.shareLinkService.revokeShareLink(shareLinkId, organizationId);
      return { message: 'Share link revoked successfully' };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to revoke share link',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('cleanup/expired')
  @RequireAdmin()
  @ApiOperation({ summary: 'Clean up expired share links' })
  @ApiResponse({ status: 200, description: 'Cleanup completed successfully' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async cleanupExpiredLinks(): Promise<{ message: string; cleanedCount: number }> {
    try {
      const cleanedCount = await this.shareLinkService.cleanupExpiredLinks();
      return {
        message: 'Cleanup completed successfully',
        cleanedCount,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to cleanup expired links',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
