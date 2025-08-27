import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';

export interface JwtPayload {
  sub: string; // user ID
  email: string;
  iat?: number;
  exp?: number;
  iss?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
      issuer: 'ai-social-media-api',
    });
  }

  async validate(payload: JwtPayload) {
    const { sub: userId, email } = payload;

    try {
      // Get user with roles and organization memberships
      const user = await this.usersService.findOneWithRoles(userId);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      if (!user.isActive) {
        throw new UnauthorizedException('User account is deactivated');
      }

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.memberships?.map((m) => m.role) || [],
        organizations: user.memberships?.map((m) => m.organizationId) || [],
        currentOrganization: user.memberships?.[0]?.organizationId,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
