import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TemplatesService } from './templates.service';
import { Template } from './entities/template.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/entities/user.entity';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

describe('TemplatesService', () => {
  let service: TemplatesService;
  let templateRepo: Repository<Template>;
  let organizationRepo: Repository<Organization>;

  const mockTemplateRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  };

  const mockOrganizationRepo = {
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

  const mockOrganization: Organization = {
    id: 1,
    name: 'Test Org',
    slug: 'test-org',
    description: 'Test organization',
    website: 'https://test.com',
    industry: 'Technology',
    size: '10-50',
    isActive: true,
    settings: {
      timezone: 'UTC',
      dateFormat: 'YYYY-MM-DD',
      currency: 'USD',
      language: 'en',
    },
    subscription: {
      plan: 'pro',
      status: 'active',
      limits: {
        templates: 50,
        posts: 1000,
        users: 10,
      },
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplatesService,
        {
          provide: getRepositoryToken(Template),
          useValue: mockTemplateRepo,
        },
        {
          provide: getRepositoryToken(Organization),
          useValue: mockOrganizationRepo,
        },
      ],
    }).compile();

    service = module.get<TemplatesService>(TemplatesService);
    templateRepo = module.get<Repository<Template>>(getRepositoryToken(Template));
    organizationRepo = module.get<Repository<Organization>>(getRepositoryToken(Organization));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a template when under limit', async () => {
      const createTemplateDto = {
        name: 'Test Template',
        description: 'Test description',
        content: 'Test content',
        platform: 'linkedin',
        category: 'general',
      };

      mockOrganizationRepo.findOne.mockResolvedValue(mockOrganization);
      mockTemplateRepo.count.mockResolvedValue(25); // Under limit
      mockTemplateRepo.create.mockReturnValue({ ...createTemplateDto, id: 1 });
      mockTemplateRepo.save.mockResolvedValue({ ...createTemplateDto, id: 1 });

      const result = await service.create(createTemplateDto, mockUser);

      expect(result).toBeDefined();
      expect(mockTemplateRepo.create).toHaveBeenCalledWith({
        ...createTemplateDto,
        organizationId: mockUser.organizationId,
        createdBy: mockUser.id,
      });
      expect(mockTemplateRepo.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException when template limit exceeded', async () => {
      const createTemplateDto = {
        name: 'Test Template',
        description: 'Test description',
        content: 'Test content',
        platform: 'linkedin',
        category: 'general',
      };

      mockOrganizationRepo.findOne.mockResolvedValue(mockOrganization);
      mockTemplateRepo.count.mockResolvedValue(50); // At limit

      await expect(service.create(createTemplateDto, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should validate template content length', async () => {
      const createTemplateDto = {
        name: 'Test Template',
        description: 'Test description',
        content: 'a'.repeat(3001), // Exceeds 3000 character limit
        platform: 'linkedin',
        category: 'general',
      };

      await expect(service.create(createTemplateDto, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should validate platform is supported', async () => {
      const createTemplateDto = {
        name: 'Test Template',
        description: 'Test description',
        content: 'Test content',
        platform: 'unsupported-platform',
        category: 'general',
      };

      await expect(service.create(createTemplateDto, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return templates for organization', async () => {
      const mockTemplates = [
        { id: 1, name: 'Template 1' },
        { id: 2, name: 'Template 2' },
      ];

      mockTemplateRepo.find.mockResolvedValue(mockTemplates);

      const result = await service.findAll(mockUser);

      expect(result).toEqual(mockTemplates);
      expect(mockTemplateRepo.find).toHaveBeenCalledWith({
        where: { organizationId: mockUser.organizationId },
        order: { createdAt: 'DESC' },
      });
    });

    it('should filter by platform when provided', async () => {
      const mockTemplates = [{ id: 1, name: 'LinkedIn Template' }];

      mockTemplateRepo.find.mockResolvedValue(mockTemplates);

      const result = await service.findAll(mockUser, 'linkedin');

      expect(result).toEqual(mockTemplates);
      expect(mockTemplateRepo.find).toHaveBeenCalledWith({
        where: { organizationId: mockUser.organizationId, platform: 'linkedin' },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return template by id', async () => {
      const mockTemplate = { id: 1, name: 'Test Template' };

      mockTemplateRepo.findOne.mockResolvedValue(mockTemplate);

      const result = await service.findOne(1, mockUser);

      expect(result).toEqual(mockTemplate);
      expect(mockTemplateRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1, organizationId: mockUser.organizationId },
      });
    });

    it('should return null when template not found', async () => {
      mockTemplateRepo.findOne.mockResolvedValue(null);

      const result = await service.findOne(999, mockUser);

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update template when user has permission', async () => {
      const updateTemplateDto = {
        name: 'Updated Template',
        description: 'Updated description',
      };

      const existingTemplate = {
        id: 1,
        name: 'Original Template',
        createdBy: mockUser.id,
        organizationId: mockUser.organizationId,
      };

      mockTemplateRepo.findOne.mockResolvedValue(existingTemplate);
      mockTemplateRepo.update.mockResolvedValue({ affected: 1 });

      const result = await service.update(1, updateTemplateDto, mockUser);

      expect(result).toBeDefined();
      expect(mockTemplateRepo.update).toHaveBeenCalledWith(
        { id: 1, organizationId: mockUser.organizationId },
        updateTemplateDto,
      );
    });

    it('should throw ForbiddenException when user is not creator', async () => {
      const updateTemplateDto = {
        name: 'Updated Template',
      };

      const existingTemplate = {
        id: 1,
        name: 'Original Template',
        createdBy: 999, // Different user
        organizationId: mockUser.organizationId,
      };

      mockTemplateRepo.findOne.mockResolvedValue(existingTemplate);

      await expect(service.update(1, updateTemplateDto, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should allow admin to update any template', async () => {
      const updateTemplateDto = {
        name: 'Updated Template',
      };

      const existingTemplate = {
        id: 1,
        name: 'Original Template',
        createdBy: 999, // Different user
        organizationId: mockUser.organizationId,
      };

      const adminUser = { ...mockUser, role: UserRole.ADMIN };

      mockTemplateRepo.findOne.mockResolvedValue(existingTemplate);
      mockTemplateRepo.update.mockResolvedValue({ affected: 1 });

      const result = await service.update(1, updateTemplateDto, adminUser);

      expect(result).toBeDefined();
      expect(mockTemplateRepo.update).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete template when user has permission', async () => {
      const existingTemplate = {
        id: 1,
        name: 'Test Template',
        createdBy: mockUser.id,
        organizationId: mockUser.organizationId,
      };

      mockTemplateRepo.findOne.mockResolvedValue(existingTemplate);
      mockTemplateRepo.delete.mockResolvedValue({ affected: 1 });

      await service.remove(1, mockUser);

      expect(mockTemplateRepo.delete).toHaveBeenCalledWith({
        id: 1,
        organizationId: mockUser.organizationId,
      });
    });

    it('should throw ForbiddenException when user is not creator', async () => {
      const existingTemplate = {
        id: 1,
        name: 'Test Template',
        createdBy: 999, // Different user
        organizationId: mockUser.organizationId,
      };

      mockTemplateRepo.findOne.mockResolvedValue(existingTemplate);

      await expect(service.remove(1, mockUser)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getTemplateStats', () => {
    it('should return template statistics', async () => {
      const mockStats = {
        total: 25,
        byPlatform: {
          linkedin: 10,
          twitter: 8,
          instagram: 7,
        },
        byCategory: {
          general: 15,
          promotional: 10,
        },
      };

      mockTemplateRepo.count.mockResolvedValue(25);
      mockTemplateRepo.find.mockResolvedValue([
        { platform: 'linkedin', category: 'general' },
        { platform: 'twitter', category: 'promotional' },
        // ... more mock data
      ]);

      const result = await service.getTemplateStats(mockUser);

      expect(result).toBeDefined();
      expect(result.total).toBe(25);
    });
  });
});
