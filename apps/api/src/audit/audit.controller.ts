import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuditService } from './audit.service';

@ApiTags('audit')
@ApiBearerAuth('JWT-auth')
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('resource/:resourceId')
  @ApiOperation({ summary: 'Get audit log for resource' })
  @ApiResponse({ status: 200 })
  getAuditLog(
    @Param('resourceId') resourceId: string,
    @Query('action') action?: string,
  ) {
    return this.auditService.getAuditLog(resourceId, action);
  }
}
