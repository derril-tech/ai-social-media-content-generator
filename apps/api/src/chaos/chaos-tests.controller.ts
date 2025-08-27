import {
  Controller,
  Post,
  Body,
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
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { ChaosTestsService, ChaosTestConfig, FullChaosTestResult } from './chaos-tests.service';

export class RunConnectorFailuresDto {
  failureType: string;
  postIds?: number[];
}

export class RunTokenExpiryDto {
  organizationId: number;
  maxRetries?: number;
}

export class RunGracefulDegradationDto {
  failureScenario: {
    type: string;
    platforms?: string[];
    failureRate?: number;
    duration?: number;
    constraints?: {
      maxMemory?: number;
      maxCPU?: number;
      maxConnections?: number;
    };
  };
}

export class RunRecoveryMechanismsDto {
  recoveryScenario: {
    type: string;
    platforms?: string[];
    failureDuration?: number;
    recoveryTriggers?: string[];
    recoveryMethod?: string;
  };
}

export class RunFullChaosTestSuiteDto {
  testConfig: ChaosTestConfig;
}

@ApiTags('Chaos Tests')
@Controller('chaos-tests')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ChaosTestsController {
  constructor(private readonly chaosTestsService: ChaosTestsService) {}

  @Post('connector-failures')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Test connector failures',
    description: 'Test how the system handles various connector failure scenarios including rate limits, server errors, and timeouts.',
  })
  @ApiBody({ type: RunConnectorFailuresDto })
  @ApiResponse({
    status: 200,
    description: 'Connector failure test completed successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  async testConnectorFailures(
    @Body() dto: RunConnectorFailuresDto,
    @Request() req,
  ) {
    const { failureType, postIds } = dto;
    const user = req.user;

    // Get posts to test with
    let posts;
    if (postIds && postIds.length > 0) {
      // Use specific posts if provided
      posts = await this.chaosTestsService['postRepository'].findByIds(postIds);
    } else {
      // Get scheduled posts for the organization
      posts = await this.chaosTestsService['postRepository'].find({
        where: { organizationId: user.organizationId, status: 'SCHEDULED' },
        take: 5,
      });
    }

    return this.chaosTestsService.testConnectorFailures(failureType, posts, user);
  }

  @Post('token-expiry')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Test token expiry scenarios',
    description: 'Test how the system handles token expiry and refresh mechanisms across different platforms.',
  })
  @ApiBody({ type: RunTokenExpiryDto })
  @ApiResponse({
    status: 200,
    description: 'Token expiry test completed successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  async testTokenExpiry(
    @Body() dto: RunTokenExpiryDto,
    @Request() req,
  ) {
    const { organizationId, maxRetries } = dto;
    const user = req.user;

    return this.chaosTestsService.testTokenExpiry(organizationId, user, { maxRetries });
  }

  @Post('graceful-degradation')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Test graceful degradation',
    description: 'Test how the system gracefully degrades when facing various failure scenarios.',
  })
  @ApiBody({ type: RunGracefulDegradationDto })
  @ApiResponse({
    status: 200,
    description: 'Graceful degradation test completed successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  async testGracefulDegradation(
    @Body() dto: RunGracefulDegradationDto,
    @Request() req,
  ) {
    const { failureScenario } = dto;
    const user = req.user;

    return this.chaosTestsService.testGracefulDegradation(failureScenario, user);
  }

  @Post('recovery-mechanisms')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Test recovery mechanisms',
    description: 'Test how the system recovers from various failure scenarios.',
  })
  @ApiBody({ type: RunRecoveryMechanismsDto })
  @ApiResponse({
    status: 200,
    description: 'Recovery mechanisms test completed successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  async testRecoveryMechanisms(
    @Body() dto: RunRecoveryMechanismsDto,
    @Request() req,
  ) {
    const { recoveryScenario } = dto;
    const user = req.user;

    return this.chaosTestsService.testRecoveryMechanisms(recoveryScenario, user);
  }

  @Post('full-suite')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Run full chaos test suite',
    description: 'Run a comprehensive chaos test suite covering all failure scenarios and recovery mechanisms.',
  })
  @ApiBody({ type: RunFullChaosTestSuiteDto })
  @ApiResponse({
    status: 200,
    description: 'Full chaos test suite completed successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  async runFullChaosTestSuite(
    @Body() dto: RunFullChaosTestSuiteDto,
    @Request() req,
  ): Promise<FullChaosTestResult> {
    const { testConfig } = dto;
    const user = req.user;

    return this.chaosTestsService.runFullChaosTestSuite(testConfig, user);
  }
}
