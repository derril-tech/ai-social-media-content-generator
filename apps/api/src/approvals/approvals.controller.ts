import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApprovalsService } from './approvals.service';

@ApiTags('approvals')
@ApiBearerAuth('JWT-auth')
@Controller('approvals')
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Post()
  @ApiOperation({ summary: 'Create approval request' })
  @ApiResponse({ status: 201 })
  create(@Body() body: any) {
    return this.approvalsService.createApprovalRequest(body);
  }

  @Put(':approvalId/approve')
  @ApiOperation({ summary: 'Approve post' })
  @ApiResponse({ status: 200 })
  approve(
    @Param('approvalId') approvalId: string,
    @Body() body: { reviewerId: string },
  ) {
    return this.approvalsService.approvePost(approvalId, body.reviewerId);
  }

  @Put(':approvalId/reject')
  @ApiOperation({ summary: 'Reject post' })
  @ApiResponse({ status: 200 })
  reject(
    @Param('approvalId') approvalId: string,
    @Body() body: { reviewerId: string; reason: string },
  ) {
    return this.approvalsService.rejectPost(approvalId, body.reviewerId, body.reason);
  }

  @Get('pending/:organizationId')
  @ApiOperation({ summary: 'Get pending approvals' })
  @ApiResponse({ status: 200 })
  getPending(@Param('organizationId') organizationId: string) {
    return this.approvalsService.getPendingApprovals(organizationId);
  }

  @Get('history/:resourceId')
  @ApiOperation({ summary: 'Get approval history' })
  @ApiResponse({ status: 200 })
  getHistory(@Param('resourceId') resourceId: string) {
    return this.approvalsService.getApprovalHistory(resourceId);
  }
}
