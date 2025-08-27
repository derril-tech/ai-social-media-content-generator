# Created automatically by Cursor AI (2024-12-19)

import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { Membership } from '../../memberships/entities/membership.entity';

export enum Role {
  OWNER = 'owner',
  ADMIN = 'admin',
  EDITOR = 'editor',
  REVIEWER = 'reviewer',
  VIEWER = 'viewer'
}

export enum Permission {
  // Organization permissions
  MANAGE_ORGANIZATION = 'manage_organization',
  VIEW_ORGANIZATION = 'view_organization',
  
  // User management permissions
  MANAGE_USERS = 'manage_users',
  VIEW_USERS = 'view_users',
  
  // Brand permissions
  MANAGE_BRANDS = 'manage_brands',
  VIEW_BRANDS = 'view_brands',
  
  // Campaign permissions
  MANAGE_CAMPAIGNS = 'manage_campaigns',
  VIEW_CAMPAIGNS = 'view_campaigns',
  
  // Content permissions
  MANAGE_CONTENT = 'manage_content',
  VIEW_CONTENT = 'view_content',
  PUBLISH_CONTENT = 'publish_content',
  
  // Analytics permissions
  VIEW_ANALYTICS = 'view_analytics',
  EXPORT_ANALYTICS = 'export_analytics',
  
  // Connector permissions
  MANAGE_CONNECTORS = 'manage_connectors',
  VIEW_CONNECTORS = 'view_connectors',
  
  // Experiment permissions
  MANAGE_EXPERIMENTS = 'manage_experiments',
  VIEW_EXPERIMENTS = 'view_experiments',
  
  // Billing permissions
  MANAGE_BILLING = 'manage_billing',
  VIEW_BILLING = 'view_billing'
}

export const ROLES_KEY = 'roles';
export const PERMISSIONS_KEY = 'permissions';
export const TENANT_ISOLATION_KEY = 'tenant_isolation';

export const Roles = (...roles: Role[]) => Reflector.createDecorator<Role[]>(ROLES_KEY);
export const Permissions = (...permissions: Permission[]) => Reflector.createDecorator<Permission[]>(PERMISSIONS_KEY);
export const TenantIsolation = () => Reflector.createDecorator<boolean>(TENANT_ISOLATION_KEY);

