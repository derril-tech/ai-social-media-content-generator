import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PolicyDetectorService } from './policy-detector.service';
import { PolicyRule } from './entities/policy-rule.entity';
import { PolicyViolation } from './entities/policy-violation.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { Post } from '../posts/entities/post.entity';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';

describe('PolicyDetectorService', () => {
  let service: PolicyDetectorService;
  let policyRuleRepo: Repository<PolicyRule>;
  let policyViolationRepo: Repository<PolicyViolation>;
  let organizationRepo: Repository<Organization>;
  let postRepo: Repository<Post>;
  let httpService: HttpService;

  const mockPolicyRuleRepo = {
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

  const mockPolicyViolationRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
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

  const mockOrganizationRepo = {
    findOne: jest.fn(),
  };

  const mockPostRepo = {
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockHttpService = {
    post: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PolicyDetectorService,
        {
          provide: getRepositoryToken(PolicyRule),
          useValue: mockPolicyRuleRepo,
        },
        {
          provide: getRepositoryToken(PolicyViolation),
          useValue: mockPolicyViolationRepo,
        },
        {
          provide: getRepositoryToken(Organization),
          useValue: mockOrganizationRepo,
        },
        {
          provide: getRepositoryToken(Post),
          useValue: mockPostRepo,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    service = module.get<PolicyDetectorService>(PolicyDetectorService);
    policyRuleRepo = module.get<Repository<PolicyRule>>(getRepositoryToken(PolicyRule));
    policyViolationRepo = module.get<Repository<PolicyViolation>>(getRepositoryToken(PolicyViolation));
    organizationRepo = module.get<Repository<Organization>>(getRepositoryToken(Organization));
    postRepo = module.get<Repository<Post>>(getRepositoryToken(Post));
    httpService = module.get<HttpService>(HttpService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkContentPolicy', () => {
    it('should pass content that meets all policy requirements', async () => {
      const content = 'Our new AI-powered analytics platform helps businesses make better decisions.';
      const organizationId = 1;
      const platform = 'linkedin';

      const mockRules = [
        {
          id: 1,
          type: 'prohibited_words',
          pattern: 'spam|scam|fake',
          severity: 'high',
          isActive: true,
        },
        {
          id: 2,
          type: 'content_length',
          pattern: 'max_length:3000',
          severity: 'medium',
          isActive: true,
        },
      ];

      mockPolicyRuleRepo.find.mockResolvedValue(mockRules);

      const result = await service.checkContentPolicy(content, organizationId, platform);

      expect(result.isCompliant).toBe(true);
      expect(result.violations).toHaveLength(0);
      expect(result.riskScore).toBeLessThan(0.3);
    });

    it('should detect prohibited words and flag violations', async () => {
      const content = 'Get rich quick with our amazing scam! Limited time offer!';
      const organizationId = 1;
      const platform = 'linkedin';

      const mockRules = [
        {
          id: 1,
          type: 'prohibited_words',
          pattern: 'scam|fake|spam',
          severity: 'high',
          isActive: true,
        },
      ];

      mockPolicyRuleRepo.find.mockResolvedValue(mockRules);

      const result = await service.checkContentPolicy(content, organizationId, platform);

      expect(result.isCompliant).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].ruleId).toBe(1);
      expect(result.violations[0].severity).toBe('high');
      expect(result.riskScore).toBeGreaterThan(0.7);
    });

    it('should detect content length violations', async () => {
      const content = 'a'.repeat(3500); // Exceeds 3000 character limit
      const organizationId = 1;
      const platform = 'linkedin';

      const mockRules = [
        {
          id: 1,
          type: 'content_length',
          pattern: 'max_length:3000',
          severity: 'medium',
          isActive: true,
        },
      ];

      mockPolicyRuleRepo.find.mockResolvedValue(mockRules);

      const result = await service.checkContentPolicy(content, organizationId, platform);

      expect(result.isCompliant).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].type).toBe('content_length');
      expect(result.riskScore).toBeGreaterThan(0.5);
    });

    it('should detect multiple violations and calculate cumulative risk', async () => {
      const content = 'Get rich quick with our amazing scam! Limited time offer! ' + 'a'.repeat(3500);
      const organizationId = 1;
      const platform = 'linkedin';

      const mockRules = [
        {
          id: 1,
          type: 'prohibited_words',
          pattern: 'scam|fake|spam',
          severity: 'high',
          isActive: true,
        },
        {
          id: 2,
          type: 'content_length',
          pattern: 'max_length:3000',
          severity: 'medium',
          isActive: true,
        },
      ];

      mockPolicyRuleRepo.find.mockResolvedValue(mockRules);

      const result = await service.checkContentPolicy(content, organizationId, platform);

      expect(result.isCompliant).toBe(false);
      expect(result.violations).toHaveLength(2);
      expect(result.riskScore).toBeGreaterThan(0.8);
    });
  });

  describe('checkBrandCompliance', () => {
    it('should check content against brand guidelines', async () => {
      const content = 'Our innovative AI platform transforms business intelligence.';
      const brandGuidelines = {
        tone: 'Professional and innovative',
        voice: 'Innovative, reliable, customer-focused',
        do: ['Use technical terms appropriately', 'Focus on business benefits'],
        dont: ['Use overly casual language', 'Make unrealistic promises'],
      };

      const result = await service.checkBrandCompliance(content, brandGuidelines);

      expect(result.isCompliant).toBe(true);
      expect(result.score).toBeGreaterThan(0.8);
      expect(result.suggestions).toHaveLength(0);
    });

    it('should detect brand guideline violations', async () => {
      const content = 'OMG! Our totally amazing AI thingy will make you rich overnight!';
      const brandGuidelines = {
        tone: 'Professional and innovative',
        voice: 'Innovative, reliable, customer-focused',
        do: ['Use technical terms appropriately', 'Focus on business benefits'],
        dont: ['Use overly casual language', 'Make unrealistic promises'],
      };

      const result = await service.checkBrandCompliance(content, brandGuidelines);

      expect(result.isCompliant).toBe(false);
      expect(result.score).toBeLessThan(0.5);
      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions.some(s => s.includes('casual language'))).toBe(true);
      expect(result.suggestions.some(s => s.includes('unrealistic promises'))).toBe(true);
    });

    it('should provide specific improvement suggestions', async () => {
      const content = 'Our AI platform is super cool and will make you tons of money!';
      const brandGuidelines = {
        tone: 'Professional and innovative',
        voice: 'Innovative, reliable, customer-focused',
        do: ['Use technical terms appropriately', 'Focus on business benefits'],
        dont: ['Use overly casual language', 'Make unrealistic promises'],
      };

      const result = await service.checkBrandCompliance(content, brandGuidelines);

      expect(result.suggestions).toContain('Consider using more professional language');
      expect(result.suggestions).toContain('Focus on specific business benefits rather than financial promises');
    });
  });

  describe('checkPlatformCompliance', () => {
    it('should check LinkedIn-specific policies', async () => {
      const content = 'Professional content about business analytics and AI solutions.';
      const platform = 'linkedin';

      const result = await service.checkPlatformCompliance(content, platform);

      expect(result.isCompliant).toBe(true);
      expect(result.platformSpecificRules).toBeDefined();
    });

    it('should detect LinkedIn policy violations', async () => {
      const content = 'Buy now! Limited time offer! Get rich quick! Click here!';
      const platform = 'linkedin';

      const result = await service.checkPlatformCompliance(content, platform);

      expect(result.isCompliant).toBe(false);
      expect(result.violations.some(v => v.includes('promotional language'))).toBe(true);
    });

    it('should check Instagram-specific policies', async () => {
      const content = 'Beautiful visual content with relevant hashtags #business #analytics';
      const platform = 'instagram';

      const result = await service.checkPlatformCompliance(content, platform);

      expect(result.isCompliant).toBe(true);
    });

    it('should detect Instagram policy violations', async () => {
      const content = 'Follow for follow! Like for like! Comment for comment!';
      const platform = 'instagram';

      const result = await service.checkPlatformCompliance(content, platform);

      expect(result.isCompliant).toBe(false);
      expect(result.violations.some(v => v.includes('engagement baiting'))).toBe(true);
    });
  });

  describe('assessContentRisk', () => {
    it('should assess low-risk content correctly', async () => {
      const content = 'Our AI analytics platform helps businesses make data-driven decisions.';
      const context = {
        platform: 'linkedin',
        industry: 'technology',
        targetAudience: 'business professionals',
      };

      const result = await service.assessContentRisk(content, context);

      expect(result.riskLevel).toBe('low');
      expect(result.riskScore).toBeLessThan(0.3);
      expect(result.factors).toHaveLength(0);
    });

    it('should assess high-risk content correctly', async () => {
      const content = 'Get rich quick! Amazing scam opportunity! Limited time!';
      const context = {
        platform: 'linkedin',
        industry: 'technology',
        targetAudience: 'business professionals',
      };

      const result = await service.assessContentRisk(content, context);

      expect(result.riskLevel).toBe('high');
      expect(result.riskScore).toBeGreaterThan(0.7);
      expect(result.factors.length).toBeGreaterThan(0);
      expect(result.factors.some(f => f.includes('prohibited words'))).toBe(true);
    });

    it('should consider platform context in risk assessment', async () => {
      const content = 'Professional business content with technical terms.';
      const linkedinContext = { platform: 'linkedin', industry: 'technology' };
      const tiktokContext = { platform: 'tiktok', industry: 'technology' };

      const linkedinResult = await service.assessContentRisk(content, linkedinContext);
      const tiktokResult = await service.assessContentRisk(content, tiktokContext);

      expect(linkedinResult.riskScore).toBeLessThan(tiktokResult.riskScore);
    });
  });

  describe('createPolicyViolation', () => {
    it('should create policy violation record', async () => {
      const violationData = {
        postId: 1,
        ruleId: 1,
        type: 'prohibited_words',
        severity: 'high',
        description: 'Content contains prohibited word: scam',
        organizationId: 1,
      };

      const mockViolation = {
        id: 1,
        ...violationData,
        createdAt: new Date(),
      };

      mockPolicyViolationRepo.create.mockReturnValue(mockViolation);
      mockPolicyViolationRepo.save.mockResolvedValue(mockViolation);

      const result = await service.createPolicyViolation(violationData);

      expect(result).toEqual(mockViolation);
      expect(mockPolicyViolationRepo.create).toHaveBeenCalledWith(violationData);
      expect(mockPolicyViolationRepo.save).toHaveBeenCalled();
    });
  });

  describe('getPolicyViolations', () => {
    it('should return policy violations for organization', async () => {
      const organizationId = 1;
      const filters = { severity: 'high', status: 'active' };

      const mockViolations = [
        {
          id: 1,
          type: 'prohibited_words',
          severity: 'high',
          description: 'Content contains prohibited word',
          createdAt: new Date(),
        },
        {
          id: 2,
          type: 'content_length',
          severity: 'medium',
          description: 'Content exceeds length limit',
          createdAt: new Date(),
        },
      ];

      mockPolicyViolationRepo.find.mockResolvedValue(mockViolations);

      const result = await service.getPolicyViolations(organizationId, filters);

      expect(result).toEqual(mockViolations);
      expect(mockPolicyViolationRepo.find).toHaveBeenCalledWith({
        where: { organizationId, ...filters },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('updatePolicyRule', () => {
    it('should update policy rule successfully', async () => {
      const ruleId = 1;
      const updateData = {
        pattern: 'updated_pattern',
        severity: 'medium',
        isActive: false,
      };

      const existingRule = {
        id: 1,
        type: 'prohibited_words',
        pattern: 'old_pattern',
        severity: 'high',
        isActive: true,
      };

      mockPolicyRuleRepo.findOne.mockResolvedValue(existingRule);
      mockPolicyRuleRepo.update.mockResolvedValue({ affected: 1 });

      const result = await service.updatePolicyRule(ruleId, updateData);

      expect(result).toBeDefined();
      expect(mockPolicyRuleRepo.update).toHaveBeenCalledWith(ruleId, updateData);
    });

    it('should throw error for non-existent rule', async () => {
      const ruleId = 999;
      const updateData = { pattern: 'new_pattern' };

      mockPolicyRuleRepo.findOne.mockResolvedValue(null);

      await expect(service.updatePolicyRule(ruleId, updateData)).rejects.toThrow();
    });
  });

  describe('getPolicyAnalytics', () => {
    it('should return policy compliance analytics', async () => {
      const organizationId = 1;
      const timePeriod = '30d';

      const mockAnalytics = {
        totalPosts: 150,
        compliantPosts: 135,
        nonCompliantPosts: 15,
        complianceRate: 0.9,
        violationsByType: {
          prohibited_words: 8,
          content_length: 4,
          brand_guidelines: 3,
        },
        violationsBySeverity: {
          high: 5,
          medium: 7,
          low: 3,
        },
        topViolatedRules: [
          { ruleId: 1, count: 8, type: 'prohibited_words' },
          { ruleId: 2, count: 4, type: 'content_length' },
        ],
      };

      mockPolicyViolationRepo.createQueryBuilder().getRawMany.mockResolvedValue([mockAnalytics]);

      const result = await service.getPolicyAnalytics(organizationId, timePeriod);

      expect(result).toEqual(mockAnalytics);
    });
  });

  describe('validatePolicyRule', () => {
    it('should validate correct policy rule', () => {
      const validRule = {
        type: 'prohibited_words',
        pattern: 'spam|scam|fake',
        severity: 'high',
        isActive: true,
      };

      const result = service.validatePolicyRule(validRule);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid rule type', () => {
      const invalidRule = {
        type: 'invalid_type',
        pattern: 'test',
        severity: 'high',
      };

      const result = service.validatePolicyRule(invalidRule);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid rule type');
    });

    it('should detect invalid severity level', () => {
      const invalidRule = {
        type: 'prohibited_words',
        pattern: 'test',
        severity: 'invalid_severity',
      };

      const result = service.validatePolicyRule(invalidRule);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid severity level');
    });

    it('should validate regex pattern', () => {
      const invalidRule = {
        type: 'prohibited_words',
        pattern: '[invalid-regex',
        severity: 'high',
      };

      const result = service.validatePolicyRule(invalidRule);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid regex pattern');
    });
  });
});
