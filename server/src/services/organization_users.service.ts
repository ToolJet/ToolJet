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
          status: isInvite ? 'invited' : 'active',
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

  async archive(id: string, organizationId: string): Promise<void> {
    const organizationUser = await this.organizationUsersRepository.findOneOrFail({
      where: { id, organizationId },
      relations: ['user'],
    });

    await this.usersService.throwErrorIfRemovingLastActiveAdmin(organizationUser?.user, undefined, organizationId);
    await this.organizationUsersRepository.update(id, { status: 'archived', invitationToken: null });
  }

  async unarchive(user: User, id: string, manager?: EntityManager): Promise<void> {
    const organizationUser = await this.organizationUsersRepository.findOne({
      where: { id, organizationId: user.organizationId },
      relations: ['user', 'organization'],
    });

    if (!(organizationUser && organizationUser.organization && organizationUser.user)) {
      throw new BadRequestException('User not exist');
    }
    if (organizationUser.status !== 'archived') {
      throw new BadRequestException('User status must be archived to unarchive');
    }

    const invitationToken = uuid.v4();

    await dbTransactionWrap(async (manager: EntityManager) => {
      await manager.update(OrganizationUser, id, { status: 'invited', invitationToken });

      if (this.configService.get<string>('DISABLE_MULTI_WORKSPACE') === 'true') {
        // Resetting password if single organization
        await this.usersService.updateUser(id, { password: uuid.v4() }, manager);
      }
    }, manager);

    await this.emailService.sendOrganizationUserWelcomeEmail(
      organizationUser.user.email,
      organizationUser.user.firstName,
      user.firstName,
      invitationToken,
      organizationUser.organization.name
    );

    return;
  }

  async activate(organizationUser: OrganizationUser, manager?: EntityManager) {
    await dbTransactionWrap(async (manager: EntityManager) => {
      await manager.update(OrganizationUser, organizationUser.id, {
        status: 'active',
        invitationToken: null,
      });

      await manager.update(User, organizationUser.userId, {
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
