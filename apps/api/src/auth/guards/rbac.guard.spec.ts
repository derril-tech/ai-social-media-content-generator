# Created automatically by Cursor AI (2024-12-19)

import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RbacGuard, Role, Permission, Roles, Permissions, TenantIsolation } from './rbac.guard';
import { User } from '../../users/entities/user.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { Membership } from '../../memberships/entities/membership.entity';

describe('RbacGuard', () => {
  let guard: RbacGuard;
  let reflector: Reflector;
  let jwtService: JwtService;
  let usersRepository: Repository<User>;
  let organizationsRepository: Repository<Organization>;
  let membershipsRepository: Repository<Membership>;

  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    password: 'hashed-password',
    firstName: 'Test',
    lastName: 'User',
    isActive: true,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    memberships: []
  };

  const mockOrganization: Organization = {
    id: 'org-1',
    name: 'Test Organization',
    slug: 'test-org',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    memberships: []
  };

  const mockMembership: Membership = {
    id: 'membership-1',
    user: mockUser,
    organization: mockOrganization,
    role: Role.ADMIN,
    isPrimary: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RbacGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Organization),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Membership),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RbacGuard>(RbacGuard);
    reflector = module.get<Reflector>(Reflector);
    jwtService = module.get<JwtService>(JwtService);
    usersRepository = module.get<Repository<User>>(getRepositoryToken(User));
    organizationsRepository = module.get<Repository<Organization>>(getRepositoryToken(Organization));
    membershipsRepository = module.get<Repository<Membership>>(getRepositoryToken(Membership));
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    let mockContext: ExecutionContext;
    let mockRequest: any;

    beforeEach(() => {
      mockRequest = {
        headers: {
          authorization: 'Bearer valid-token',
          'x-organization-id': 'org-1'
        },
        query: {},
        body: {},
        params: {}
      };

      mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as ExecutionContext;
    });

    describe('when no roles or permissions required', () => {
      beforeEach(() => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      });

      it('should allow access', async () => {
        const result = await guard.canActivate(mockContext);
        expect(result).toBe(true);
      });
    });

    describe('when token is missing', () => {
      beforeEach(() => {
        mockRequest.headers.authorization = undefined;
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
      });

      it('should throw UnauthorizedException', async () => {
        await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
      });
    });

    describe('when token is invalid', () => {
      beforeEach(() => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
        jest.spyOn(jwtService, 'verifyAsync').mockRejectedValue(new Error('Invalid token'));
      });

      it('should throw UnauthorizedException', async () => {
        await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
      });
    });

    describe('when user not found', () => {
      beforeEach(() => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
        jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue({ sub: 'user-1' });
        jest.spyOn(usersRepository, 'findOne').mockResolvedValue(null);
      });

      it('should throw UnauthorizedException', async () => {
        await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
      });
    });

    describe('when user is not a member of organization', () => {
      beforeEach(() => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
        jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue({ sub: 'user-1' });
        jest.spyOn(usersRepository, 'findOne').mockResolvedValue({
          ...mockUser,
          memberships: []
        });
      });

      it('should throw ForbiddenException', async () => {
        await expect(guard.canActivate(mockContext)).rejects.toThrow(ForbiddenException);
      });
    });

    describe('role-based access control', () => {
      beforeEach(() => {
        jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue({ sub: 'user-1' });
        jest.spyOn(usersRepository, 'findOne').mockResolvedValue({
          ...mockUser,
          memberships: [mockMembership]
        });
      });

      describe('when user has required role', () => {
        beforeEach(() => {
          jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
        });

        it('should allow access', async () => {
          const result = await guard.canActivate(mockContext);
          expect(result).toBe(true);
        });
      });

      describe('when user does not have required role', () => {
        beforeEach(() => {
          jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.OWNER]);
        });

        it('should throw ForbiddenException', async () => {
          await expect(guard.canActivate(mockContext)).rejects.toThrow(ForbiddenException);
        });
      });

      describe('when multiple roles are required', () => {
        beforeEach(() => {
          jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.OWNER, Role.ADMIN]);
        });

        it('should allow access if user has any of the required roles', async () => {
          const result = await guard.canActivate(mockContext);
          expect(result).toBe(true);
        });
      });
    });

    describe('permission-based access control', () => {
      beforeEach(() => {
        jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue({ sub: 'user-1' });
        jest.spyOn(usersRepository, 'findOne').mockResolvedValue({
          ...mockUser,
          memberships: [mockMembership]
        });
      });

      describe('when user has required permissions', () => {
        beforeEach(() => {
          jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Permission.MANAGE_USERS]);
        });

        it('should allow access', async () => {
          const result = await guard.canActivate(mockContext);
          expect(result).toBe(true);
        });
      });

      describe('when user does not have required permissions', () => {
        beforeEach(() => {
          jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Permission.MANAGE_ORGANIZATION]);
        });

        it('should throw ForbiddenException', async () => {
          await expect(guard.canActivate(mockContext)).rejects.toThrow(ForbiddenException);
        });
      });

      describe('when multiple permissions are required', () => {
        beforeEach(() => {
          jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
            Permission.MANAGE_USERS,
            Permission.VIEW_USERS
          ]);
        });

        it('should allow access if user has all required permissions', async () => {
          const result = await guard.canActivate(mockContext);
          expect(result).toBe(true);
        });
      });
    });

    describe('tenant isolation', () => {
      beforeEach(() => {
        jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue({ sub: 'user-1' });
        jest.spyOn(usersRepository, 'findOne').mockResolvedValue({
          ...mockUser,
          memberships: [mockMembership]
        });
        jest.spyOn(reflector, 'getAllAndOverride')
          .mockImplementation((key) => {
            if (key === 'tenant_isolation') return true;
            return [Role.ADMIN];
          });
      });

      it('should enforce tenant isolation when required', async () => {
        const result = await guard.canActivate(mockContext);
        expect(result).toBe(true);
        expect(mockRequest.query.organizationId).toBe('org-1');
      });
    });

    describe('organization ID resolution', () => {
      beforeEach(() => {
        jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue({ sub: 'user-1' });
        jest.spyOn(usersRepository, 'findOne').mockResolvedValue({
          ...mockUser,
          memberships: [mockMembership]
        });
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
      });

      it('should use organization ID from headers', async () => {
        mockRequest.headers['x-organization-id'] = 'org-from-header';
        const result = await guard.canActivate(mockContext);
        expect(result).toBe(true);
      });

      it('should use organization ID from query params', async () => {
        delete mockRequest.headers['x-organization-id'];
        mockRequest.query.organizationId = 'org-from-query';
        const result = await guard.canActivate(mockContext);
        expect(result).toBe(true);
      });

      it('should use organization ID from body', async () => {
        delete mockRequest.headers['x-organization-id'];
        delete mockRequest.query.organizationId;
        mockRequest.body.organizationId = 'org-from-body';
        const result = await guard.canActivate(mockContext);
        expect(result).toBe(true);
      });

      it('should use primary organization when no ID provided', async () => {
        delete mockRequest.headers['x-organization-id'];
        delete mockRequest.query.organizationId;
        delete mockRequest.body.organizationId;
        const result = await guard.canActivate(mockContext);
        expect(result).toBe(true);
      });
    });
  });

  describe('decorators', () => {
    it('should create Roles decorator', () => {
      const decorator = Roles(Role.ADMIN, Role.EDITOR);
      expect(decorator).toBeDefined();
    });

    it('should create Permissions decorator', () => {
      const decorator = Permissions(Permission.MANAGE_USERS, Permission.VIEW_USERS);
      expect(decorator).toBeDefined();
    });

    it('should create TenantIsolation decorator', () => {
      const decorator = TenantIsolation();
      expect(decorator).toBeDefined();
    });
  });

  describe('helper decorators', () => {
    it('should create RequireOwner decorator', () => {
      const decorator = require('./rbac.guard').RequireOwner;
      expect(decorator).toBeDefined();
    });

    it('should create RequireAdmin decorator', () => {
      const decorator = require('./rbac.guard').RequireAdmin;
      expect(decorator).toBeDefined();
    });

    it('should create RequireManageUsers decorator', () => {
      const decorator = require('./rbac.guard').RequireManageUsers;
      expect(decorator).toBeDefined();
    });
  });
});
