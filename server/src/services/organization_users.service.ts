import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { createQueryBuilder, DeepPartial, EntityManager, Repository } from 'typeorm';
import { UsersService } from 'src/services/users.service';
import { OrganizationUser } from 'src/entities/organization_user.entity';
import { BadRequestException } from '@nestjs/common';
import { EmailService } from './email.service';
import { Organization } from 'src/entities/organization.entity';
import { GroupPermission } from 'src/entities/group_permission.entity';
import { ConfigService } from '@nestjs/config';
import { dbTransactionWrap } from 'src/helpers/utils.helper';
import { WORKSPACE_USER_STATUS } from 'src/helpers/user_lifecycle';
const uuid = require('uuid');

@Injectable()
export class OrganizationUsersService {
  constructor(
    @InjectRepository(OrganizationUser)
    private organizationUsersRepository: Repository<OrganizationUser>,
    private usersService: UsersService,
    private emailService: EmailService,
    private configService: ConfigService
  ) {}

  async create(
    user: User,
    organization: DeepPartial<Organization>,
    isInvite?: boolean,
    manager?: EntityManager
  ): Promise<OrganizationUser> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await manager.save(
        manager.create(OrganizationUser, {
          user,
          organization,
          invitationToken: isInvite ? uuid.v4() : null,
          status: isInvite ? WORKSPACE_USER_STATUS.INVITED : WORKSPACE_USER_STATUS.ACTIVE,
          role: 'all-users',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );
    }, manager);
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

  async updateOrgUser(organizationUserId: string, updateUserDto) {
    const organizationUser = await this.organizationUsersRepository.findOne({ where: { id: organizationUserId } });
    return await this.usersService.update(
      organizationUser.userId,
      updateUserDto,
      null,
      organizationUser.organizationId
    );
  }

  async archive(id: string, organizationId: string): Promise<void> {
    const organizationUser = await this.organizationUsersRepository.findOneOrFail({
      where: { id, organizationId },
      relations: ['user'],
    });

    await this.usersService.throwErrorIfRemovingLastActiveAdmin(organizationUser?.user, undefined, organizationId);
    await this.organizationUsersRepository.update(id, {
      status: WORKSPACE_USER_STATUS.ARCHIVED,
      invitationToken: null,
    });
  }

  async unarchive(user: User, id: string, manager?: EntityManager): Promise<void> {
    const organizationUser = await this.organizationUsersRepository.findOne({
      where: { id, organizationId: user.organizationId },
      relations: ['user', 'organization'],
    });

    if (!(organizationUser && organizationUser.organization && organizationUser.user)) {
      throw new BadRequestException('User not exist');
    }
    if (organizationUser.status !== WORKSPACE_USER_STATUS.ARCHIVED) {
      throw new BadRequestException('User status must be archived to unarchive');
    }

    const invitationToken = uuid.v4();

    await dbTransactionWrap(async (manager: EntityManager) => {
      await manager.update(OrganizationUser, id, { status: WORKSPACE_USER_STATUS.INVITED, invitationToken });
    }, manager);

    this.emailService
      .sendOrganizationUserWelcomeEmail(
        organizationUser.user.email,
        organizationUser.user.firstName,
        user.firstName,
        `${invitationToken}?oid=${organizationUser.organizationId}`,
        organizationUser.organization.name
      )
      .catch((err) => console.error('Error while sending welcome mail', err));

    return;
  }

  async activateOrganization(organizationUser: OrganizationUser, manager?: EntityManager) {
    await dbTransactionWrap(async (manager: EntityManager) => {
      await manager.update(OrganizationUser, organizationUser.id, {
        status: WORKSPACE_USER_STATUS.ACTIVE,
        invitationToken: null,
      });
    }, manager);
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
