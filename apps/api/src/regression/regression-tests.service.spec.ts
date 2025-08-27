import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegressionTestsService } from './regression-tests.service';
import { Post } from '../posts/entities/post.entity';
import { Brand } from '../brands/entities/brand.entity';
import { Brief } from '../briefs/entities/brief.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/entities/user.entity';
import { PostStatus } from '../posts/entities/post.entity';
import { Platform } from '../shared/enums/platform.enum';

describe('RegressionTestsService', () => {
  let service: RegressionTestsService;
  let postRepo: Repository<Post>;
  let brandRepo: Repository<Brand>;
  let briefRepo: Repository<Brief>;

  const mockPostRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
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

  const mockBrandRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockBriefRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
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
        RegressionTestsService,
        {
          provide: getRepositoryToken(Post),
          useValue: mockPostRepo,
        },
        {
          provide: getRepositoryToken(Brand),
          useValue: mockBrandRepo,
        },
        {
          provide: getRepositoryToken(Brief),
          useValue: mockBriefRepo,
        },
      ],
    }).compile();

    service = module.get<RegressionTestsService>(RegressionTestsService);
    postRepo = module.get<Repository<Post>>(getRepositoryToken(Post));
    brandRepo = module.get<Repository<Brand>>(getRepositoryToken(Brand));
    briefRepo = module.get<Repository<Brief>>(getRepositoryToken(Brief));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('testVoiceAdherence', () => {
    it('should test voice adherence across multiple posts', async () => {
      const brandGuidelines = {
        tone: 'Professional and innovative',
        voice: 'Innovative, reliable, customer-focused',
        do: ['Use technical terms appropriately', 'Focus on business benefits'],
        dont: ['Use overly casual language', 'Make unrealistic promises'],
      };

      const testPosts = [
        {
          id: 1,
          content: 'Our AI-powered analytics platform transforms business intelligence.',
          platform: Platform.LINKEDIN,
          scores: { brandFit: 0.95, readability: 0.88, policyRisk: 0.02 },
        },
        {
          id: 2,
          content: 'OMG! Our totally amazing AI thingy will make you rich overnight!',
          platform: Platform.LINKEDIN,
          scores: { brandFit: 0.35, readability: 0.72, policyRisk: 0.85 },
        },
        {
          id: 3,
          content: 'Transform your business with our innovative AI analytics solution.',
          platform: Platform.LINKEDIN,
          scores: { brandFit: 0.92, readability: 0.85, policyRisk: 0.05 },
        },
      ];

      mockPostRepo.find.mockResolvedValue(testPosts);

      const result = await service.testVoiceAdherence(1, brandGuidelines);

      expect(result.totalPosts).toBe(3);
      expect(result.compliantPosts).toBe(2);
      expect(result.nonCompliantPosts).toBe(1);
      expect(result.complianceRate).toBeCloseTo(0.67, 2);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].postId).toBe(2);
      expect(result.violations[0].issues).toContain('casual language');
      expect(result.violations[0].issues).toContain('unrealistic promises');
    });

    it('should test voice consistency across platforms', async () => {
      const brandGuidelines = {
        tone: 'Professional and innovative',
        voice: 'Innovative, reliable, customer-focused',
        do: ['Use technical terms appropriately', 'Focus on business benefits'],
        dont: ['Use overly casual language', 'Make unrealistic promises'],
      };

      const crossPlatformPosts = [
        {
          id: 1,
          content: 'Our AI analytics platform helps businesses make data-driven decisions.',
          platform: Platform.LINKEDIN,
          scores: { brandFit: 0.95 },
        },
        {
          id: 2,
          content: 'AI analytics = better business decisions! 🚀',
          platform: Platform.TWITTER,
          scores: { brandFit: 0.75 },
        },
        {
          id: 3,
          content: 'Transform your business with AI-powered analytics.',
          platform: Platform.INSTAGRAM,
          scores: { brandFit: 0.88 },
        },
      ];

      mockPostRepo.find.mockResolvedValue(crossPlatformPosts);

      const result = await service.testVoiceAdherence(1, brandGuidelines);

      expect(result.platformConsistency).toBeDefined();
      expect(result.platformConsistency.linkedin).toBeGreaterThan(0.9);
      expect(result.platformConsistency.twitter).toBeLessThan(0.8);
      expect(result.platformConsistency.instagram).toBeGreaterThan(0.8);
    });

    it('should test voice adherence over time', async () => {
      const brandGuidelines = {
        tone: 'Professional and innovative',
        voice: 'Innovative, reliable, customer-focused',
        do: ['Use technical terms appropriately', 'Focus on business benefits'],
        dont: ['Use overly casual language', 'Make unrealistic promises'],
      };

      const timeSeriesPosts = [
        {
          id: 1,
          content: 'Our AI platform transforms business intelligence.',
          createdAt: new Date('2024-01-01'),
          scores: { brandFit: 0.95 },
        },
        {
          id: 2,
          content: 'AI platform = business transformation!',
          createdAt: new Date('2024-02-01'),
          scores: { brandFit: 0.75 },
        },
        {
          id: 3,
          content: 'Our innovative AI solution drives business success.',
          createdAt: new Date('2024-03-01'),
          scores: { brandFit: 0.92 },
        },
      ];

      mockPostRepo.find.mockResolvedValue(timeSeriesPosts);

      const result = await service.testVoiceAdherence(1, brandGuidelines);

      expect(result.timeSeriesAnalysis).toBeDefined();
      expect(result.timeSeriesAnalysis.trend).toBeDefined();
      expect(result.timeSeriesAnalysis.volatility).toBeDefined();
      expect(result.timeSeriesAnalysis.regression).toBeDefined();
    });
  });

  describe('testForbiddenPhrasePacks', () => {
    it('should test forbidden phrase detection', async () => {
      const forbiddenPhrases = [
        'get rich quick',
        'limited time offer',
        'act now',
        'amazing opportunity',
        'make money fast',
        'guaranteed results',
        '100% free',
        'no risk',
        'exclusive deal',
        'secret method',
      ];

      const testPosts = [
        {
          id: 1,
          content: 'Our AI platform helps businesses make better decisions.',
          platform: Platform.LINKEDIN,
          scores: { policyRisk: 0.02 },
        },
        {
          id: 2,
          content: 'Get rich quick with our amazing opportunity! Limited time offer!',
          platform: Platform.LINKEDIN,
          scores: { policyRisk: 0.95 },
        },
        {
          id: 3,
          content: 'Transform your business with our innovative AI solution.',
          platform: Platform.LINKEDIN,
          scores: { policyRisk: 0.05 },
        },
      ];

      mockPostRepo.find.mockResolvedValue(testPosts);

      const result = await service.testForbiddenPhrasePacks(1, forbiddenPhrases);

      expect(result.totalPosts).toBe(3);
      expect(result.cleanPosts).toBe(2);
      expect(result.violatingPosts).toBe(1);
      expect(result.violationRate).toBeCloseTo(0.33, 2);
      expect(result.detectedPhrases).toContain('get rich quick');
      expect(result.detectedPhrases).toContain('amazing opportunity');
      expect(result.detectedPhrases).toContain('limited time offer');
    });

    it('should test phrase pack variations', async () => {
      const forbiddenPhrases = [
        'get rich quick',
        'get rich fast',
        'make money quick',
        'make money fast',
        'become wealthy overnight',
        'instant wealth',
      ];

      const testPosts = [
        {
          id: 1,
          content: 'Get rich fast with our amazing system!',
          platform: Platform.LINKEDIN,
          scores: { policyRisk: 0.9 },
        },
        {
          id: 2,
          content: 'Make money quick with our secret method!',
          platform: Platform.LINKEDIN,
          scores: { policyRisk: 0.85 },
        },
        {
          id: 3,
          content: 'Become wealthy overnight with our exclusive program!',
          platform: Platform.LINKEDIN,
          scores: { policyRisk: 0.95 },
        },
      ];

      mockPostRepo.find.mockResolvedValue(testPosts);

      const result = await service.testForbiddenPhrasePacks(1, forbiddenPhrases);

      expect(result.violatingPosts).toBe(3);
      expect(result.violationRate).toBe(1.0);
      expect(result.detectedPhrases).toContain('get rich fast');
      expect(result.detectedPhrases).toContain('make money quick');
      expect(result.detectedPhrases).toContain('become wealthy overnight');
    });

    it('should test phrase detection sensitivity', async () => {
      const forbiddenPhrases = ['spam', 'scam', 'fake'];

      const testPosts = [
        {
          id: 1,
          content: 'This is not a spam message about our legitimate product.',
          platform: Platform.LINKEDIN,
          scores: { policyRisk: 0.3 },
        },
        {
          id: 2,
          content: 'Our product is definitely not a scam.',
          platform: Platform.LINKEDIN,
          scores: { policyRisk: 0.4 },
        },
        {
          id: 3,
          content: 'This is a legitimate offer, not fake.',
          platform: Platform.LINKEDIN,
          scores: { policyRisk: 0.25 },
        },
      ];

      mockPostRepo.find.mockResolvedValue(testPosts);

      const result = await service.testForbiddenPhrasePacks(1, forbiddenPhrases);

      expect(result.falsePositives).toBeDefined();
      expect(result.falsePositives.length).toBeGreaterThan(0);
      expect(result.trueNegatives).toBeDefined();
      expect(result.accuracy).toBeDefined();
    });
  });

  describe('testMultiLingualOutputs', () => {
    it('should test multi-lingual content generation', async () => {
      const testPosts = [
        {
          id: 1,
          content: 'Our AI platform helps businesses make better decisions.',
          language: 'en',
          platform: Platform.LINKEDIN,
          scores: { readability: 0.88, brandFit: 0.92 },
        },
        {
          id: 2,
          content: 'Notre plateforme IA aide les entreprises à prendre de meilleures décisions.',
          language: 'fr',
          platform: Platform.LINKEDIN,
          scores: { readability: 0.85, brandFit: 0.89 },
        },
        {
          id: 3,
          content: 'Unsere KI-Plattform hilft Unternehmen, bessere Entscheidungen zu treffen.',
          language: 'de',
          platform: Platform.LINKEDIN,
          scores: { readability: 0.87, brandFit: 0.91 },
        },
        {
          id: 4,
          content: 'Nuestra plataforma de IA ayuda a las empresas a tomar mejores decisiones.',
          language: 'es',
          platform: Platform.LINKEDIN,
          scores: { readability: 0.86, brandFit: 0.90 },
        },
      ];

      mockPostRepo.find.mockResolvedValue(testPosts);

      const result = await service.testMultiLingualOutputs(1);

      expect(result.totalLanguages).toBe(4);
      expect(result.languages).toContain('en');
      expect(result.languages).toContain('fr');
      expect(result.languages).toContain('de');
      expect(result.languages).toContain('es');
      expect(result.averageReadability).toBeCloseTo(0.87, 2);
      expect(result.averageBrandFit).toBeCloseTo(0.91, 2);
    });

    it('should test language-specific quality metrics', async () => {
      const testPosts = [
        {
          id: 1,
          content: 'Our AI platform transforms business intelligence.',
          language: 'en',
          platform: Platform.LINKEDIN,
          scores: { readability: 0.88, brandFit: 0.92, grammar: 0.95 },
        },
        {
          id: 2,
          content: 'Notre plateforme IA transforme l\'intelligence d\'affaires.',
          language: 'fr',
          platform: Platform.LINKEDIN,
          scores: { readability: 0.85, brandFit: 0.89, grammar: 0.92 },
        },
        {
          id: 3,
          content: 'Unsere KI-Plattform transformiert Business Intelligence.',
          language: 'de',
          platform: Platform.LINKEDIN,
          scores: { readability: 0.87, brandFit: 0.91, grammar: 0.94 },
        },
      ];

      mockPostRepo.find.mockResolvedValue(testPosts);

      const result = await service.testMultiLingualOutputs(1);

      expect(result.languageQuality).toBeDefined();
      expect(result.languageQuality.en.readability).toBeCloseTo(0.88, 2);
      expect(result.languageQuality.fr.readability).toBeCloseTo(0.85, 2);
      expect(result.languageQuality.de.readability).toBeCloseTo(0.87, 2);
      expect(result.languageQuality.en.grammar).toBeCloseTo(0.95, 2);
    });

    it('should test cultural adaptation', async () => {
      const testPosts = [
        {
          id: 1,
          content: 'Our AI platform helps businesses make better decisions.',
          language: 'en',
          region: 'US',
          platform: Platform.LINKEDIN,
          scores: { culturalFit: 0.92 },
        },
        {
          id: 2,
          content: 'Notre plateforme IA aide les entreprises à prendre de meilleures décisions.',
          language: 'fr',
          region: 'FR',
          platform: Platform.LINKEDIN,
          scores: { culturalFit: 0.88 },
        },
        {
          id: 3,
          content: 'Unsere KI-Plattform hilft Unternehmen, bessere Entscheidungen zu treffen.',
          language: 'de',
          region: 'DE',
          platform: Platform.LINKEDIN,
          scores: { culturalFit: 0.90 },
        },
      ];

      mockPostRepo.find.mockResolvedValue(testPosts);

      const result = await service.testMultiLingualOutputs(1);

      expect(result.culturalAdaptation).toBeDefined();
      expect(result.culturalAdaptation.US).toBeCloseTo(0.92, 2);
      expect(result.culturalAdaptation.FR).toBeCloseTo(0.88, 2);
      expect(result.culturalAdaptation.DE).toBeCloseTo(0.90, 2);
      expect(result.averageCulturalFit).toBeCloseTo(0.90, 2);
    });

    it('should test translation consistency', async () => {
      const testPosts = [
        {
          id: 1,
          content: 'Our AI platform helps businesses make better decisions.',
          language: 'en',
          originalPostId: null,
          platform: Platform.LINKEDIN,
          scores: { translationAccuracy: 1.0 },
        },
        {
          id: 2,
          content: 'Notre plateforme IA aide les entreprises à prendre de meilleures décisions.',
          language: 'fr',
          originalPostId: 1,
          platform: Platform.LINKEDIN,
          scores: { translationAccuracy: 0.95 },
        },
        {
          id: 3,
          content: 'Unsere KI-Plattform hilft Unternehmen, bessere Entscheidungen zu treffen.',
          language: 'de',
          originalPostId: 1,
          platform: Platform.LINKEDIN,
          scores: { translationAccuracy: 0.93 },
        },
      ];

      mockPostRepo.find.mockResolvedValue(testPosts);

      const result = await service.testMultiLingualOutputs(1);

      expect(result.translationConsistency).toBeDefined();
      expect(result.translationConsistency.averageAccuracy).toBeCloseTo(0.94, 2);
      expect(result.translationConsistency.variance).toBeDefined();
      expect(result.translationConsistency.languagePairs).toBeDefined();
    });
  });

  describe('runFullRegressionSuite', () => {
    it('should run complete regression test suite', async () => {
      const brandGuidelines = {
        tone: 'Professional and innovative',
        voice: 'Innovative, reliable, customer-focused',
        do: ['Use technical terms appropriately', 'Focus on business benefits'],
        dont: ['Use overly casual language', 'Make unrealistic promises'],
      };

      const forbiddenPhrases = [
        'get rich quick',
        'limited time offer',
        'amazing opportunity',
        'make money fast',
      ];

      const mockPosts = [
        {
          id: 1,
          content: 'Our AI platform helps businesses make better decisions.',
          language: 'en',
          platform: Platform.LINKEDIN,
          scores: { brandFit: 0.95, readability: 0.88, policyRisk: 0.02 },
        },
        {
          id: 2,
          content: 'Get rich quick with our amazing opportunity!',
          language: 'en',
          platform: Platform.LINKEDIN,
          scores: { brandFit: 0.35, readability: 0.72, policyRisk: 0.95 },
        },
        {
          id: 3,
          content: 'Notre plateforme IA aide les entreprises à prendre de meilleures décisions.',
          language: 'fr',
          platform: Platform.LINKEDIN,
          scores: { brandFit: 0.89, readability: 0.85, policyRisk: 0.05 },
        },
      ];

      mockPostRepo.find.mockResolvedValue(mockPosts);

      const result = await service.runFullRegressionSuite(1, brandGuidelines, forbiddenPhrases);

      expect(result.voiceAdherence).toBeDefined();
      expect(result.forbiddenPhrasePacks).toBeDefined();
      expect(result.multiLingualOutputs).toBeDefined();
      expect(result.overallScore).toBeDefined();
      expect(result.passed).toBeDefined();
      expect(result.failed).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });

    it('should generate regression report', async () => {
      const brandGuidelines = {
        tone: 'Professional and innovative',
        voice: 'Innovative, reliable, customer-focused',
        do: ['Use technical terms appropriately'],
        dont: ['Use overly casual language'],
      };

      const forbiddenPhrases = ['get rich quick', 'amazing opportunity'];

      const mockPosts = [
        {
          id: 1,
          content: 'Our AI platform helps businesses make better decisions.',
          language: 'en',
          platform: Platform.LINKEDIN,
          scores: { brandFit: 0.95, readability: 0.88, policyRisk: 0.02 },
        },
      ];

      mockPostRepo.find.mockResolvedValue(mockPosts);

      const result = await service.runFullRegressionSuite(1, brandGuidelines, forbiddenPhrases);

      expect(result.report).toBeDefined();
      expect(result.report.summary).toBeDefined();
      expect(result.report.details).toBeDefined();
      expect(result.report.recommendations).toBeDefined();
      expect(result.report.timestamp).toBeDefined();
      expect(result.report.version).toBeDefined();
    });
  });

  describe('testHistoricalConsistency', () => {
    it('should test consistency over time periods', async () => {
      const timePeriods = [
        { start: new Date('2024-01-01'), end: new Date('2024-01-31') },
        { start: new Date('2024-02-01'), end: new Date('2024-02-29') },
        { start: new Date('2024-03-01'), end: new Date('2024-03-31') },
      ];

      const mockHistoricalData = [
        {
          period: '2024-01',
          averageBrandFit: 0.92,
          averageReadability: 0.88,
          averagePolicyRisk: 0.05,
          postCount: 50,
        },
        {
          period: '2024-02',
          averageBrandFit: 0.89,
          averageReadability: 0.85,
          averagePolicyRisk: 0.08,
          postCount: 45,
        },
        {
          period: '2024-03',
          averageBrandFit: 0.94,
          averageReadability: 0.90,
          averagePolicyRisk: 0.03,
          postCount: 55,
        },
      ];

      mockPostRepo.createQueryBuilder().getRawMany.mockResolvedValue(mockHistoricalData);

      const result = await service.testHistoricalConsistency(1, timePeriods);

      expect(result.trends).toBeDefined();
      expect(result.volatility).toBeDefined();
      expect(result.regression).toBeDefined();
      expect(result.anomalies).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });
  });
});
