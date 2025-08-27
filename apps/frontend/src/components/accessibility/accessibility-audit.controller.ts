import {
  Controller,
  Post,
  Get,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';
import { AccessibilityAuditService, AccessibilityAuditResult } from './accessibility-audit.service';

@ApiTags('Accessibility Audit')
@Controller('accessibility-audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AccessibilityAuditController {
  constructor(private readonly accessibilityAuditService: AccessibilityAuditService) {}

  @Post('run-full-audit')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Run comprehensive accessibility audit',
    description: 'Performs a complete accessibility audit including keyboard navigation, ARIA labels, color contrast, focus management, and semantic HTML.',
  })
  @ApiResponse({
    status: 200,
    description: 'Accessibility audit completed successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  async runFullAudit(@Request() req): Promise<AccessibilityAuditResult> {
    return this.accessibilityAuditService.runFullAccessibilityAudit();
  }

  @Get('compliance-status')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Get accessibility compliance status',
    description: 'Returns the current accessibility compliance status and WCAG level compliance.',
  })
  @ApiResponse({
    status: 200,
    description: 'Compliance status retrieved successfully',
  })
  async getComplianceStatus(@Request() req) {
    const auditResult = await this.accessibilityAuditService.runFullAccessibilityAudit();
    
    return {
      complianceScore: auditResult.complianceScore,
      wcagCompliance: auditResult.wcagCompliance,
      totalIssues: auditResult.totalIssues,
      criticalIssues: auditResult.criticalIssues,
      highIssues: auditResult.highIssues,
      mediumIssues: auditResult.mediumIssues,
      lowIssues: auditResult.lowIssues,
      recommendations: auditResult.recommendations,
      lastAudit: auditResult.auditTimestamp,
    };
  }

  @Post('test-keyboard-navigation')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Test keyboard navigation',
    description: 'Tests keyboard navigation for all interactive elements.',
  })
  @ApiResponse({
    status: 200,
    description: 'Keyboard navigation test completed',
  })
  async testKeyboardNavigation(@Request() req) {
    const auditResult = await this.accessibilityAuditService.runFullAccessibilityAudit();
    const keyboardIssues = auditResult.issues.filter(issue => issue.category === 'keyboard');
    
    return {
      totalKeyboardIssues: keyboardIssues.length,
      criticalIssues: keyboardIssues.filter(issue => issue.type === 'critical').length,
      highIssues: keyboardIssues.filter(issue => issue.type === 'high').length,
      mediumIssues: keyboardIssues.filter(issue => issue.type === 'medium').length,
      lowIssues: keyboardIssues.filter(issue => issue.type === 'low').length,
      issues: keyboardIssues,
      recommendations: auditResult.recommendations.filter(rec => rec.includes('keyboard')),
    };
  }

  @Post('test-aria-labels')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Test ARIA labels and roles',
    description: 'Tests ARIA labels, roles, and accessibility attributes.',
  })
  @ApiResponse({
    status: 200,
    description: 'ARIA labels test completed',
  })
  async testARIALabels(@Request() req) {
    const auditResult = await this.accessibilityAuditService.runFullAccessibilityAudit();
    const ariaIssues = auditResult.issues.filter(issue => issue.category === 'aria');
    
    return {
      totalARIAIssues: ariaIssues.length,
      criticalIssues: ariaIssues.filter(issue => issue.type === 'critical').length,
      highIssues: ariaIssues.filter(issue => issue.type === 'high').length,
      mediumIssues: ariaIssues.filter(issue => issue.type === 'medium').length,
      lowIssues: ariaIssues.filter(issue => issue.type === 'low').length,
      issues: ariaIssues,
      recommendations: auditResult.recommendations.filter(rec => rec.includes('ARIA')),
    };
  }

  @Post('test-color-contrast')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Test color contrast',
    description: 'Tests color contrast ratios for text and UI elements.',
  })
  @ApiResponse({
    status: 200,
    description: 'Color contrast test completed',
  })
  async testColorContrast(@Request() req) {
    const auditResult = await this.accessibilityAuditService.runFullAccessibilityAudit();
    const contrastIssues = auditResult.issues.filter(issue => issue.category === 'contrast');
    
    return {
      totalContrastIssues: contrastIssues.length,
      criticalIssues: contrastIssues.filter(issue => issue.type === 'critical').length,
      highIssues: contrastIssues.filter(issue => issue.type === 'high').length,
      mediumIssues: contrastIssues.filter(issue => issue.type === 'medium').length,
      lowIssues: contrastIssues.filter(issue => issue.type === 'low').length,
      issues: contrastIssues,
      recommendations: auditResult.recommendations.filter(rec => rec.includes('contrast')),
    };
  }

  @Post('test-focus-management')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Test focus management',
    description: 'Tests focus indicators, focus trapping, and skip links.',
  })
  @ApiResponse({
    status: 200,
    description: 'Focus management test completed',
  })
  async testFocusManagement(@Request() req) {
    const auditResult = await this.accessibilityAuditService.runFullAccessibilityAudit();
    const focusIssues = auditResult.issues.filter(issue => issue.category === 'focus');
    
    return {
      totalFocusIssues: focusIssues.length,
      criticalIssues: focusIssues.filter(issue => issue.type === 'critical').length,
      highIssues: focusIssues.filter(issue => issue.type === 'high').length,
      mediumIssues: focusIssues.filter(issue => issue.type === 'medium').length,
      lowIssues: focusIssues.filter(issue => issue.type === 'low').length,
      issues: focusIssues,
      recommendations: auditResult.recommendations.filter(rec => rec.includes('focus')),
    };
  }

  @Post('test-semantic-html')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Test semantic HTML',
    description: 'Tests semantic HTML structure, headings, lists, and landmarks.',
  })
  @ApiResponse({
    status: 200,
    description: 'Semantic HTML test completed',
  })
  async testSemanticHTML(@Request() req) {
    const auditResult = await this.accessibilityAuditService.runFullAccessibilityAudit();
    const semanticIssues = auditResult.issues.filter(issue => issue.category === 'semantics');
    
    return {
      totalSemanticIssues: semanticIssues.length,
      criticalIssues: semanticIssues.filter(issue => issue.type === 'critical').length,
      highIssues: semanticIssues.filter(issue => issue.type === 'high').length,
      mediumIssues: semanticIssues.filter(issue => issue.type === 'medium').length,
      lowIssues: semanticIssues.filter(issue => issue.type === 'low').length,
      issues: semanticIssues,
      recommendations: auditResult.recommendations.filter(rec => rec.includes('semantic')),
    };
  }
}
