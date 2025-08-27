import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Membership } from './entities/membership.entity';
import { CreateMembershipDto } from './dto/create-membership.dto';
import { UpdateMembershipDto } from './dto/update-membership.dto';
import { OrganizationsService } from '../organizations/organizations.service';
import { UsersService } from '../users/users.service';
import { UserRole } from '@shared/types';

@Injectable()
export class MembershipsService {
  constructor(
    @InjectRepository(Membership)
    private membershipsRepository: Repository<Membership>,
    private organizationsService: OrganizationsService,
    private usersService: UsersService,
  ) {}

  async create(createMembershipDto: CreateMembershipDto): Promise<Membership> {
    const { organizationId, userId, role } = createMembershipDto;

    // Verify organization exists
    await this.organizationsService.findOne(organizationId);

    // Verify user exists
    await this.usersService.findOne(userId);

    // Check if membership already exists
    const existingMembership = await this.membershipsRepository.findOne({
      where: { organizationId, userId },
    });

    if (existingMembership) {
      throw new ConflictException('User is already a member of this organization');
    }

    const membership = this.membershipsRepository.create({
      organizationId,
      userId,
      role,
    });

    return this.membershipsRepository.save(membership);
  }

  async findAll(): Promise<Membership[]> {
    return this.membershipsRepository.find({
      relations: ['organization', 'user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Membership> {
    const membership = await this.membershipsRepository.findOne({
      where: { id },
      relations: ['organization', 'user'],
    });

    if (!membership) {
      throw new NotFoundException(`Membership with ID ${id} not found`);
    }

    return membership;
  }

  async findByOrganization(organizationId: string): Promise<Membership[]> {
    return this.membershipsRepository.find({
      where: { organizationId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }

  async findByUser(userId: string): Promise<Membership[]> {
    return this.membershipsRepository.find({
      where: { userId },
      relations: ['organization'],
      order: { createdAt: 'ASC' },
    });
  }

  async update(id: string, updateMembershipDto: UpdateMembershipDto): Promise<Membership> {
    const membership = await this.findOne(id);

    Object.assign(membership, updateMembershipDto);
    return this.membershipsRepository.save(membership);
  }

  async remove(id: string): Promise<void> {
    const membership = await this.findOne(id);
    await this.membershipsRepository.remove(membership);
  }

  async removeUserFromOrganization(organizationId: string, userId: string): Promise<void> {
    const membership = await this.membershipsRepository.findOne({
      where: { organizationId, userId },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    await this.membershipsRepository.remove(membership);
  }

  async changeUserRole(
    organizationId: string,
    userId: string,
    newRole: UserRole,
    requestingUserId: string,
  ): Promise<Membership> {
    const membership = await this.membershipsRepository.findOne({
      where: { organizationId, userId },
      relations: ['organization'],
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    // Check if requesting user has permission to change roles
    const requestingUserMembership = await this.membershipsRepository.findOne({
      where: { organizationId, userId: requestingUserId },
    });

    if (!requestingUserMembership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    // Only owners can change roles, or admins can change non-owner roles
    if (
      requestingUserMembership.role !== UserRole.OWNER &&
      (requestingUserMembership.role !== UserRole.ADMIN || newRole === UserRole.OWNER)
    ) {
      throw new ForbiddenException('Insufficient permissions to change this role');
    }

    membership.role = newRole;
    return this.membershipsRepository.save(membership);
  }

  async isUserMemberOfOrganization(userId: string, organizationId: string): Promise<boolean> {
    const membership = await this.membershipsRepository.findOne({
      where: { userId, organizationId },
    });

    return !!membership;
  }

  async getUserRoleInOrganization(userId: string, organizationId: string): Promise<UserRole | null> {
    const membership = await this.membershipsRepository.findOne({
      where: { userId, organizationId },
    });

    return membership ? membership.role : null;
  }
}
