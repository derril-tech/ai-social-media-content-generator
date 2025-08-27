import { Module } from '@nestjs/common';
import { AccessibilityAuditService } from './accessibility-audit.service';
import { AccessibilityAuditController } from './accessibility-audit.controller';

@Module({
  controllers: [AccessibilityAuditController],
  providers: [AccessibilityAuditService],
  exports: [AccessibilityAuditService],
})
export class AccessibilityAuditModule {}
