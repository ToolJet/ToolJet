import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { createQueryBuilder, getManager, Repository } from 'typeorm';
import { UsersService } from 'src/services/users.service';
import { OrganizationUser } from 'src/entities/organization_user.entity';
import { BadRequestException } from '@nestjs/common';
import { EmailService } from './email.service';
import { Organization } from 'src/entities/organization.entity';
import { GroupPermission } from 'src/entities/group_permission.entity';
const uuid = require('uuid');

@Injectable()
export class OrganizationUsersService {
  constructor(
    @InjectRepository(OrganizationUser)
    private organizationUsersRepository: Repository<OrganizationUser>,
    private usersService: UsersService,
    private emailService: EmailService
  ) {}

  async findOrganization(id: string): Promise<OrganizationUser> {
    return await this.organizationUsersRepository.findOne({ where: { id } });
  }

  async create(user: User, organization: Organization, isInvite?: boolean): Promise<OrganizationUser> {
    return await this.organizationUsersRepository.save(
      this.organizationUsersRepository.create({
        user,
        organization,
        invitationToken: isInvite ? uuid.v4() : null,
        status: isInvite ? 'invited' : 'active',
        role: 'all-users',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    );
  }

  async changeRole(id: string, role: string) {
    const organizationUser = await this.organizationUsersRepository.findOne({ where: { id } });
    if (organizationUser.role == 'admin') {
      const lastActiveAdmin = await this.lastActiveAdmin(organizationUser.organizationId);

      if (lastActiveAdmin) {
        throw new BadRequestException('Atleast one active admin is required.');
      }
    }
    return await this.organizationUsersRepository.update(id, { role });
  }

  async archive(id: string) {
    await getManager().transaction(async (manager) => {
      const organizationUser = await manager.findOne(OrganizationUser, {
        where: { id },
      });
      const user = await manager.findOne(User, {
        where: { id: organizationUser.userId },
      });

      await this.usersService.throwErrorIfRemovingLastActiveAdmin(user, undefined, organizationUser.organizationId);

      await manager.update(OrganizationUser, id, { status: 'archived', invitationToken: null });
    });

    return true;
  }

  async unarchive(user: User, id: string) {
    const organizationUser = await this.organizationUsersRepository.findOne({
      where: { id },
    });
    if (organizationUser.status !== 'archived') return false;

    const invitationToken = uuid.v4();

    await getManager().transaction(async (manager) => {
      await manager.update(OrganizationUser, organizationUser.id, {
        status: 'invited',
        invitationToken,
      });
      await manager.update(User, organizationUser.userId, { password: uuid.v4() });
    });

    const updatedUser = await this.usersService.findOne(organizationUser.userId);

    const currentOrganization: Organization = (
      await this.organizationUsersRepository.findOne({
        where: { userId: user.id, organizationId: user.organizationId },
        relations: ['organization'],
      })
    )?.organization;

    await this.emailService.sendOrganizationUserWelcomeEmail(
      updatedUser.email,
      updatedUser.firstName,
      user.firstName,
      invitationToken,
      currentOrganization.name
    );

    return true;
  }

  async activate(user: OrganizationUser) {
    await this.organizationUsersRepository.update(user.id, {
      status: 'active',
    });
  }

  async lastActiveAdmin(organizationId: string): Promise<boolean> {
    const adminsCount = await this.activeAdminCount(organizationId);

    return adminsCount <= 1;
  }

  async activeAdminCount(organizationId: string) {
    return await createQueryBuilder(GroupPermission, 'group_permissions')
      .innerJoin('group_permissions.userGroupPermission', 'user_group_permission')
      .where('group_permissions.group = :admin', { admin: 'admin' })
      .andWhere('group_permissions.organization = :organizationId', { organizationId })
      .getCount();
  }
}