// Role to permission mapping
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.OWNER]: [
    Permission.MANAGE_ORGANIZATION,
    Permission.VIEW_ORGANIZATION,
    Permission.MANAGE_USERS,
    Permission.VIEW_USERS,
    Permission.MANAGE_BRANDS,
    Permission.VIEW_BRANDS,
    Permission.MANAGE_CAMPAIGNS,
    Permission.VIEW_CAMPAIGNS,
    Permission.MANAGE_CONTENT,
    Permission.VIEW_CONTENT,
    Permission.PUBLISH_CONTENT,
    Permission.VIEW_ANALYTICS,
    Permission.EXPORT_ANALYTICS,
    Permission.MANAGE_CONNECTORS,
    Permission.VIEW_CONNECTORS,
    Permission.MANAGE_EXPERIMENTS,
    Permission.VIEW_EXPERIMENTS,
    Permission.MANAGE_BILLING,
    Permission.VIEW_BILLING
  ],
  [Role.ADMIN]: [
    Permission.VIEW_ORGANIZATION,
    Permission.MANAGE_USERS,
    Permission.VIEW_USERS,
    Permission.MANAGE_BRANDS,
    Permission.VIEW_BRANDS,
    Permission.MANAGE_CAMPAIGNS,
    Permission.VIEW_CAMPAIGNS,
    Permission.MANAGE_CONTENT,
    Permission.VIEW_CONTENT,
    Permission.PUBLISH_CONTENT,
    Permission.VIEW_ANALYTICS,
    Permission.EXPORT_ANALYTICS,
    Permission.MANAGE_CONNECTORS,
    Permission.VIEW_CONNECTORS,
    Permission.MANAGE_EXPERIMENTS,
    Permission.VIEW_EXPERIMENTS,
    Permission.VIEW_BILLING
  ],
  [Role.EDITOR]: [
    Permission.VIEW_ORGANIZATION,
    Permission.VIEW_USERS,
    Permission.VIEW_BRANDS,
    Permission.MANAGE_CAMPAIGNS,
    Permission.VIEW_CAMPAIGNS,
    Permission.MANAGE_CONTENT,
    Permission.VIEW_CONTENT,
    Permission.PUBLISH_CONTENT,
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_CONNECTORS,
    Permission.VIEW_EXPERIMENTS
  ],
  [Role.REVIEWER]: [
    Permission.VIEW_ORGANIZATION,
    Permission.VIEW_USERS,
    Permission.VIEW_BRANDS,
    Permission.VIEW_CAMPAIGNS,
    Permission.VIEW_CONTENT,
    Permission.PUBLISH_CONTENT,
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_CONNECTORS,
    Permission.VIEW_EXPERIMENTS
  ],
  [Role.VIEWER]: [
    Permission.VIEW_ORGANIZATION,
    Permission.VIEW_USERS,
    Permission.VIEW_BRANDS,
    Permission.VIEW_CAMPAIGNS,
    Permission.VIEW_CONTENT,
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_CONNECTORS,
    Permission.VIEW_EXPERIMENTS
  ]
};

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>,
    @InjectRepository(Membership)
    private membershipsRepository: Repository<Membership>
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Get required roles and permissions from decorators
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    const requireTenantIsolation = this.reflector.getAllAndOverride<boolean>(TENANT_ISOLATION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles or permissions required, allow access
    if (!requiredRoles && !requiredPermissions) {
      return true;
    }

    // Extract JWT token from request
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      // Verify and decode JWT token
      const payload = await this.jwtService.verifyAsync(token);
      const userId = payload.sub;
      
      // Get user with organization and membership data
      const user = await this.usersRepository.findOne({
        where: { id: userId },
        relations: ['memberships', 'memberships.organization']
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Get organization ID from request or user's primary organization
      const organizationId = this.getOrganizationId(request, user);
      
      // Get user's membership in the organization
      const membership = user.memberships.find(m => m.organization.id === organizationId);
      
      if (!membership) {
        throw new ForbiddenException('User not a member of this organization');
      }

      // Check role-based access
      if (requiredRoles && !requiredRoles.includes(membership.role)) {
        throw new ForbiddenException(`Insufficient role. Required: ${requiredRoles.join(', ')}. Current: ${membership.role}`);
      }

      // Check permission-based access
      if (requiredPermissions) {
        const userPermissions = ROLE_PERMISSIONS[membership.role];
        const hasAllPermissions = requiredPermissions.every(permission => 
          userPermissions.includes(permission)
        );
        
        if (!hasAllPermissions) {
          throw new ForbiddenException(`Insufficient permissions. Required: ${requiredPermissions.join(', ')}`);
        }
      }

      // Apply tenant isolation if required
      if (requireTenantIsolation) {
        await this.enforceTenantIsolation(request, organizationId);
      }

      // Attach user and organization info to request for use in controllers
      request.user = {
        id: user.id,
        email: user.email,
        role: membership.role,
        organizationId: organizationId,
        permissions: ROLE_PERMISSIONS[membership.role]
      };

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private getOrganizationId(request: any, user: User): string {
    // Try to get organization ID from request headers, query params, or body
    const orgId = request.headers['x-organization-id'] || 
                  request.query.organizationId || 
                  request.body?.organizationId ||
                  request.params?.organizationId;

    if (orgId) {
      return orgId;
    }

    // Fall back to user's primary organization
    const primaryMembership = user.memberships.find(m => m.isPrimary);
    if (primaryMembership) {
      return primaryMembership.organization.id;
    }

    // If no primary organization, use the first one
    if (user.memberships.length > 0) {
      return user.memberships[0].organization.id;
    }

    throw new ForbiddenException('No organization access');
  }

  private async enforceTenantIsolation(request: any, organizationId: string): Promise<void> {
    // Ensure all data access is scoped to the user's organization
    const resourceId = request.params.id || request.body?.id;
    
    if (resourceId) {
      // Check if the resource belongs to the user's organization
      // This is a simplified example - in practice, you'd check the actual resource
      const resource = await this.checkResourceOwnership(resourceId, organizationId);
      if (!resource) {
        throw new ForbiddenException('Resource not found or access denied');
      }
    }

    // Add organization filter to query parameters
    if (request.query) {
      request.query.organizationId = organizationId;
    }
  }

  private async checkResourceOwnership(resourceId: string, organizationId: string): Promise<boolean> {
    // This is a placeholder implementation
    // In practice, you would check the actual resource ownership
    // based on the resource type and organization relationship
    
    // Example for different resource types:
    // - Brands: check brand.organizationId === organizationId
    // - Campaigns: check campaign.organizationId === organizationId
    // - Content: check content.organizationId === organizationId
    
    return true; // Placeholder - implement actual resource ownership check
  }
}

// Helper decorators for common permission combinations
export const RequireOwner = () => Roles(Role.OWNER);
export const RequireAdmin = () => Roles(Role.OWNER, Role.ADMIN);
export const RequireEditor = () => Roles(Role.OWNER, Role.ADMIN, Role.EDITOR);
export const RequireReviewer = () => Roles(Role.OWNER, Role.ADMIN, Role.EDITOR, Role.REVIEWER);
export const RequireViewer = () => Roles(Role.OWNER, Role.ADMIN, Role.EDITOR, Role.REVIEWER, Role.VIEWER);

// Helper decorators for specific permissions
export const RequireManageOrganization = () => Permissions(Permission.MANAGE_ORGANIZATION);
export const RequireManageUsers = () => Permissions(Permission.MANAGE_USERS);
export const RequireManageContent = () => Permissions(Permission.MANAGE_CONTENT);
export const RequirePublishContent = () => Permissions(Permission.PUBLISH_CONTENT);
export const RequireViewAnalytics = () => Permissions(Permission.VIEW_ANALYTICS);
export const RequireManageConnectors = () => Permissions(Permission.MANAGE_CONNECTORS);
