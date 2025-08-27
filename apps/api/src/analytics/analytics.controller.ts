import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@ApiBearerAuth('JWT-auth')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('timeseries/:platform/:campaignId')
  @ApiOperation({ summary: 'Get timeseries data for platform/campaign' })
  @ApiResponse({ status: 200 })
  async getTimeseries(
    @Param('platform') platform: string,
    @Param('campaignId') campaignId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.analyticsService.getTimeseries(platform, campaignId, startDate, endDate);
  }

  @Get('breakdown/:platform/:campaignId')
  @ApiOperation({ summary: 'Get breakdown by post and hashtag' })
  @ApiResponse({ status: 200 })
  async getBreakdown(
    @Param('platform') platform: string,
    @Param('campaignId') campaignId: string,
  ) {
    return this.analyticsService.getBreakdown(platform, campaignId);
  }

  @Get('export/:platform/:campaignId/csv')
  @ApiOperation({ summary: 'Export analytics as CSV' })
  @ApiResponse({ status: 200 })
  async exportCSV(
    @Param('platform') platform: string,
    @Param('campaignId') campaignId: string,
    @Res() res: Response,
  ) {
    const csv = await this.analyticsService.exportCSV(platform, campaignId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=analytics-${platform}-${campaignId}.csv`);
    res.send(csv);
  }
}
