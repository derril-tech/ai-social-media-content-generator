import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UtmBuilderService } from './utm-builder.service';
import { UtmCampaign } from './entities/utm-campaign.entity';
import { UtmClick } from './entities/utm-click.entity';
import { Campaign } from '../campaigns/entities/campaign.entity';
import { Post } from '../posts/entities/post.entity';

describe('UtmBuilderService', () => {
  let service: UtmBuilderService;
  let utmCampaignRepo: Repository<UtmCampaign>;
  let utmClickRepo: Repository<UtmClick>;
  let campaignRepo: Repository<Campaign>;
  let postRepo: Repository<Post>;

  const mockUtmCampaignRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
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

  const mockUtmClickRepo = {
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

  const mockCampaignRepo = {
    findOne: jest.fn(),
  };

  const mockPostRepo = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UtmBuilderService,
        {
          provide: getRepositoryToken(UtmCampaign),
          useValue: mockUtmCampaignRepo,
        },
        {
          provide: getRepositoryToken(UtmClick),
          useValue: mockUtmClickRepo,
        },
        {
          provide: getRepositoryToken(Campaign),
          useValue: mockCampaignRepo,
        },
        {
          provide: getRepositoryToken(Post),
          useValue: mockPostRepo,
        },
      ],
    }).compile();

    service = module.get<UtmBuilderService>(UtmBuilderService);
    utmCampaignRepo = module.get<Repository<UtmCampaign>>(getRepositoryToken(UtmCampaign));
    utmClickRepo = module.get<Repository<UtmClick>>(getRepositoryToken(UtmClick));
    campaignRepo = module.get<Repository<Campaign>>(getRepositoryToken(Campaign));
    postRepo = module.get<Repository<Post>>(getRepositoryToken(Post));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('buildUtmUrl', () => {
    it('should build UTM URL with all parameters', () => {
      const baseUrl = 'https://example.com/product';
      const params = {
        source: 'linkedin',
        medium: 'social',
        campaign: 'q4-launch',
        term: 'ai analytics',
        content: 'banner-ad',
      };

      const result = service.buildUtmUrl(baseUrl, params);

      expect(result).toContain('https://example.com/product');
      expect(result).toContain('utm_source=linkedin');
      expect(result).toContain('utm_medium=social');
      expect(result).toContain('utm_campaign=q4-launch');
      expect(result).toContain('utm_term=ai%20analytics');
      expect(result).toContain('utm_content=banner-ad');
    });

    it('should handle URL with existing query parameters', () => {
      const baseUrl = 'https://example.com/product?existing=param';
      const params = {
        source: 'twitter',
        medium: 'social',
        campaign: 'test-campaign',
      };

      const result = service.buildUtmUrl(baseUrl, params);

      expect(result).toContain('https://example.com/product?existing=param&');
      expect(result).toContain('utm_source=twitter');
      expect(result).toContain('utm_medium=social');
      expect(result).toContain('utm_campaign=test-campaign');
    });

    it('should encode special characters in parameters', () => {
      const baseUrl = 'https://example.com';
      const params = {
        source: 'social media',
        medium: 'email',
        campaign: 'Q4 2024 Launch',
        term: 'AI & ML',
        content: 'banner ad',
      };

      const result = service.buildUtmUrl(baseUrl, params);

      expect(result).toContain('utm_source=social%20media');
      expect(result).toContain('utm_campaign=Q4%202024%20Launch');
      expect(result).toContain('utm_term=AI%20%26%20ML');
      expect(result).toContain('utm_content=banner%20ad');
    });

    it('should handle empty or undefined parameters', () => {
      const baseUrl = 'https://example.com';
      const params = {
        source: 'linkedin',
        medium: 'social',
        campaign: 'test',
        term: '',
        content: undefined,
      };

      const result = service.buildUtmUrl(baseUrl, params);

      expect(result).toContain('utm_source=linkedin');
      expect(result).toContain('utm_medium=social');
      expect(result).toContain('utm_campaign=test');
      expect(result).not.toContain('utm_term=');
      expect(result).not.toContain('utm_content=');
    });
  });

  describe('createUtmCampaign', () => {
    it('should create UTM campaign with valid data', async () => {
      const createUtmCampaignDto = {
        name: 'Q4 Product Launch',
        source: 'linkedin',
        medium: 'social',
        campaign: 'q4-launch-2024',
        organizationId: 1,
        campaignId: 1,
      };

      const mockUtmCampaign = {
        id: 1,
        ...createUtmCampaignDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUtmCampaignRepo.create.mockReturnValue(mockUtmCampaign);
      mockUtmCampaignRepo.save.mockResolvedValue(mockUtmCampaign);

      const result = await service.createUtmCampaign(createUtmCampaignDto);

      expect(result).toEqual(mockUtmCampaign);
      expect(mockUtmCampaignRepo.create).toHaveBeenCalledWith(createUtmCampaignDto);
      expect(mockUtmCampaignRepo.save).toHaveBeenCalled();
    });

    it('should validate required fields', async () => {
      const invalidDto = {
        name: '',
        source: 'linkedin',
        medium: '',
        campaign: 'test',
        organizationId: 1,
      };

      await expect(service.createUtmCampaign(invalidDto)).rejects.toThrow();
    });

    it('should validate source and medium values', async () => {
      const invalidDto = {
        name: 'Test Campaign',
        source: 'invalid-source',
        medium: 'invalid-medium',
        campaign: 'test',
        organizationId: 1,
      };

      await expect(service.createUtmCampaign(invalidDto)).rejects.toThrow();
    });
  });

  describe('generateUtmForPost', () => {
    it('should generate UTM parameters for a post', async () => {
      const postId = 1;
      const mockPost = {
        id: 1,
        platform: 'linkedin',
        campaignId: 1,
        brandId: 1,
        organizationId: 1,
      };

      const mockCampaign = {
        id: 1,
        name: 'Q4 Launch Campaign',
        slug: 'q4-launch-2024',
      };

      const mockUtmCampaign = {
        id: 1,
        source: 'linkedin',
        medium: 'social',
        campaign: 'q4-launch-2024',
      };

      mockPostRepo.findOne.mockResolvedValue(mockPost);
      mockCampaignRepo.findOne.mockResolvedValue(mockCampaign);
      mockUtmCampaignRepo.findOne.mockResolvedValue(mockUtmCampaign);

      const result = await service.generateUtmForPost(postId);

      expect(result).toBeDefined();
      expect(result.source).toBe('linkedin');
      expect(result.medium).toBe('social');
      expect(result.campaign).toBe('q4-launch-2024');
    });

    it('should create new UTM campaign if none exists', async () => {
      const postId = 1;
      const mockPost = {
        id: 1,
        platform: 'twitter',
        campaignId: 1,
        brandId: 1,
        organizationId: 1,
      };

      const mockCampaign = {
        id: 1,
        name: 'Test Campaign',
        slug: 'test-campaign',
      };

      mockPostRepo.findOne.mockResolvedValue(mockPost);
      mockCampaignRepo.findOne.mockResolvedValue(mockCampaign);
      mockUtmCampaignRepo.findOne.mockResolvedValue(null);

      const mockNewUtmCampaign = {
        id: 1,
        source: 'twitter',
        medium: 'social',
        campaign: 'test-campaign',
      };

      mockUtmCampaignRepo.create.mockReturnValue(mockNewUtmCampaign);
      mockUtmCampaignRepo.save.mockResolvedValue(mockNewUtmCampaign);

      const result = await service.generateUtmForPost(postId);

      expect(result).toBeDefined();
      expect(mockUtmCampaignRepo.create).toHaveBeenCalled();
      expect(mockUtmCampaignRepo.save).toHaveBeenCalled();
    });
  });

  describe('trackClick', () => {
    it('should track UTM click with all parameters', async () => {
      const clickData = {
        utmSource: 'linkedin',
        utmMedium: 'social',
        utmCampaign: 'q4-launch',
        utmTerm: 'ai analytics',
        utmContent: 'banner-ad',
        url: 'https://example.com/product',
        referrer: 'https://linkedin.com',
        userAgent: 'Mozilla/5.0...',
        ipAddress: '192.168.1.1',
        organizationId: 1,
      };

      const mockUtmClick = {
        id: 1,
        ...clickData,
        createdAt: new Date(),
      };

      mockUtmClickRepo.create.mockReturnValue(mockUtmClick);
      mockUtmClickRepo.save.mockResolvedValue(mockUtmClick);

      const result = await service.trackClick(clickData);

      expect(result).toEqual(mockUtmClick);
      expect(mockUtmClickRepo.create).toHaveBeenCalledWith(clickData);
      expect(mockUtmClickRepo.save).toHaveBeenCalled();
    });

    it('should handle missing optional parameters', async () => {
      const clickData = {
        utmSource: 'twitter',
        utmMedium: 'social',
        utmCampaign: 'test-campaign',
        url: 'https://example.com',
        organizationId: 1,
      };

      const mockUtmClick = {
        id: 1,
        ...clickData,
        createdAt: new Date(),
      };

      mockUtmClickRepo.create.mockReturnValue(mockUtmClick);
      mockUtmClickRepo.save.mockResolvedValue(mockUtmClick);

      const result = await service.trackClick(clickData);

      expect(result).toBeDefined();
      expect(result.utmSource).toBe('twitter');
    });
  });

  describe('getUtmAnalytics', () => {
    it('should return UTM analytics for organization', async () => {
      const organizationId = 1;
      const timePeriod = '30d';

      const mockAnalytics = {
        totalClicks: 1500,
        uniqueClicks: 1200,
        conversionRate: 0.08,
        bySource: {
          linkedin: 600,
          twitter: 400,
          facebook: 300,
          email: 200,
        },
        byCampaign: {
          'q4-launch': 800,
          'holiday-sale': 400,
          'brand-awareness': 300,
        },
        byMedium: {
          social: 1300,
          email: 200,
        },
        topPerformingUrls: [
          { url: 'https://example.com/product1', clicks: 300 },
          { url: 'https://example.com/product2', clicks: 250 },
        ],
      };

      mockUtmClickRepo.createQueryBuilder().getRawMany.mockResolvedValue([mockAnalytics]);

      const result = await service.getUtmAnalytics(organizationId, timePeriod);

      expect(result).toEqual(mockAnalytics);
    });

    it('should filter by date range', async () => {
      const organizationId = 1;
      const timePeriod = '7d';

      await service.getUtmAnalytics(organizationId, timePeriod);

      expect(mockUtmClickRepo.createQueryBuilder).toHaveBeenCalled();
    });
  });

  describe('getCampaignPerformance', () => {
    it('should return campaign performance metrics', async () => {
      const campaignId = 1;
      const timePeriod = '30d';

      const mockPerformance = {
        campaignName: 'Q4 Launch Campaign',
        totalClicks: 800,
        uniqueClicks: 650,
        conversionRate: 0.12,
        revenue: 15000,
        costPerClick: 2.5,
        roi: 3.2,
        bySource: {
          linkedin: 400,
          twitter: 250,
          facebook: 150,
        },
        byContent: {
          'banner-ad': 300,
          'text-post': 250,
          'video-ad': 250,
        },
        dailyClicks: [
          { date: '2024-12-01', clicks: 45 },
          { date: '2024-12-02', clicks: 52 },
        ],
      };

      mockUtmClickRepo.createQueryBuilder().getRawMany.mockResolvedValue([mockPerformance]);

      const result = await service.getCampaignPerformance(campaignId, timePeriod);

      expect(result).toEqual(mockPerformance);
    });
  });

  describe('validateUtmParameters', () => {
    it('should validate correct UTM parameters', () => {
      const validParams = {
        source: 'linkedin',
        medium: 'social',
        campaign: 'q4-launch-2024',
        term: 'ai analytics',
        content: 'banner-ad',
      };

      const result = service.validateUtmParameters(validParams);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid source', () => {
      const invalidParams = {
        source: 'invalid-source',
        medium: 'social',
        campaign: 'test',
      };

      const result = service.validateUtmParameters(invalidParams);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid UTM source');
    });

    it('should detect invalid medium', () => {
      const invalidParams = {
        source: 'linkedin',
        medium: 'invalid-medium',
        campaign: 'test',
      };

      const result = service.validateUtmParameters(invalidParams);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid UTM medium');
    });

    it('should detect missing required parameters', () => {
      const invalidParams = {
        source: 'linkedin',
        // missing medium and campaign
      };

      const result = service.validateUtmParameters(invalidParams);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('UTM medium is required');
      expect(result.errors).toContain('UTM campaign is required');
    });

    it('should validate parameter length limits', () => {
      const invalidParams = {
        source: 'linkedin',
        medium: 'social',
        campaign: 'a'.repeat(101), // Exceeds 100 character limit
        term: 'b'.repeat(201), // Exceeds 200 character limit
      };

      const result = service.validateUtmParameters(invalidParams);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('UTM campaign exceeds maximum length');
      expect(result.errors).toContain('UTM term exceeds maximum length');
    });
  });

  describe('generateShortUrl', () => {
    it('should generate short URL for UTM link', async () => {
      const longUrl = 'https://example.com/product?utm_source=linkedin&utm_medium=social&utm_campaign=q4-launch';
      const organizationId = 1;

      const mockShortUrl = {
        id: 1,
        originalUrl: longUrl,
        shortCode: 'abc123',
        shortUrl: 'https://short.example.com/abc123',
        organizationId: 1,
        createdAt: new Date(),
      };

      // Mock the short URL generation logic
      jest.spyOn(service, 'generateShortCode').mockReturnValue('abc123');

      const result = await service.generateShortUrl(longUrl, organizationId);

      expect(result).toBeDefined();
      expect(result.shortCode).toBe('abc123');
      expect(result.shortUrl).toContain('abc123');
    });

    it('should handle URL encoding properly', async () => {
      const longUrl = 'https://example.com/product?utm_source=social media&utm_campaign=Q4 2024';
      const organizationId = 1;

      const result = await service.generateShortUrl(longUrl, organizationId);

      expect(result).toBeDefined();
      expect(result.originalUrl).toBe(longUrl);
    });
  });

  describe('getTopPerformingUtmParams', () => {
    it('should return top performing UTM parameters', async () => {
      const organizationId = 1;
      const limit = 10;

      const mockTopParams = [
        { source: 'linkedin', medium: 'social', campaign: 'q4-launch', clicks: 800, conversionRate: 0.12 },
        { source: 'twitter', medium: 'social', campaign: 'brand-awareness', clicks: 600, conversionRate: 0.08 },
        { source: 'email', medium: 'email', campaign: 'newsletter', clicks: 400, conversionRate: 0.15 },
      ];

      mockUtmClickRepo.createQueryBuilder().getRawMany.mockResolvedValue(mockTopParams);

      const result = await service.getTopPerformingUtmParams(organizationId, limit);

      expect(result).toEqual(mockTopParams);
      expect(result).toHaveLength(3);
    });
  });
});
