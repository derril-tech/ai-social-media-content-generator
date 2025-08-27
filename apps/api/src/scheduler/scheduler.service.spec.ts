import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SchedulerService } from './scheduler.service';
import { ScheduledPost } from './entities/scheduled-post.entity';
import { Post } from '../posts/entities/post.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { User } from '../users/entities/user.entity';
import { CronJob } from 'cron';
import { BadRequestException, ConflictException } from '@nestjs/common';

describe('SchedulerService', () => {
  let service: SchedulerService;
  let scheduledPostRepo: Repository<ScheduledPost>;
  let postRepo: Repository<Post>;
  let organizationRepo: Repository<Organization>;

  const mockScheduledPostRepo = {
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

  const mockPostRepo = {
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockOrganizationRepo = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulerService,
        {
          provide: getRepositoryToken(ScheduledPost),
          useValue: mockScheduledPostRepo,
        },
        {
          provide: getRepositoryToken(Post),
          useValue: mockPostRepo,
        },
        {
          provide: getRepositoryToken(Organization),
          useValue: mockOrganizationRepo,
        },
      ],
    }).compile();

    service = module.get<SchedulerService>(SchedulerService);
    scheduledPostRepo = module.get<Repository<ScheduledPost>>(getRepositoryToken(ScheduledPost));
    postRepo = module.get<Repository<Post>>(getRepositoryToken(Post));
    organizationRepo = module.get<Repository<Organization>>(getRepositoryToken(Organization));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('schedulePost', () => {
    it('should schedule a post successfully', async () => {
      const scheduleData = {
        postId: 1,
        scheduledAt: new Date('2024-12-20T10:00:00Z'),
        platform: 'linkedin',
        organizationId: 1,
        userId: 1,
      };

      const mockScheduledPost = {
        id: 1,
        ...scheduleData,
        status: 'scheduled',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockScheduledPostRepo.create.mockReturnValue(mockScheduledPost);
      mockScheduledPostRepo.save.mockResolvedValue(mockScheduledPost);

      const result = await service.schedulePost(scheduleData);

      expect(result).toEqual(mockScheduledPost);
      expect(mockScheduledPostRepo.create).toHaveBeenCalledWith(scheduleData);
      expect(mockScheduledPostRepo.save).toHaveBeenCalled();
    });

    it('should validate scheduled time is in the future', async () => {
      const scheduleData = {
        postId: 1,
        scheduledAt: new Date('2020-01-01T10:00:00Z'), // Past date
        platform: 'linkedin',
        organizationId: 1,
        userId: 1,
      };

      await expect(service.schedulePost(scheduleData)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should check for scheduling conflicts', async () => {
      const scheduleData = {
        postId: 1,
        scheduledAt: new Date('2024-12-20T10:00:00Z'),
        platform: 'linkedin',
        organizationId: 1,
        userId: 1,
      };

      const existingScheduledPost = {
        id: 2,
        postId: 2,
        scheduledAt: new Date('2024-12-20T10:30:00Z'),
        platform: 'linkedin',
        organizationId: 1,
        status: 'scheduled',
      };

      mockScheduledPostRepo.find.mockResolvedValue([existingScheduledPost]);

      await expect(service.schedulePost(scheduleData)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should allow scheduling when no conflicts exist', async () => {
      const scheduleData = {
        postId: 1,
        scheduledAt: new Date('2024-12-20T10:00:00Z'),
        platform: 'linkedin',
        organizationId: 1,
        userId: 1,
      };

      mockScheduledPostRepo.find.mockResolvedValue([]);
      mockScheduledPostRepo.create.mockReturnValue({ id: 1, ...scheduleData });
      mockScheduledPostRepo.save.mockResolvedValue({ id: 1, ...scheduleData });

      const result = await service.schedulePost(scheduleData);

      expect(result).toBeDefined();
    });
  });

  describe('getOptimalSchedulingTime', () => {
    it('should return optimal time based on platform and audience', async () => {
      const platform = 'linkedin';
      const targetAudience = {
        demographics: {
          age: ['25-45'],
          location: ['United States'],
        },
        behaviors: ['business professionals'],
      };

      const result = await service.getOptimalSchedulingTime(platform, targetAudience);

      expect(result).toBeDefined();
      expect(result.optimalTime).toBeInstanceOf(Date);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should consider timezone in optimal time calculation', async () => {
      const platform = 'linkedin';
      const targetAudience = {
        demographics: {
          age: ['25-45'],
          location: ['United States'],
        },
        behaviors: ['business professionals'],
      };
      const timezone = 'America/New_York';

      const result = await service.getOptimalSchedulingTime(platform, targetAudience, timezone);

      expect(result).toBeDefined();
      expect(result.timezone).toBe(timezone);
    });

    it('should return multiple time slots for different platforms', async () => {
      const platforms = ['linkedin', 'twitter', 'instagram'];
      const targetAudience = {
        demographics: {
          age: ['18-35'],
          location: ['United States'],
        },
        behaviors: ['social media users'],
      };

      const result = await service.getOptimalSchedulingTime(platforms, targetAudience);

      expect(result).toHaveLength(platforms.length);
      result.forEach(timeSlot => {
        expect(timeSlot.platform).toBeDefined();
        expect(timeSlot.optimalTime).toBeInstanceOf(Date);
      });
    });
  });

  describe('reschedulePost', () => {
    it('should reschedule a post successfully', async () => {
      const scheduledPostId = 1;
      const newScheduledAt = new Date('2024-12-21T14:00:00Z');

      const existingScheduledPost = {
        id: 1,
        postId: 1,
        scheduledAt: new Date('2024-12-20T10:00:00Z'),
        platform: 'linkedin',
        organizationId: 1,
        status: 'scheduled',
      };

      mockScheduledPostRepo.findOne.mockResolvedValue(existingScheduledPost);
      mockScheduledPostRepo.update.mockResolvedValue({ affected: 1 });

      const result = await service.reschedulePost(scheduledPostId, newScheduledAt);

      expect(result).toBeDefined();
      expect(mockScheduledPostRepo.update).toHaveBeenCalledWith(
        scheduledPostId,
        { scheduledAt: newScheduledAt },
      );
    });

    it('should throw error for non-existent scheduled post', async () => {
      const scheduledPostId = 999;
      const newScheduledAt = new Date('2024-12-21T14:00:00Z');

      mockScheduledPostRepo.findOne.mockResolvedValue(null);

      await expect(service.reschedulePost(scheduledPostId, newScheduledAt)).rejects.toThrow();
    });

    it('should check for conflicts when rescheduling', async () => {
      const scheduledPostId = 1;
      const newScheduledAt = new Date('2024-12-20T10:30:00Z');

      const existingScheduledPost = {
        id: 1,
        postId: 1,
        scheduledAt: new Date('2024-12-20T10:00:00Z'),
        platform: 'linkedin',
        organizationId: 1,
        status: 'scheduled',
      };

      const conflictingPost = {
        id: 2,
        postId: 2,
        scheduledAt: new Date('2024-12-20T10:30:00Z'),
        platform: 'linkedin',
        organizationId: 1,
        status: 'scheduled',
      };

      mockScheduledPostRepo.findOne.mockResolvedValue(existingScheduledPost);
      mockScheduledPostRepo.find.mockResolvedValue([conflictingPost]);

      await expect(service.reschedulePost(scheduledPostId, newScheduledAt)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('cancelScheduledPost', () => {
    it('should cancel a scheduled post successfully', async () => {
      const scheduledPostId = 1;

      const existingScheduledPost = {
        id: 1,
        postId: 1,
        scheduledAt: new Date('2024-12-20T10:00:00Z'),
        platform: 'linkedin',
        organizationId: 1,
        status: 'scheduled',
      };

      mockScheduledPostRepo.findOne.mockResolvedValue(existingScheduledPost);
      mockScheduledPostRepo.update.mockResolvedValue({ affected: 1 });

      await service.cancelScheduledPost(scheduledPostId);

      expect(mockScheduledPostRepo.update).toHaveBeenCalledWith(
        scheduledPostId,
        { status: 'cancelled' },
      );
    });

    it('should throw error for non-existent scheduled post', async () => {
      const scheduledPostId = 999;

      mockScheduledPostRepo.findOne.mockResolvedValue(null);

      await expect(service.cancelScheduledPost(scheduledPostId)).rejects.toThrow();
    });

    it('should not allow cancelling already published posts', async () => {
      const scheduledPostId = 1;

      const publishedScheduledPost = {
        id: 1,
        postId: 1,
        scheduledAt: new Date('2024-12-20T10:00:00Z'),
        platform: 'linkedin',
        organizationId: 1,
        status: 'published',
      };

      mockScheduledPostRepo.findOne.mockResolvedValue(publishedScheduledPost);

      await expect(service.cancelScheduledPost(scheduledPostId)).rejects.toThrow();
    });
  });

  describe('getScheduledPosts', () => {
    it('should return scheduled posts for organization', async () => {
      const organizationId = 1;
      const filters = { status: 'scheduled', platform: 'linkedin' };

      const mockScheduledPosts = [
        {
          id: 1,
          postId: 1,
          scheduledAt: new Date('2024-12-20T10:00:00Z'),
          platform: 'linkedin',
          status: 'scheduled',
        },
        {
          id: 2,
          postId: 2,
          scheduledAt: new Date('2024-12-21T14:00:00Z'),
          platform: 'linkedin',
          status: 'scheduled',
        },
      ];

      mockScheduledPostRepo.find.mockResolvedValue(mockScheduledPosts);

      const result = await service.getScheduledPosts(organizationId, filters);

      expect(result).toEqual(mockScheduledPosts);
      expect(mockScheduledPostRepo.find).toHaveBeenCalledWith({
        where: { organizationId, ...filters },
        order: { scheduledAt: 'ASC' },
      });
    });

    it('should filter by date range', async () => {
      const organizationId = 1;
      const startDate = new Date('2024-12-20T00:00:00Z');
      const endDate = new Date('2024-12-21T23:59:59Z');

      await service.getScheduledPosts(organizationId, {}, startDate, endDate);

      expect(mockScheduledPostRepo.find).toHaveBeenCalled();
    });
  });

  describe('checkSchedulingConflicts', () => {
    it('should detect scheduling conflicts', async () => {
      const organizationId = 1;
      const platform = 'linkedin';
      const scheduledAt = new Date('2024-12-20T10:00:00Z');
      const excludePostId = 1;

      const conflictingPosts = [
        {
          id: 2,
          postId: 2,
          scheduledAt: new Date('2024-12-20T10:30:00Z'),
          platform: 'linkedin',
          status: 'scheduled',
        },
      ];

      mockScheduledPostRepo.find.mockResolvedValue(conflictingPosts);

      const result = await service.checkSchedulingConflicts(
        organizationId,
        platform,
        scheduledAt,
        excludePostId,
      );

      expect(result.hasConflicts).toBe(true);
      expect(result.conflicts).toHaveLength(1);
    });

    it('should not detect conflicts when posts are far apart', async () => {
      const organizationId = 1;
      const platform = 'linkedin';
      const scheduledAt = new Date('2024-12-20T10:00:00Z');
      const excludePostId = 1;

      const nonConflictingPosts = [
        {
          id: 2,
          postId: 2,
          scheduledAt: new Date('2024-12-20T14:00:00Z'), // 4 hours later
          platform: 'linkedin',
          status: 'scheduled',
        },
      ];

      mockScheduledPostRepo.find.mockResolvedValue(nonConflictingPosts);

      const result = await service.checkSchedulingConflicts(
        organizationId,
        platform,
        scheduledAt,
        excludePostId,
      );

      expect(result.hasConflicts).toBe(false);
      expect(result.conflicts).toHaveLength(0);
    });
  });

  describe('getSchedulingAnalytics', () => {
    it('should return scheduling analytics for organization', async () => {
      const organizationId = 1;
      const timePeriod = '30d';

      const mockAnalytics = {
        totalScheduled: 50,
        totalPublished: 45,
        totalCancelled: 5,
        publishRate: 0.9,
        byPlatform: {
          linkedin: 20,
          twitter: 15,
          instagram: 10,
          facebook: 5,
        },
        byTimeSlot: {
          '9-11am': 15,
          '11am-1pm': 10,
          '1-3pm': 12,
          '3-5pm': 8,
          '5-7pm': 5,
        },
        optimalTimes: [
          { platform: 'linkedin', time: '10:00 AM', engagement: 0.85 },
          { platform: 'twitter', time: '2:00 PM', engagement: 0.78 },
        ],
      };

      mockScheduledPostRepo.createQueryBuilder().getRawMany.mockResolvedValue([mockAnalytics]);

      const result = await service.getSchedulingAnalytics(organizationId, timePeriod);

      expect(result).toEqual(mockAnalytics);
    });
  });

  describe('validateSchedulingTime', () => {
    it('should validate acceptable scheduling time', () => {
      const scheduledAt = new Date('2024-12-20T10:00:00Z');
      const platform = 'linkedin';

      const result = service.validateSchedulingTime(scheduledAt, platform);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject past scheduling times', () => {
      const scheduledAt = new Date('2020-01-01T10:00:00Z');
      const platform = 'linkedin';

      const result = service.validateSchedulingTime(scheduledAt, platform);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Scheduled time must be in the future');
    });

    it('should reject scheduling too far in the future', () => {
      const scheduledAt = new Date('2025-12-20T10:00:00Z'); // 1 year from now
      const platform = 'linkedin';

      const result = service.validateSchedulingTime(scheduledAt, platform);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Scheduled time cannot be more than 6 months in the future');
    });

    it('should validate platform-specific scheduling rules', () => {
      const scheduledAt = new Date('2024-12-20T03:00:00Z'); // 3 AM
      const platform = 'linkedin';

      const result = service.validateSchedulingTime(scheduledAt, platform);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('LinkedIn posts should be scheduled between 8 AM and 6 PM');
    });
  });

  describe('bulkSchedulePosts', () => {
    it('should schedule multiple posts successfully', async () => {
      const bulkScheduleData = [
        {
          postId: 1,
          scheduledAt: new Date('2024-12-20T10:00:00Z'),
          platform: 'linkedin',
        },
        {
          postId: 2,
          scheduledAt: new Date('2024-12-20T14:00:00Z'),
          platform: 'twitter',
        },
      ];
      const organizationId = 1;
      const userId = 1;

      mockScheduledPostRepo.find.mockResolvedValue([]); // No conflicts
      mockScheduledPostRepo.create.mockImplementation((data) => ({ id: Math.random(), ...data }));
      mockScheduledPostRepo.save.mockImplementation((data) => Promise.resolve(data));

      const result = await service.bulkSchedulePosts(bulkScheduleData, organizationId, userId);

      expect(result).toHaveLength(2);
      expect(result.every(post => post.status === 'scheduled')).toBe(true);
    });

    it('should handle conflicts in bulk scheduling', async () => {
      const bulkScheduleData = [
        {
          postId: 1,
          scheduledAt: new Date('2024-12-20T10:00:00Z'),
          platform: 'linkedin',
        },
        {
          postId: 2,
          scheduledAt: new Date('2024-12-20T10:30:00Z'), // Conflicts with first
          platform: 'linkedin',
        },
      ];
      const organizationId = 1;
      const userId = 1;

      mockScheduledPostRepo.find.mockResolvedValue([]); // No existing conflicts
      mockScheduledPostRepo.create.mockImplementation((data) => ({ id: Math.random(), ...data }));
      mockScheduledPostRepo.save.mockImplementation((data) => Promise.resolve(data));

      const result = await service.bulkSchedulePosts(bulkScheduleData, organizationId, userId);

      expect(result).toHaveLength(1); // Only first post should be scheduled
      expect(result[0].postId).toBe(1);
    });
  });
});
