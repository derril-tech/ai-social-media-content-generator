import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HashtagRankerService } from './hashtag-ranker.service';
import { Hashtag } from './entities/hashtag.entity';
import { Post } from '../posts/entities/post.entity';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';

describe('HashtagRankerService', () => {
  let service: HashtagRankerService;
  let hashtagRepo: Repository<Hashtag>;
  let postRepo: Repository<Post>;
  let httpService: HttpService;

  const mockHashtagRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
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

  const mockPostRepo = {
    find: jest.fn(),
    count: jest.fn(),
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

  const mockHttpService = {
    get: jest.fn(),
    post: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HashtagRankerService,
        {
          provide: getRepositoryToken(Hashtag),
          useValue: mockHashtagRepo,
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

    service = module.get<HashtagRankerService>(HashtagRankerService);
    hashtagRepo = module.get<Repository<Hashtag>>(getRepositoryToken(Hashtag));
    postRepo = module.get<Repository<Post>>(getRepositoryToken(Post));
    httpService = module.get<HttpService>(HttpService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('rankHashtags', () => {
    it('should rank hashtags by relevance and popularity', async () => {
      const hashtags = ['#AI', '#Technology', '#Innovation', '#Business'];
      const context = 'AI-powered analytics platform launch';
      const platform = 'linkedin';

      const mockRankedHashtags = [
        { hashtag: '#AI', score: 0.95, relevance: 0.9, popularity: 0.8 },
        { hashtag: '#Technology', score: 0.85, relevance: 0.8, popularity: 0.7 },
        { hashtag: '#Innovation', score: 0.75, relevance: 0.7, popularity: 0.6 },
        { hashtag: '#Business', score: 0.65, relevance: 0.6, popularity: 0.5 },
      ];

      jest.spyOn(service, 'calculateRelevanceScore').mockResolvedValue(0.8);
      jest.spyOn(service, 'getPopularityScore').mockResolvedValue(0.7);
      jest.spyOn(service, 'getTrendingScore').mockResolvedValue(0.6);

      const result = await service.rankHashtags(hashtags, context, platform);

      expect(result).toHaveLength(hashtags.length);
      expect(result[0].hashtag).toBe('#AI');
      expect(result[0].score).toBeGreaterThan(result[1].score);
    });

    it('should filter out banned hashtags', async () => {
      const hashtags = ['#AI', '#Spam', '#Technology', '#FakeNews'];
      const context = 'AI platform launch';
      const platform = 'linkedin';

      jest.spyOn(service, 'isBannedHashtag').mockImplementation((hashtag) => 
        hashtag === '#Spam' || hashtag === '#FakeNews'
      );

      const result = await service.rankHashtags(hashtags, context, platform);

      expect(result).toHaveLength(2);
      expect(result.map(h => h.hashtag)).toEqual(['#AI', '#Technology']);
    });

    it('should limit results to specified count', async () => {
      const hashtags = ['#AI', '#Technology', '#Innovation', '#Business', '#Data'];
      const context = 'AI platform launch';
      const platform = 'linkedin';
      const limit = 3;

      const result = await service.rankHashtags(hashtags, context, platform, limit);

      expect(result).toHaveLength(limit);
    });
  });

  describe('calculateRelevanceScore', () => {
    it('should calculate high relevance for contextually related hashtags', async () => {
      const hashtag = '#AI';
      const context = 'AI-powered analytics platform for business intelligence';

      const score = await service.calculateRelevanceScore(hashtag, context);

      expect(score).toBeGreaterThan(0.8);
    });

    it('should calculate low relevance for unrelated hashtags', async () => {
      const hashtag = '#Fashion';
      const context = 'AI-powered analytics platform for business intelligence';

      const score = await service.calculateRelevanceScore(hashtag, context);

      expect(score).toBeLessThan(0.3);
    });

    it('should handle empty context', async () => {
      const hashtag = '#AI';
      const context = '';

      const score = await service.calculateRelevanceScore(hashtag, context);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });

  describe('getPopularityScore', () => {
    it('should return popularity score based on usage data', async () => {
      const hashtag = '#AI';
      const platform = 'linkedin';

      const mockUsageData = {
        totalPosts: 10000,
        recentPosts: 500,
        engagementRate: 0.05,
      };

      mockPostRepo.createQueryBuilder().getRawMany.mockResolvedValue([mockUsageData]);

      const score = await service.getPopularityScore(hashtag, platform);

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should handle hashtag with no usage data', async () => {
      const hashtag = '#NewHashtag';
      const platform = 'linkedin';

      mockPostRepo.createQueryBuilder().getRawMany.mockResolvedValue([]);

      const score = await service.getPopularityScore(hashtag, platform);

      expect(score).toBe(0);
    });
  });

  describe('getTrendingScore', () => {
    it('should return trending score for hashtag', async () => {
      const hashtag = '#AI';
      const platform = 'linkedin';

      const mockTrendingData = {
        growthRate: 0.15,
        velocity: 0.08,
        momentum: 0.12,
      };

      mockPostRepo.createQueryBuilder().getRawMany.mockResolvedValue([mockTrendingData]);

      const score = await service.getTrendingScore(hashtag, platform);

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should return zero for non-trending hashtags', async () => {
      const hashtag = '#OldHashtag';
      const platform = 'linkedin';

      mockPostRepo.createQueryBuilder().getRawMany.mockResolvedValue([]);

      const score = await service.getTrendingScore(hashtag, platform);

      expect(score).toBe(0);
    });
  });

  describe('getTrendingHashtags', () => {
    it('should return trending hashtags for platform', async () => {
      const platform = 'linkedin';
      const limit = 10;

      const mockTrendingHashtags = [
        { hashtag: '#AI', growthRate: 0.25, velocity: 0.12 },
        { hashtag: '#Technology', growthRate: 0.18, velocity: 0.09 },
        { hashtag: '#Innovation', growthRate: 0.15, velocity: 0.07 },
      ];

      mockHashtagRepo.createQueryBuilder().getRawMany.mockResolvedValue(mockTrendingHashtags);

      const result = await service.getTrendingHashtags(platform, limit);

      expect(result).toEqual(mockTrendingHashtags);
      expect(mockHashtagRepo.createQueryBuilder).toHaveBeenCalled();
    });

    it('should filter by time period', async () => {
      const platform = 'linkedin';
      const limit = 10;
      const timePeriod = '7d';

      await service.getTrendingHashtags(platform, limit, timePeriod);

      expect(mockHashtagRepo.createQueryBuilder).toHaveBeenCalled();
    });
  });

  describe('suggestHashtags', () => {
    it('should suggest relevant hashtags based on content', async () => {
      const content = 'AI-powered analytics platform for business intelligence';
      const platform = 'linkedin';
      const limit = 5;

      const mockSuggestions = [
        { hashtag: '#AI', score: 0.95 },
        { hashtag: '#Analytics', score: 0.88 },
        { hashtag: '#BusinessIntelligence', score: 0.82 },
        { hashtag: '#DataAnalytics', score: 0.78 },
        { hashtag: '#MachineLearning', score: 0.75 },
      ];

      jest.spyOn(service, 'extractKeywords').mockReturnValue(['AI', 'analytics', 'business', 'intelligence']);
      jest.spyOn(service, 'findRelatedHashtags').mockResolvedValue(mockSuggestions);

      const result = await service.suggestHashtags(content, platform, limit);

      expect(result).toEqual(mockSuggestions);
      expect(result).toHaveLength(limit);
    });

    it('should exclude existing hashtags from suggestions', async () => {
      const content = 'AI-powered analytics platform #AI #Analytics';
      const platform = 'linkedin';
      const limit = 5;

      const mockSuggestions = [
        { hashtag: '#BusinessIntelligence', score: 0.82 },
        { hashtag: '#DataAnalytics', score: 0.78 },
        { hashtag: '#MachineLearning', score: 0.75 },
      ];

      jest.spyOn(service, 'extractKeywords').mockReturnValue(['AI', 'analytics', 'business', 'intelligence']);
      jest.spyOn(service, 'findRelatedHashtags').mockResolvedValue(mockSuggestions);

      const result = await service.suggestHashtags(content, platform, limit);

      expect(result.every(h => !h.hashtag.includes('#AI') && !h.hashtag.includes('#Analytics'))).toBe(true);
    });
  });

  describe('extractKeywords', () => {
    it('should extract meaningful keywords from content', () => {
      const content = 'AI-powered analytics platform for business intelligence and data visualization';

      const keywords = service.extractKeywords(content);

      expect(keywords).toContain('AI');
      expect(keywords).toContain('analytics');
      expect(keywords).toContain('business');
      expect(keywords).toContain('intelligence');
      expect(keywords).toContain('data');
    });

    it('should filter out common stop words', () => {
      const content = 'The AI-powered analytics platform for the business intelligence';

      const keywords = service.extractKeywords(content);

      expect(keywords).not.toContain('the');
      expect(keywords).not.toContain('for');
      expect(keywords).toContain('AI');
      expect(keywords).toContain('analytics');
    });

    it('should handle empty content', () => {
      const content = '';

      const keywords = service.extractKeywords(content);

      expect(keywords).toEqual([]);
    });
  });

  describe('isBannedHashtag', () => {
    it('should return true for banned hashtags', () => {
      const bannedHashtags = ['#Spam', '#FakeNews', '#Clickbait', '#Scam'];

      bannedHashtags.forEach(hashtag => {
        expect(service.isBannedHashtag(hashtag)).toBe(true);
      });
    });

    it('should return false for legitimate hashtags', () => {
      const legitimateHashtags = ['#AI', '#Technology', '#Innovation', '#Business'];

      legitimateHashtags.forEach(hashtag => {
        expect(service.isBannedHashtag(hashtag)).toBe(false);
      });
    });

    it('should be case insensitive', () => {
      expect(service.isBannedHashtag('#SPAM')).toBe(true);
      expect(service.isBannedHashtag('#spam')).toBe(true);
      expect(service.isBannedHashtag('#Spam')).toBe(true);
    });
  });

  describe('getHashtagAnalytics', () => {
    it('should return comprehensive hashtag analytics', async () => {
      const hashtag = '#AI';
      const platform = 'linkedin';
      const timePeriod = '30d';

      const mockAnalytics = {
        usage: {
          totalPosts: 15000,
          recentPosts: 750,
          growthRate: 0.12,
        },
        engagement: {
          avgLikes: 45,
          avgComments: 8,
          avgShares: 12,
          engagementRate: 0.065,
        },
        reach: {
          totalReach: 250000,
          avgReach: 167,
          impressions: 500000,
        },
        trends: {
          velocity: 0.08,
          momentum: 0.15,
          seasonality: 0.03,
        },
      };

      mockPostRepo.createQueryBuilder().getRawMany.mockResolvedValue([mockAnalytics]);

      const result = await service.getHashtagAnalytics(hashtag, platform, timePeriod);

      expect(result).toEqual(mockAnalytics);
    });
  });
});
