# Created automatically by Cursor AI (2024-12-19)

'use client';
import React, { useState, useEffect, ReactNode } from 'react';
import { Alert, Spin, Button, Result } from 'antd';
import { LockOutlined, ExclamationCircleOutlined, ReloadOutlined } from '@ant-design/icons';

// Import the same enums from the backend for consistency
enum Role {
  OWNER = 'owner',
  ADMIN = 'admin',
  EDITOR = 'editor',
  REVIEWER = 'reviewer',
  VIEWER = 'viewer'
}

enum Permission {
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

// Role to permission mapping (same as backend)
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

interface User {
  id: string;
  email: string;
  role: Role;
  organizationId: string;
  permissions: Permission[];
}

interface RbacRouteGuardProps {
  children: ReactNode;
  requiredRoles?: Role[];
  requiredPermissions?: Permission[];
  fallback?: ReactNode;
  showLoading?: boolean;
  redirectTo?: string;
  onAccessDenied?: (user: User | null, requiredRoles?: Role[], requiredPermissions?: Permission[]) => void;
}

export default function RbacRouteGuard({
  children,
  requiredRoles = [],
  requiredPermissions = [],
  fallback,
  showLoading = true,
  redirectTo,
  onAccessDenied
}: RbacRouteGuardProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserPermissions();
  }, []);

  const fetchUserPermissions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get token from localStorage or cookies
      const token = localStorage.getItem('auth_token') || getCookie('auth_token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Fetch user permissions from API
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user permissions');
      }

      const userData = await response.json();
      setUser(userData);
    } catch (err) {
      console.error('Error fetching user permissions:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      
      if (onAccessDenied) {
        onAccessDenied(null, requiredRoles, requiredPermissions);
      }
    } finally {
      setLoading(false);
    }
  };

  const getCookie = (name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  };

  const hasRequiredRole = (): boolean => {
    if (requiredRoles.length === 0) return true;
    if (!user) return false;
    return requiredRoles.includes(user.role);
  };

  const hasRequiredPermissions = (): boolean => {
    if (requiredPermissions.length === 0) return true;
    if (!user) return false;
    return requiredPermissions.every(permission => user.permissions.includes(permission));
  };

  const canAccess = (): boolean => {
    return hasRequiredRole() && hasRequiredPermissions();
  };

  const handleRetry = () => {
    fetchUserPermissions();
  };

  const handleRedirect = () => {
    if (redirectTo) {
      window.location.href = redirectTo;
    }
  };

  // Loading state
  if (loading && showLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '200px' 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Result
        status="error"
        icon={<ExclamationCircleOutlined />}
        title="Authentication Error"
        subTitle={error}
        extra={[
          <Button key="retry" type="primary" icon={<ReloadOutlined />} onClick={handleRetry}>
            Retry
          </Button>,
          <Button key="login" onClick={handleRedirect}>
            Go to Login
          </Button>
        ]}
      />
    );
  }

  // Access denied state
  if (!canAccess()) {
    if (onAccessDenied) {
      onAccessDenied(user, requiredRoles, requiredPermissions);
    }

    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Result
        status="403"
        icon={<LockOutlined />}
        title="Access Denied"
        subTitle={
          <div>
            <p>You don't have permission to access this page.</p>
            {requiredRoles.length > 0 && (
              <p><strong>Required roles:</strong> {requiredRoles.join(', ')}</p>
            )}
            {requiredPermissions.length > 0 && (
              <p><strong>Required permissions:</strong> {requiredPermissions.join(', ')}</p>
            )}
            {user && (
              <p><strong>Your role:</strong> {user.role}</p>
            )}
          </div>
        }
        extra={[
          <Button key="back" onClick={() => window.history.back()}>
            Go Back
          </Button>,
          <Button key="home" type="primary" onClick={() => window.location.href = '/'}>
            Go Home
          </Button>
        ]}
      />
    );
  }

  // Access granted
  return <>{children}</>;
}

// Helper components for common permission checks
export const RequireOwner = ({ children, ...props }: Omit<RbacRouteGuardProps, 'requiredRoles'>) => (
  <RbacRouteGuard requiredRoles={[Role.OWNER]} {...props}>
    {children}
  </RbacRouteGuard>
);

export const RequireAdmin = ({ children, ...props }: Omit<RbacRouteGuardProps, 'requiredRoles'>) => (
  <RbacRouteGuard requiredRoles={[Role.OWNER, Role.ADMIN]} {...props}>
    {children}
  </RbacRouteGuard>
);

export const RequireEditor = ({ children, ...props }: Omit<RbacRouteGuardProps, 'requiredRoles'>) => (
  <RbacRouteGuard requiredRoles={[Role.OWNER, Role.ADMIN, Role.EDITOR]} {...props}>
    {children}
  </RbacRouteGuard>
);

export const RequireReviewer = ({ children, ...props }: Omit<RbacRouteGuardProps, 'requiredRoles'>) => (
  <RbacRouteGuard requiredRoles={[Role.OWNER, Role.ADMIN, Role.EDITOR, Role.REVIEWER]} {...props}>
    {children}
  </RbacRouteGuard>
);

export const RequireViewer = ({ children, ...props }: Omit<RbacRouteGuardProps, 'requiredRoles'>) => (
  <RbacRouteGuard requiredRoles={[Role.OWNER, Role.ADMIN, Role.EDITOR, Role.REVIEWER, Role.VIEWER]} {...props}>
    {children}
  </RbacRouteGuard>
);

// Permission-based components
export const RequireManageOrganization = ({ children, ...props }: Omit<RbacRouteGuardProps, 'requiredPermissions'>) => (
  <RbacRouteGuard requiredPermissions={[Permission.MANAGE_ORGANIZATION]} {...props}>
    {children}
  </RbacRouteGuard>
);

export const RequireManageUsers = ({ children, ...props }: Omit<RbacRouteGuardProps, 'requiredPermissions'>) => (
  <RbacRouteGuard requiredPermissions={[Permission.MANAGE_USERS]} {...props}>
    {children}
  </RbacRouteGuard>
);

export const RequireManageContent = ({ children, ...props }: Omit<RbacRouteGuardProps, 'requiredPermissions'>) => (
  <RbacRouteGuard requiredPermissions={[Permission.MANAGE_CONTENT]} {...props}>
    {children}
  </RbacRouteGuard>
);

export const RequirePublishContent = ({ children, ...props }: Omit<RbacRouteGuardProps, 'requiredPermissions'>) => (
  <RbacRouteGuard requiredPermissions={[Permission.PUBLISH_CONTENT]} {...props}>
    {children}
  </RbacRouteGuard>
);

export const RequireViewAnalytics = ({ children, ...props }: Omit<RbacRouteGuardProps, 'requiredPermissions'>) => (
  <RbacRouteGuard requiredPermissions={[Permission.VIEW_ANALYTICS]} {...props}>
    {children}
  </RbacRouteGuard>
);

export const RequireManageConnectors = ({ children, ...props }: Omit<RbacRouteGuardProps, 'requiredPermissions'>) => (
  <RbacRouteGuard requiredPermissions={[Permission.MANAGE_CONNECTORS]} {...props}>
    {children}
  </RbacRouteGuard>
);

// Export enums for use in other components
export { Role, Permission };
