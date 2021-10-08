import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Organization } from 'src/entities/organization.entity';
import { createQueryBuilder, EntityManager, getManager, getRepository, In, Repository } from 'typeorm';
import { OrganizationUser } from '../entities/organization_user.entity';
import { AppGroupPermission } from 'src/entities/app_group_permission.entity';
import { UserGroupPermission } from 'src/entities/user_group_permission.entity';
import { GroupPermission } from 'src/entities/group_permission.entity';
import { BadRequestException } from '@nestjs/common';
const uuid = require('uuid');
const bcrypt = require('bcrypt');

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(OrganizationUser)
    private organizationUsersRepository: Repository<OrganizationUser>,
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>
  ) {}

  async findOne(id: string): Promise<User> {
    return this.usersRepository.findOne(id);
  }

  async findByEmail(email: string): Promise<User> {
    return this.usersRepository.findOne({
      where: { email },
      relations: ['organization'],
    });
  }

  async findByPasswordResetToken(token: string): Promise<User> {
    return this.usersRepository.findOne({
      where: { forgotPasswordToken: token },
    });
  }

  async create(userParams: any, organization: Organization, groups?: string[]): Promise<User> {
    const password = uuid.v4();
    const invitationToken = uuid.v4();

    const { email, firstName, lastName } = userParams;
    let user: User;

    await getManager().transaction(async (manager) => {
      user = manager.create(User, {
        email,
        firstName,
        lastName,
        password,
        invitationToken,
        organizationId: organization.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await manager.save(user);

      for (const group of groups) {
        const orgGroupPermission = await manager.findOne(GroupPermission, {
          organizationId: organization.id,
          group: group,
        });

        if (orgGroupPermission) {
          const userGroupPermission = manager.create(UserGroupPermission, {
            groupPermissionId: orgGroupPermission.id,
            userId: user.id,
          });
          manager.save(userGroupPermission);
        } else {
          throw new BadRequestException(`${group} group does not exist for current organization`);
        }
      }
    });

    return user;
  }

  async setupAccountFromInvitationToken(params: any) {
    const { organization, password, token } = params; // TODO: organization is the name of the organization, this should be changed
    const firstName = params['first_name'];
    const lastName = params['last_name'];
    const newSignup = params['new_signup'];

    const user = await this.usersRepository.findOne({ invitationToken: token });

    if (user) {
      // beforeUpdate hook will not trigger if using update method of repository
      await this.usersRepository.save(
        Object.assign(user, {
          firstName,
          lastName,
          password,
          invitationToken: null,
        })
      );

      const organizationUser = user.organizationUsers[0];
      this.organizationUsersRepository.update(organizationUser.id, {
        status: 'active',
      });

      if (newSignup) {
        this.organizationsRepository.update(user.organizationId, {
          name: organization,
        });
      }
    }
  }

  async update(userId: string, params: any, manager?: EntityManager) {
    const { forgotPasswordToken, password, firstName, lastName, addGroups, removeGroups } = params;

    const hashedPassword = password ? bcrypt.hashSync(password, 10) : undefined;

    const updateableParams = {
      forgotPasswordToken,
      firstName,
      lastName,
      password: hashedPassword,
    };

    // removing keys with undefined values
    Object.keys(updateableParams).forEach((key) =>
      updateableParams[key] === undefined ? delete updateableParams[key] : {}
    );

    let user: User;

    const performUpdateInTransaction = async (manager) => {
      await manager.update(User, userId, { ...updateableParams });
      user = await manager.findOne(User, { id: userId });

      await this.removeUserGroupPermissionsIfExists(manager, user, removeGroups);

      await this.addUserGroupPermissions(manager, user, addGroups);
    };

    if (manager) {
      await performUpdateInTransaction(manager);
    } else {
      await getManager().transaction(async (manager) => {
        await performUpdateInTransaction(manager);
      });
    }

    return user;
  }

  async addUserGroupPermissions(manager: EntityManager, user: User, addGroups: string[]) {
    if (addGroups) {
      const orgGroupPermissions = await this.groupPermissionsForOrganization(user.organizationId);

      for (const group of addGroups) {
        const orgGroupPermission = orgGroupPermissions.find((permission) => permission.group == group);

        if (orgGroupPermission) {
          const userGroupPermission = manager.create(UserGroupPermission, {
            groupPermissionId: orgGroupPermission.id,
            userId: user.id,
          });
          manager.save(userGroupPermission);
        } else {
          throw new BadRequestException(`${group} group does not exist for current organization`);
        }
      }
    }
  }

  async removeUserGroupPermissionsIfExists(manager: EntityManager, user: User, removeGroups: string[]) {
    if (removeGroups) {
      await this.throwErrorIfRemovingLastActiveAdmin(user, removeGroups);

      const groupPermissions = await manager.find(GroupPermission, {
        group: In(removeGroups),
        organizationId: user.organizationId,
      });
      const groupIdsToMaybeRemove = groupPermissions.map((permission) => permission.id);

      await manager.delete(UserGroupPermission, {
        groupPermissionId: In(groupIdsToMaybeRemove),
        userId: user.id,
      });
    }
  }

  async throwErrorIfRemovingLastActiveAdmin(user: User, removeGroups: string[]) {
    const removingAdmin = removeGroups.includes('admin');
    if (!removingAdmin) return;

    const result = await createQueryBuilder(User, 'users')
      .innerJoin('users.groupPermissions', 'group_permissions')
      .innerJoin('users.organizationUsers', 'organization_users')
      .where('organization_users.user_id != :userId', { userId: user.id })
      .andWhere('organization_users.status = :status', { status: 'active' })
      .andWhere('group_permissions.group = :group', { group: 'admin' })
      .andWhere('group_permissions.organization_id = :organizationId', {
        organizationId: user.organizationId,
      })
      .getCount();

    if (result == 0) throw new BadRequestException('Atleast one active admin is required.');
  }

  async hasGroup(user: User, group: string, organizationId?: string): Promise<boolean> {
    // Currently user can be part of single organization and
    // the organization id is present on the user itself
    const orgId = organizationId || user.organizationId;

    const result = await createQueryBuilder(GroupPermission, 'group_permissions')
      .innerJoin('group_permissions.userGroupPermission', 'user_group_permissions')
      .where('group_permissions.organization_id = :organizationId', {
        organizationId: orgId,
      })
      .andWhere('group_permissions.group = :group ', { group })
      .andWhere('user_group_permissions.user_id = :userId', { userId: user.id })
      .getCount();

    return result > 0;
  }

  async userCan(user: User, action: string, entityName: string, resourceId?: string): Promise<boolean> {
    switch (entityName) {
      case 'App':
        if (action == 'create') {
          return await this.hasGroup(user, 'admin');
        } else {
          return this.canAnyGroupPerformAction(action, await this.appGroupPermissions(user, resourceId));
        }

      default:
        return false;
    }
  }

  canAnyGroupPerformAction(action: string, permissions: AppGroupPermission[]): boolean {
    return permissions.some((p) => p[action.toLowerCase()]);
  }

  async groupPermissions(user: User, organizationId?: string): Promise<GroupPermission[]> {
    const orgUserGroupPermissions = await this.userGroupPermissions(user, organizationId);
    const groupIds = orgUserGroupPermissions.map((p) => p.groupPermissionId);
    const groupPermissionRepository = getRepository(GroupPermission);

    return await groupPermissionRepository.findByIds(groupIds);
  }

  async groupPermissionsForOrganization(organizationId: string) {
    const groupPermissionRepository = getRepository(GroupPermission);

    return await groupPermissionRepository.find({ organizationId });
  }

  async appGroupPermissions(user: User, appId: string, organizationId?: string): Promise<AppGroupPermission[]> {
    const orgUserGroupPermissions = await this.userGroupPermissions(user, organizationId);
    const groupIds = orgUserGroupPermissions.map((p) => p.groupPermissionId);
    const appGroupPermissionRepository = getRepository(AppGroupPermission);

    return await appGroupPermissionRepository.find({
      groupPermissionId: In(groupIds),
      appId: appId,
    });
  }

  async userGroupPermissions(user: User, organizationId?: string): Promise<UserGroupPermission[]> {
    // Currently user can be part of single organization
    // and hence we can use organization_id on user entity
    const orgId = organizationId || user.organizationId;

    return await createQueryBuilder(UserGroupPermission, 'user_group_permissions')
      .innerJoin('user_group_permissions.groupPermission', 'group_permissions')
      .where('group_permissions.organization_id = :organizationId', {
        organizationId: orgId,
      })
      .andWhere('user_group_permissions.user_id = :userId', { userId: user.id })
      .getMany();
  }
}
