import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SecurityTestsService } from './security-tests.service';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('SecurityTestsService', () => {
  let service: SecurityTestsService;
  let userRepo: Repository<User>;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockUserRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getRawMany: jest.fn(),
      getMany: jest.fn(),
    })),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
    decode: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.ADMIN,
    organizationId: 1,
    isActive: true,
    emailVerified: true,
    password: 'hashed',
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLoginAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SecurityTestsService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<SecurityTestsService>(SecurityTestsService);
    userRepo = module.get<Repository<User>>(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('testAuthentication', () => {
    it('should test valid JWT token authentication', async () => {
      const validToken = 'valid.jwt.token';
      const decodedToken = {
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        organizationId: mockUser.organizationId,
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      };

      mockJwtService.verify.mockReturnValue(decodedToken);
      mockUserRepo.findOne.mockResolvedValue(mockUser);

      const result = await service.testAuthentication(validToken);

      expect(result.valid).toBe(true);
      expect(result.userId).toBe(mockUser.id);
      expect(result.role).toBe(mockUser.role);
      expect(result.organizationId).toBe(mockUser.organizationId);
      expect(result.tokenExpiry).toBeDefined();
      expect(result.securityLevel).toBe('high');
    });

    it('should test expired JWT token', async () => {
      const expiredToken = 'expired.jwt.token';
      const expiredDecodedToken = {
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        organizationId: mockUser.organizationId,
        iat: Date.now() / 1000 - 7200,
        exp: Date.now() / 1000 - 3600,
      };

      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Token expired');
      });

      const result = await service.testAuthentication(expiredToken);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Token expired');
      expect(result.securityLevel).toBe('low');
      expect(result.recommendation).toBe('Token refresh required');
    });

    it('should test invalid JWT token signature', async () => {
      const invalidToken = 'invalid.jwt.token';

      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const result = await service.testAuthentication(invalidToken);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid signature');
      expect(result.securityLevel).toBe('critical');
      expect(result.recommendation).toBe('Token compromised - immediate action required');
    });

    it('should test malformed JWT token', async () => {
      const malformedToken = 'malformed.token';

      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Malformed token');
      });

      const result = await service.testAuthentication(malformedToken);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Malformed token');
      expect(result.securityLevel).toBe('critical');
      expect(result.recommendation).toBe('Invalid token format');
    });

    it('should test user not found scenario', async () => {
      const validToken = 'valid.jwt.token';
      const decodedToken = {
        sub: 999, // Non-existent user ID
        email: 'nonexistent@example.com',
        role: UserRole.ADMIN,
        organizationId: 1,
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      };

      mockJwtService.verify.mockReturnValue(decodedToken);
      mockUserRepo.findOne.mockResolvedValue(null);

      const result = await service.testAuthentication(validToken);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('User not found');
      expect(result.securityLevel).toBe('high');
      expect(result.recommendation).toBe('User account may have been deleted');
    });
  });

  describe('testAuthorization', () => {
    it('should test admin role authorization', async () => {
      const adminUser = { ...mockUser, role: UserRole.ADMIN };
      const requiredRole = UserRole.ADMIN;
      const resource = 'users';

      const result = await service.testAuthorization(adminUser, requiredRole, resource);

      expect(result.authorized).toBe(true);
      expect(result.userRole).toBe(UserRole.ADMIN);
      expect(result.requiredRole).toBe(UserRole.ADMIN);
      expect(result.resource).toBe(resource);
      expect(result.permissionLevel).toBe('full');
      expect(result.auditTrail).toBeDefined();
    });

    it('should test insufficient role authorization', async () => {
      const editorUser = { ...mockUser, role: UserRole.EDITOR };
      const requiredRole = UserRole.ADMIN;
      const resource = 'users';

      const result = await service.testAuthorization(editorUser, requiredRole, resource);

      expect(result.authorized).toBe(false);
      expect(result.userRole).toBe(UserRole.EDITOR);
      expect(result.requiredRole).toBe(UserRole.ADMIN);
      expect(result.resource).toBe(resource);
      expect(result.permissionLevel).toBe('none');
      expect(result.auditTrail).toBeDefined();
      expect(result.recommendation).toBe('Role upgrade required');
    });

    it('should test organization-based authorization', async () => {
      const user = { ...mockUser, organizationId: 1 };
      const resource = 'campaigns';
      const resourceOrganizationId = 1;

      const result = await service.testAuthorization(user, UserRole.MANAGER, resource, resourceOrganizationId);

      expect(result.authorized).toBe(true);
      expect(result.organizationMatch).toBe(true);
      expect(result.crossOrganizationAccess).toBe(false);
    });

    it('should test cross-organization access prevention', async () => {
      const user = { ...mockUser, organizationId: 1 };
      const resource = 'campaigns';
      const resourceOrganizationId = 2; // Different organization

      const result = await service.testAuthorization(user, UserRole.MANAGER, resource, resourceOrganizationId);

      expect(result.authorized).toBe(false);
      expect(result.organizationMatch).toBe(false);
      expect(result.crossOrganizationAccess).toBe(true);
      expect(result.securityViolation).toBe('Cross-organization access attempt');
    });

    it('should test resource-specific permissions', async () => {
      const user = { ...mockUser, role: UserRole.EDITOR };
      const resource = 'analytics';
      const action = 'read';

      const result = await service.testAuthorization(user, UserRole.EDITOR, resource, undefined, action);

      expect(result.authorized).toBe(true);
      expect(result.resource).toBe(resource);
      expect(result.action).toBe(action);
      expect(result.permissionLevel).toBe('read-only');
    });
  });

  describe('testInputValidation', () => {
    it('should test SQL injection prevention', async () => {
      const maliciousInputs = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "'; INSERT INTO users VALUES (1, 'hacker', 'password'); --",
        "admin'--",
      ];

      const result = await service.testInputValidation('sql-injection', maliciousInputs);

      expect(result.testType).toBe('sql-injection');
      expect(result.totalTests).toBe(maliciousInputs.length);
      expect(result.passedTests).toBe(maliciousInputs.length);
      expect(result.failedTests).toBe(0);
      expect(result.securityLevel).toBe('high');
      expect(result.sanitizationApplied).toBe(true);
    });

    it('should test XSS prevention', async () => {
      const maliciousInputs = [
        '<script>alert("XSS")</script>',
        'javascript:alert("XSS")',
        '<img src="x" onerror="alert(\'XSS\')">',
        '"><script>alert("XSS")</script>',
      ];

      const result = await service.testInputValidation('xss', maliciousInputs);

      expect(result.testType).toBe('xss');
      expect(result.totalTests).toBe(maliciousInputs.length);
      expect(result.passedTests).toBe(maliciousInputs.length);
      expect(result.failedTests).toBe(0);
      expect(result.encodingApplied).toBe(true);
      expect(result.cspEnabled).toBe(true);
    });

    it('should test command injection prevention', async () => {
      const maliciousInputs = [
        '; rm -rf /',
        '| cat /etc/passwd',
        '&& shutdown -h now',
        '$(whoami)',
      ];

      const result = await service.testInputValidation('command-injection', maliciousInputs);

      expect(result.testType).toBe('command-injection');
      expect(result.totalTests).toBe(maliciousInputs.length);
      expect(result.passedTests).toBe(maliciousInputs.length);
      expect(result.failedTests).toBe(0);
      expect(result.parameterizationApplied).toBe(true);
      expect(result.shellEscaping).toBe(true);
    });

    it('should test path traversal prevention', async () => {
      const maliciousInputs = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        '....//....//....//etc/passwd',
        '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
      ];

      const result = await service.testInputValidation('path-traversal', maliciousInputs);

      expect(result.testType).toBe('path-traversal');
      expect(result.totalTests).toBe(maliciousInputs.length);
      expect(result.passedTests).toBe(maliciousInputs.length);
      expect(result.failedTests).toBe(0);
      expect(result.pathSanitization).toBe(true);
      expect(result.whitelistValidation).toBe(true);
    });

    it('should test input length validation', async () => {
      const longInputs = [
        'a'.repeat(10000), // Very long string
        'b'.repeat(5000),  // Long string
        'c'.repeat(100),   // Normal string
        'd'.repeat(1),     // Short string
      ];

      const result = await service.testInputValidation('length-validation', longInputs);

      expect(result.testType).toBe('length-validation');
      expect(result.totalTests).toBe(longInputs.length);
      expect(result.maxLengthEnforced).toBe(true);
      expect(result.truncationApplied).toBeDefined();
      expect(result.validationRules).toBeDefined();
    });
  });

  describe('testDataProtection', () => {
    it('should test sensitive data encryption', async () => {
      const sensitiveData = [
        { field: 'password', value: 'secret123' },
        { field: 'ssn', value: '123-45-6789' },
        { field: 'creditCard', value: '4111-1111-1111-1111' },
        { field: 'apiKey', value: 'sk-1234567890abcdef' },
      ];

      const result = await service.testDataProtection('encryption', sensitiveData);

      expect(result.testType).toBe('encryption');
      expect(result.totalFields).toBe(sensitiveData.length);
      expect(result.encryptedFields).toBe(sensitiveData.length);
      expect(result.encryptionAlgorithm).toBe('AES-256-GCM');
      expect(result.keyRotation).toBe(true);
      expect(result.encryptionAtRest).toBe(true);
      expect(result.encryptionInTransit).toBe(true);
    });

    it('should test data masking', async () => {
      const sensitiveData = [
        { field: 'email', value: 'user@example.com' },
        { field: 'phone', value: '+1-555-123-4567' },
        { field: 'address', value: '123 Main St, City, State 12345' },
        { field: 'accountNumber', value: '1234567890' },
      ];

      const result = await service.testDataProtection('masking', sensitiveData);

      expect(result.testType).toBe('masking');
      expect(result.totalFields).toBe(sensitiveData.length);
      expect(result.maskedFields).toBe(sensitiveData.length);
      expect(result.maskingPatterns).toBeDefined();
      expect(result.partialMasking).toBe(true);
      expect(result.fullMasking).toBeDefined();
    });

    it('should test data anonymization', async () => {
      const personalData = [
        { field: 'name', value: 'John Doe' },
        { field: 'email', value: 'john.doe@example.com' },
        { field: 'ipAddress', value: '192.168.1.100' },
        { field: 'userAgent', value: 'Mozilla/5.0...' },
      ];

      const result = await service.testDataProtection('anonymization', personalData);

      expect(result.testType).toBe('anonymization');
      expect(result.totalFields).toBe(personalData.length);
      expect(result.anonymizedFields).toBe(personalData.length);
      expect(result.pseudonymization).toBe(true);
      expect(result.hashFunctions).toBeDefined();
      expect(result.reversibility).toBe(false);
    });

    it('should test data retention policies', async () => {
      const dataTypes = [
        { type: 'logs', retentionDays: 30 },
        { type: 'userData', retentionDays: 2555 }, // 7 years
        { type: 'analytics', retentionDays: 365 },
        { type: 'backups', retentionDays: 90 },
      ];

      const result = await service.testDataProtection('retention', dataTypes);

      expect(result.testType).toBe('retention');
      expect(result.totalPolicies).toBe(dataTypes.length);
      expect(result.complianceChecked).toBe(true);
      expect(result.automaticDeletion).toBe(true);
      expect(result.retentionPeriods).toBeDefined();
      expect(result.gdprCompliance).toBe(true);
    });
  });

  describe('testRateLimiting', () => {
    it('should test API rate limiting', async () => {
      const endpoint = '/api/posts';
      const requests = 100;
      const timeWindow = 60; // 1 minute

      const result = await service.testRateLimiting('api', endpoint, requests, timeWindow);

      expect(result.testType).toBe('api');
      expect(result.endpoint).toBe(endpoint);
      expect(result.totalRequests).toBe(requests);
      expect(result.timeWindow).toBe(timeWindow);
      expect(result.rateLimitEnforced).toBe(true);
      expect(result.maxRequestsPerWindow).toBeDefined();
      expect(result.blockedRequests).toBeGreaterThan(0);
      expect(result.rateLimitHeaders).toBeDefined();
    });

    it('should test authentication rate limiting', async () => {
      const endpoint = '/auth/login';
      const attempts = 10;
      const timeWindow = 300; // 5 minutes

      const result = await service.testRateLimiting('authentication', endpoint, attempts, timeWindow);

      expect(result.testType).toBe('authentication');
      expect(result.endpoint).toBe(endpoint);
      expect(result.totalAttempts).toBe(attempts);
      expect(result.timeWindow).toBe(timeWindow);
      expect(result.accountLockout).toBe(true);
      expect(result.lockoutDuration).toBeDefined();
      expect(result.failedAttempts).toBeGreaterThan(0);
      expect(result.captchaRequired).toBe(true);
    });

    it('should test IP-based rate limiting', async () => {
      const ipAddress = '192.168.1.100';
      const requests = 50;
      const timeWindow = 60;

      const result = await service.testRateLimiting('ip-based', ipAddress, requests, timeWindow);

      expect(result.testType).toBe('ip-based');
      expect(result.ipAddress).toBe(ipAddress);
      expect(result.totalRequests).toBe(requests);
      expect(result.timeWindow).toBe(timeWindow);
      expect(result.ipBlocking).toBe(true);
      expect(result.geolocationFiltering).toBe(true);
      expect(result.whitelistCheck).toBe(true);
    });
  });

  describe('runFullSecurityTestSuite', () => {
    it('should run complete security test suite', async () => {
      const testConfig = {
        authentication: {
          scenarios: ['valid-token', 'expired-token', 'invalid-signature'],
          users: [mockUser],
        },
        authorization: {
          roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EDITOR],
          resources: ['users', 'campaigns', 'analytics'],
        },
        inputValidation: {
          types: ['sql-injection', 'xss', 'command-injection'],
          samples: 10,
        },
        dataProtection: {
          types: ['encryption', 'masking', 'anonymization'],
          dataSamples: 5,
        },
        rateLimiting: {
          endpoints: ['/api/posts', '/auth/login'],
          requestCounts: [100, 10],
        },
      };

      const result = await service.runFullSecurityTestSuite(testConfig);

      expect(result.authentication).toBeDefined();
      expect(result.authorization).toBeDefined();
      expect(result.inputValidation).toBeDefined();
      expect(result.dataProtection).toBeDefined();
      expect(result.rateLimiting).toBeDefined();
      expect(result.overallSecurityScore).toBeDefined();
      expect(result.vulnerabilities).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(result.complianceReport).toBeDefined();
    });

    it('should generate security compliance report', async () => {
      const testConfig = {
        authentication: { scenarios: ['valid-token'] },
        authorization: { roles: [UserRole.ADMIN], resources: ['users'] },
        inputValidation: { types: ['sql-injection'], samples: 5 },
        dataProtection: { types: ['encryption'], dataSamples: 3 },
        rateLimiting: { endpoints: ['/api/posts'], requestCounts: [50] },
      };

      const result = await service.runFullSecurityTestSuite(testConfig);

      expect(result.complianceReport).toBeDefined();
      expect(result.complianceReport.gdpr).toBeDefined();
      expect(result.complianceReport.soc2).toBeDefined();
      expect(result.complianceReport.pci).toBeDefined();
      expect(result.complianceReport.hipaa).toBeDefined();
      expect(result.complianceReport.overallCompliance).toBeDefined();
      expect(result.complianceReport.recommendations).toBeDefined();
    });
  });
});
