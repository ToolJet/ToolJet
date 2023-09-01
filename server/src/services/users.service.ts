import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { FilesService } from '../services/files.service';
import { App } from 'src/entities/app.entity';
import { Brackets, createQueryBuilder, EntityManager, getManager, getRepository, In, Repository } from 'typeorm';
import { AppGroupPermission } from 'src/entities/app_group_permission.entity';
import { UserGroupPermission } from 'src/entities/user_group_permission.entity';
import { GroupPermission } from 'src/entities/group_permission.entity';
import { BadRequestException } from '@nestjs/common';
import { cleanObject, dbTransactionWrap, generatePayloadForLimits, isSuperAdmin } from 'src/helpers/utils.helper';
import { CreateFileDto } from '@dto/create-file.dto';
import got from 'got';
import { LIMIT_TYPE, USER_STATUS, USER_TYPE, WORKSPACE_USER_STATUS } from 'src/helpers/user_lifecycle';
import { Organization } from 'src/entities/organization.entity';
import { ConfigService } from '@nestjs/config';
import { OrganizationUser } from 'src/entities/organization_user.entity';
import { UserDetails } from 'src/entities/user_details.entity';
import { DataSourceGroupPermission } from 'src/entities/data_source_group_permission.entity';
import { LicenseService } from './license.service';
import { LICENSE_FIELD, LICENSE_LIMIT, LICENSE_LIMITS_LABEL } from 'src/helpers/license.helper';
const uuid = require('uuid');
const bcrypt = require('bcrypt');
const freshDeskBaseUrl = 'https://tooljet-417912114917301615.myfreshworks.com/crm/sales/api/';

type FetchInstanceUsersResponse = {
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  id: string;
  avatarId: string;
  organizationUsers: OrganizationUser[];
  totalOrganizations: number;
};
type UserFilterOptions = { searchText?: string; status?: string };

@Injectable()
export class UsersService {
  constructor(
    private readonly filesService: FilesService,
    private readonly licenseService: LicenseService,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(App)
    private appsRepository: Repository<App>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    private configService: ConfigService
  ) {}

  usersQuery(options: UserFilterOptions, condition?: 'and' | 'or') {
    const defaultConditions = () => {
      return new Brackets((qb) => {
        if (options?.searchText) {
          qb.orWhere('lower(user.email) like :email', {
            email: `%${options?.searchText.toLowerCase()}%`,
          })
            .orWhere('lower(user.firstName) like :firstName', {
              firstName: `%${options?.searchText.toLowerCase()}%`,
            })
            .orWhere('lower(user.lastName) like :lastName', {
              lastName: `%${options?.searchText.toLowerCase()}%`,
            });
        }
      });
    };

    const getOrConditions = () => {
      return new Brackets((qb) => {
        if (options?.status)
          qb.orWhere('user.status = :status', {
            status: `${options?.status}`,
          });
      });
    };
    const getAndConditions = () => {
      return new Brackets((qb) => {
        if (options?.status)
          qb.andWhere('user.status = :status', {
            status: `${options?.status}`,
          });
      });
    };

    const query = this.usersRepository
      .createQueryBuilder('user')
      .addSelect(['user.id, user.email, user.firstName, user.lastName, user.avatarId', 'user.status', 'user.userType'])
      .leftJoin('user.organizationUsers', 'organizationUsers')
      .addSelect(['organizationUsers.id', 'organizationUsers.status', 'organizationUsers.organizationId'])
      .leftJoin('organizationUsers.organization', 'organization')
      .addSelect(['organization.name']);
    query.andWhere(defaultConditions()).andWhere(condition === 'and' ? getAndConditions() : getOrConditions());
    return query;
  }

  async findInstanceUsers(page = 1, options: any): Promise<FetchInstanceUsersResponse[]> {
    const allUsers = await this.usersQuery(options)
      .orderBy('user.createdAt', 'ASC')
      .take(10)
      .skip(10 * (page - 1))
      .getMany();

    return allUsers?.map((user) => {
      return {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        name: `${user.firstName || ''}${user.lastName ? ` ${user.lastName}` : ''}`,
        id: user.id,
        avatarId: user.avatarId,
        organizationUsers: user.organizationUsers,
        totalOrganizations: user.organizationUsers.length,
        userType: user.userType,
        status: user.status,
      };
    });
  }

  async instanceUsersCount(options: any): Promise<number> {
    const condition = options?.searchText ? 'and' : 'or';
    return await this.usersQuery(options, condition).getCount();
  }

  async findSuperAdmins(): Promise<User[]> {
    return await this.usersRepository.find({ userType: USER_TYPE.INSTANCE });
  }

  async getCount(isOnlyActive?: boolean, manager?: EntityManager): Promise<number> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const statusList = [USER_STATUS.INVITED, USER_STATUS.ACTIVE];
      !isOnlyActive && statusList.push(USER_STATUS.ARCHIVED);
      return await manager
        .createQueryBuilder(User, 'users')
        .innerJoin('users.organizationUsers', 'organization_users', 'organization_users.status IN (:...statusList)', {
          statusList,
        })
        .select('users.id')
        .distinct()
        .getCount();
    }, manager);
  }

  async findOne(id: string): Promise<User> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findByEmail(
    email: string,
    organizationId?: string,
    status?: string | Array<string>,
    manager?: EntityManager
  ): Promise<User> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      let user: User;
      if (!organizationId) {
        user = await manager.findOne(User, {
          where: { email },
        });
      } else {
        const statusList = status
          ? typeof status === 'object'
            ? status
            : [status]
          : [WORKSPACE_USER_STATUS.ACTIVE, WORKSPACE_USER_STATUS.INVITED, WORKSPACE_USER_STATUS.ARCHIVED];
        user = await manager
          .createQueryBuilder(User, 'users')
          .innerJoinAndSelect(
            'users.organizationUsers',
            'organization_users',
            'organization_users.organizationId = :organizationId',
            { organizationId }
          )
          .leftJoinAndSelect('users.userDetails', 'user_details')
          .where('organization_users.status IN(:...statusList)', {
            statusList,
          })
          .andWhere('users.email = :email', { email })
          .getOne();

        if (!user) {
          user = await this.usersRepository.findOne({
            where: { email },
          });

          if (isSuperAdmin(user)) {
            await this.setupSuperAdmin(user, organizationId);
          } else {
            return;
          }
        }
      }
      return user;
    }, manager);
  }

  async setupSuperAdmin(user: User, organizationId?: string): Promise<void> {
    const organizations: Organization[] = await this.organizationRepository.find(
      organizationId ? { where: { id: organizationId } } : {}
    );
    user.organizationUsers = organizations?.map((organization): OrganizationUser => {
      return {
        id: uuid.v4(),
        userId: user.id,
        organizationId: organization.id,
        organization: organization,
        status: 'active',
        role: null,
        invitationToken: null,
        createdAt: null,
        updatedAt: null,
        user,
        hasId: null,
        save: null,
        remove: null,
        softRemove: null,
        recover: null,
        reload: null,
      };
    });
  }

  async findByPasswordResetToken(token: string): Promise<User> {
    return this.usersRepository.findOne({
      where: { forgotPasswordToken: token },
    });
  }

  async create(
    userParams: Partial<User>,
    organizationId: string,
    groups?: string[],
    existingUser?: User,
    isInvite?: boolean,
    defaultOrganizationId?: string,
    manager?: EntityManager
  ): Promise<User> {
    const { email, firstName, lastName, password, source, status, phoneNumber } = userParams;
    let user: User;

    await dbTransactionWrap(async (manager: EntityManager) => {
      const userType = (await manager.count(User)) === 0 ? USER_TYPE.INSTANCE : USER_TYPE.WORKSPACE;

      if (!existingUser) {
        user = manager.create(User, {
          email,
          firstName,
          lastName,
          password,
          phoneNumber,
          source,
          status,
          userType,
          invitationToken: isInvite ? uuid.v4() : null,
          defaultOrganizationId: defaultOrganizationId || organizationId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        await manager.save(user);
      } else {
        user = existingUser;
      }
      await this.attachUserGroup(groups, organizationId, user.id, source === 'ldap', manager);
    }, manager);

    return user;
  }

  async attachUserGroup(
    groups: string[],
    organizationId: string,
    userId: string,
    isValidateExistingGroups = false,
    manager?: EntityManager
  ) {
    await dbTransactionWrap(async (manager: EntityManager) => {
      const organizationGroups = await manager.find(GroupPermission, {
        where: {
          organizationId,
        },
      });

      if (isValidateExistingGroups) {
        const existedGroups = organizationGroups.map((organizationGroup) => organizationGroup.group);
        groups = groups.filter((group) => existedGroups.includes(group));
      }

      for (const group of groups) {
        const orgGroupPermission = organizationGroups.find((organizationGroup) => organizationGroup.group === group);

        if (!orgGroupPermission) {
          throw new BadRequestException(`${group} group does not exist for current organization`);
        }
        const userGroupPermission = manager.create(UserGroupPermission, {
          groupPermissionId: orgGroupPermission.id,
          userId: userId,
        });
        await manager.save(userGroupPermission);
      }
    }, manager);
  }

  async update(userId: string, params: any, manager?: EntityManager, organizationId?: string) {
    const { forgotPasswordToken, password, firstName, lastName, addGroups, removeGroups, source } = params;

    const hashedPassword = password ? bcrypt.hashSync(password, 10) : undefined;

    const updatableParams = {
      forgotPasswordToken,
      firstName,
      lastName,
      password: hashedPassword,
      source,
    };

    // removing keys with undefined values
    cleanObject(updatableParams);

    return await dbTransactionWrap(async (manager: EntityManager) => {
      await manager.update(User, userId, updatableParams);
      const user = await manager.findOne(User, { where: { id: userId } });
      await this.removeUserGroupPermissionsIfExists(manager, user, removeGroups, organizationId);
      await this.addUserGroupPermissions(manager, user, addGroups, organizationId);
      return user;
    }, manager);
  }

  async updateUser(userId: string, updatableParams: Partial<User>, manager?: EntityManager) {
    if (updatableParams.password) {
      updatableParams.password = bcrypt.hashSync(updatableParams.password, 10);
    }
    await dbTransactionWrap(async (manager: EntityManager) => {
      await manager.update(User, userId, updatableParams);
      if (updatableParams.userType) {
        await this.validateLicense(manager);
      }
    }, manager);
  }

  async addUserGroupPermissions(manager: EntityManager, user: User, addGroups: string[], organizationId?: string) {
    const orgId = organizationId || user.defaultOrganizationId;
    if (addGroups) {
      const orgGroupPermissions = await this.groupPermissionsForOrganization(orgId);

      for (const group of addGroups) {
        const orgGroupPermission = orgGroupPermissions.find((permission) => permission.group == group);

        if (!orgGroupPermission) {
          throw new BadRequestException(`${group} group does not exist for current organization`);
        }
        await dbTransactionWrap(async (manager: EntityManager) => {
          const userGroupPermission = manager.create(UserGroupPermission, {
            groupPermissionId: orgGroupPermission.id,
            userId: user.id,
          });
          await manager.save(userGroupPermission);
        }, manager);
      }
    }
  }

  async removeUserGroupPermissionsIfExists(
    manager: EntityManager,
    user: User,
    removeGroups: string[],
    organizationId?: string
  ) {
    const orgId = organizationId || user.defaultOrganizationId;
    if (removeGroups) {
      await this.throwErrorIfRemovingLastActiveAdmin(user, removeGroups, orgId);
      if (removeGroups.includes('all_users')) {
        throw new BadRequestException('Cannot remove user from default group.');
      }

      await dbTransactionWrap(async (manager: EntityManager) => {
        const groupPermissions = await manager.find(GroupPermission, {
          group: In(removeGroups),
          organizationId: orgId,
        });
        const groupIdsToMaybeRemove = groupPermissions.map((permission) => permission.id);

        await manager.delete(UserGroupPermission, {
          groupPermissionId: In(groupIdsToMaybeRemove),
          userId: user.id,
        });
      }, manager);
    }
  }

  async throwErrorIfRemovingLastActiveAdmin(user: User, removeGroups: string[] = ['admin'], organizationId: string) {
    const removingAdmin = removeGroups.includes('admin');
    if (!removingAdmin) return;

    const result = await createQueryBuilder(User, 'users')
      .innerJoin('users.groupPermissions', 'group_permissions')
      .innerJoin('users.organizationUsers', 'organization_users')
      .where('organization_users.user_id != :userId', { userId: user.id })
      .andWhere('organization_users.status = :status', { status: WORKSPACE_USER_STATUS.ACTIVE })
      .andWhere('group_permissions.group = :group', { group: 'admin' })
      .andWhere('group_permissions.organization_id = :organizationId', {
        organizationId,
      })
      .getCount();

    if (result == 0) throw new BadRequestException('Atleast one active admin is required.');
  }

  async hasGroup(user: User, group: string, organizationId?: string, manager?: EntityManager): Promise<boolean> {
    if (isSuperAdmin(user)) {
      return true;
    }
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const result = await manager
        .createQueryBuilder(GroupPermission, 'group_permissions')
        .innerJoin('group_permissions.userGroupPermission', 'user_group_permissions')
        .where('group_permissions.organization_id = :organizationId', {
          organizationId: organizationId || user.organizationId,
        })
        .andWhere('group_permissions.group = :group ', { group })
        .andWhere('user_group_permissions.user_id = :userId', { userId: user.id })
        .getCount();

      return result > 0;
    }, manager);
  }

  async userCan(user: User, action: string, entityName: string, resourceId?: string): Promise<boolean> {
    if (isSuperAdmin(user)) {
      return true;
    }
    switch (entityName) {
      case 'App':
        return await this.canUserPerformActionOnApp(user, action, resourceId);

      case 'User':
      case 'Plugin':
      case 'CustomStyle':
        return await this.hasGroup(user, 'admin');

      case 'Thread':
      case 'Comment':
        return await this.canUserPerformActionOnApp(user, 'update', resourceId);

      case 'Folder':
        return await this.canUserPerformActionOnFolder(user, action);

      case 'OrgEnvironmentVariable':
        return await this.canUserPerformActionOnEnvironmentVariable(user, action);

      case 'GlobalDataSource':
        return await this.canUserPerformActionOnDataSources(user, action, resourceId);

      case 'OrganizationConstant':
        return await this.canUserPerformActionOnOrgEnvironmentConstants(user, action);

      default:
        return false;
    }
  }

  async canUserPerformActionOnApp(user: User, action: string, appId?: string): Promise<boolean> {
    let permissionGrant: boolean;

    switch (action) {
      case 'create':
        permissionGrant = this.canAnyGroupPerformAction('appCreate', await this.groupPermissions(user));
        break;
      case 'read':
      case 'update':
        permissionGrant =
          this.canAnyGroupPerformAction(action, await this.appGroupPermissions(user, appId)) ||
          (await this.isUserOwnerOfApp(user, appId));
        break;
      case 'delete':
        permissionGrant =
          this.canAnyGroupPerformAction('delete', await this.appGroupPermissions(user, appId)) ||
          this.canAnyGroupPerformAction('appDelete', await this.groupPermissions(user)) ||
          (await this.isUserOwnerOfApp(user, appId));
        break;
      default:
        permissionGrant = false;
        break;
    }

    return permissionGrant;
  }

  async canUserPerformActionOnDataSources(user: User, action: string, dataSourceId?: string): Promise<boolean> {
    let permissionGrant: boolean;

    switch (action) {
      case 'create':
        permissionGrant = this.canAnyGroupPerformAction('dataSourceCreate', await this.groupPermissions(user));
        break;
      case 'read':
      case 'update':
        permissionGrant = this.canAnyGroupPerformAction(
          action,
          await this.dataSourceGroupPermissions(user, dataSourceId)
        );
        break;
      case 'delete':
        permissionGrant =
          this.canAnyGroupPerformAction('delete', await this.dataSourceGroupPermissions(user)) ||
          this.canAnyGroupPerformAction('dataSourceDelete', await this.groupPermissions(user));
        break;
      default:
        permissionGrant = false;
        break;
    }

    return permissionGrant;
  }

  async canUserPerformActionOnFolder(user: User, action: string): Promise<boolean> {
    let permissionGrant: boolean;

    switch (action) {
      case 'create':
        permissionGrant = this.canAnyGroupPerformAction('folderCreate', await this.groupPermissions(user));
        break;
      case 'update':
        permissionGrant = this.canAnyGroupPerformAction('folderUpdate', await this.groupPermissions(user));
        break;
      case 'delete':
        permissionGrant = this.canAnyGroupPerformAction('folderDelete', await this.groupPermissions(user));
        break;
      default:
        permissionGrant = false;
        break;
    }

    return permissionGrant;
  }

  async canUserPerformActionOnEnvironmentVariable(user: User, action: string): Promise<boolean> {
    let permissionGrant: boolean;

    switch (action) {
      case 'create':
        permissionGrant = this.canAnyGroupPerformAction(
          'orgEnvironmentVariableCreate',
          await this.groupPermissions(user)
        );
        break;
      case 'update':
        permissionGrant = this.canAnyGroupPerformAction(
          'orgEnvironmentVariableUpdate',
          await this.groupPermissions(user)
        );
        break;
      case 'delete':
        permissionGrant = this.canAnyGroupPerformAction(
          'orgEnvironmentVariableDelete',
          await this.groupPermissions(user)
        );
        break;
      default:
        permissionGrant = false;
        break;
    }

    return permissionGrant;
  }

  async canUserPerformActionOnOrgEnvironmentConstants(user: User, action: string): Promise<boolean> {
    let permissionGrant: boolean;

    switch (action) {
      case 'create':
      case 'update':
        permissionGrant = this.canAnyGroupPerformAction(
          'orgEnvironmentConstantCreate',
          await this.groupPermissions(user)
        );
        break;

      case 'delete':
        permissionGrant = this.canAnyGroupPerformAction(
          'orgEnvironmentConstantDelete',
          await this.groupPermissions(user)
        );
        break;
      default:
        permissionGrant = false;
        break;
    }

    return permissionGrant;
  }

  async isUserOwnerOfApp(user: User, appId: string): Promise<boolean> {
    const app: App = await this.appsRepository.findOne({
      where: {
        id: appId,
        userId: user.id,
      },
    });
    return !!app && app.organizationId === user.organizationId;
  }

  async returnOrgIdOfAnApp(slug: string): Promise<{ organizationId: string; isPublic: boolean }> {
    let app: App;
    try {
      app = await this.appsRepository.findOneOrFail(slug);
    } catch (error) {
      app = await this.appsRepository.findOne({
        slug,
      });
    }

    return { organizationId: app?.organizationId, isPublic: app?.isPublic };
  }

  async addAvatar(userId: string, imageBuffer: Buffer, filename: string, manager?: EntityManager) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const user = await manager.findOne(User, userId);
      const currentAvatarId = user.avatarId;
      const createFileDto = new CreateFileDto();
      createFileDto.filename = filename;
      createFileDto.data = imageBuffer;
      const avatar = await this.filesService.create(createFileDto, manager);

      await manager.update(User, userId, {
        avatarId: avatar.id,
      });

      if (currentAvatarId) {
        await this.filesService.remove(currentAvatarId, manager);
      }
      return avatar;
    }, manager);
  }

  canAnyGroupPerformAction(
    action: string,
    permissions: AppGroupPermission[] | GroupPermission[] | DataSourceGroupPermission[]
  ): boolean {
    return permissions.some((p) => p[action]);
  }

  async groupPermissions(user: User, manager?: EntityManager): Promise<GroupPermission[]> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const orgUserGroupPermissions = await this.userGroupPermissions(user, user.organizationId, manager);
      const groupIds = orgUserGroupPermissions.map((p) => p.groupPermissionId);

      return await manager.findByIds(GroupPermission, groupIds);
    }, manager);
  }

  async groupPermissionsForOrganization(organizationId: string) {
    const groupPermissionRepository = getRepository(GroupPermission);

    return await groupPermissionRepository.find({ organizationId });
  }

  async appGroupPermissions(user: User, appId?: string, manager?: EntityManager): Promise<AppGroupPermission[]> {
    const orgUserGroupPermissions = await this.userGroupPermissions(user, user.organizationId, manager);
    const groupIds = orgUserGroupPermissions.map((p) => p.groupPermissionId);

    if (!groupIds || groupIds.length === 0) {
      return [];
    }
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const query = manager
        .createQueryBuilder(AppGroupPermission, 'app_group_permissions')
        .innerJoin(
          'app_group_permissions.groupPermission',
          'group_permissions',
          'group_permissions.organization_id = :organizationId',
          {
            organizationId: user.organizationId,
          }
        )
        .where('app_group_permissions.groupPermissionId IN (:...groupIds)', { groupIds });

      if (appId) {
        query.andWhere('app_group_permissions.appId = :appId', { appId });
      }
      return await query.getMany();
    }, manager);
  }

  async dataSourceGroupPermissions(
    user: User,
    dataSourceId?: string,
    manager?: EntityManager
  ): Promise<DataSourceGroupPermission[]> {
    const orgUserGroupPermissions = await this.userGroupPermissions(user, user.organizationId, manager);
    const groupIds = orgUserGroupPermissions.map((p) => p.groupPermissionId);

    if (!groupIds || groupIds.length === 0) {
      return [];
    }
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const query = manager
        .createQueryBuilder(DataSourceGroupPermission, 'data_source_group_permissions')
        .innerJoin(
          'data_source_group_permissions.groupPermission',
          'group_permissions',
          'group_permissions.organization_id = :organizationId',
          {
            organizationId: user.organizationId,
          }
        )
        .where('data_source_group_permissions.groupPermissionId IN (:...groupIds)', { groupIds });
      if (dataSourceId) {
        query.andWhere('data_source_group_permissions.dataSourceId = :dataSourceId', { dataSourceId });
      }
      return await query.getMany();
    }, manager);
  }

  async userGroupPermissions(
    user: User,
    organizationId?: string,
    manager?: EntityManager
  ): Promise<UserGroupPermission[]> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await manager
        .createQueryBuilder(UserGroupPermission, 'user_group_permissions')
        .innerJoin('user_group_permissions.groupPermission', 'group_permissions')
        .where('group_permissions.organization_id = :organizationId', {
          organizationId: organizationId || user.organizationId,
        })
        .andWhere('user_group_permissions.user_id = :userId', { userId: user.id })
        .getMany();
    }, manager);
  }

  private async getUserIdWithEditPermission(manager: EntityManager) {
    const statusList = ['invited', 'active'];
    const userIdsWithEditPermissions = (
      await manager
        .createQueryBuilder(User, 'users')
        .innerJoin('users.groupPermissions', 'group_permissions')
        .leftJoin('group_permissions.appGroupPermission', 'app_group_permissions')
        .innerJoin('users.organizationUsers', 'organization_users', 'organization_users.status IN (:...statusList)', {
          statusList,
        })
        .andWhere('users.status != :archived', { archived: USER_STATUS.ARCHIVED })
        .andWhere(
          new Brackets((qb) => {
            qb.where('app_group_permissions.read = true AND app_group_permissions.update = true').orWhere(
              'group_permissions.appCreate = true'
            );
          })
        )
        .select('users.id')
        .distinct()
        .getMany()
    ).map((record) => record.id);

    const userIdsOfAppOwners = (
      await manager
        .createQueryBuilder(User, 'users')
        .innerJoin('users.apps', 'apps')
        .innerJoin('users.organizationUsers', 'organization_users', 'organization_users.status IN (:...statusList)', {
          statusList,
        })
        .andWhere('users.status != :archived', { archived: USER_STATUS.ARCHIVED })
        .select('users.id')
        .distinct()
        .getMany()
    ).map((record) => record.id);

    const userIdsOfSuperAdmins = (
      await manager
        .createQueryBuilder(User, 'users')
        .select('users.id')
        .where('users.userType = :userType', { userType: USER_TYPE.INSTANCE })
        .andWhere('users.status = :status', { status: USER_STATUS.ACTIVE })
        .getMany()
    ).map((record) => record.id);

    return [...new Set([...userIdsWithEditPermissions, ...userIdsOfAppOwners, ...userIdsOfSuperAdmins])];
  }

  async fetchTotalEditorCount(manager: EntityManager): Promise<number> {
    const userIdsWithEditPermissions = await this.getUserIdWithEditPermission(manager);
    return userIdsWithEditPermissions?.length || 0;
  }

  async fetchTotalViewerEditorCount(manager: EntityManager): Promise<{ editor: number; viewer: number }> {
    const userIdsWithEditPermissions = await this.getUserIdWithEditPermission(manager);

    if (!userIdsWithEditPermissions?.length) {
      // No editors -> No viewers
      return { editor: 0, viewer: 0 };
    }

    const statusList = [USER_STATUS.INVITED, USER_STATUS.ACTIVE];
    const viewer = await manager
      .createQueryBuilder(User, 'users')
      .innerJoin('users.groupPermissions', 'group_permissions')
      .leftJoin(
        'group_permissions.appGroupPermission',
        'app_group_permissions',
        'app_group_permissions.read = true AND app_group_permissions.update = false'
      )
      .innerJoin('users.organizationUsers', 'organization_users', 'organization_users.status IN (:...statusList)', {
        statusList,
      })
      .andWhere('users.status != :archived', { archived: USER_STATUS.ARCHIVED })
      .andWhere('users.id NOT IN(:...userIdsWithEditPermissions)', { userIdsWithEditPermissions })
      .select('users.id')
      .distinct()
      .getCount();

    return { editor: userIdsWithEditPermissions?.length || 0, viewer };
  }

  async fetchTotalSuperadminCount(manager: EntityManager): Promise<number> {
    return await manager
      .createQueryBuilder(User, 'users')
      .where('users.userType = :userType', { userType: USER_TYPE.INSTANCE })
      .andWhere('users.status != :archived', { archived: USER_STATUS.ARCHIVED })
      .getCount();
  }

  async validateLicense(manager: EntityManager): Promise<void> {
    let editor = -1,
      viewer = -1,
      superadmin = -1;
    const {
      allUsers: { total: users, editors: editorUsers, viewers: viewerUsers, superadmins: superadminUsers },
      expired: isExpired,
    } = await this.licenseService.getLicenseTerms([LICENSE_FIELD.USER, LICENSE_FIELD.IS_EXPIRED]);

    if (isExpired) {
      return;
    }

    if (superadminUsers !== LICENSE_LIMIT.UNLIMITED) {
      if (superadmin === -1) {
        superadmin = await this.fetchTotalSuperadminCount(manager);
      }
      if (superadmin > superadminUsers) {
        throw new HttpException('You have reached your limit for number of super admins.', 451);
      }
    }

    if (users !== LICENSE_LIMIT.UNLIMITED && (await this.getCount(true, manager)) > users) {
      throw new HttpException('You have reached your limit for number of users.', 451);
    }

    if (editorUsers !== LICENSE_LIMIT.UNLIMITED && viewerUsers !== LICENSE_LIMIT.UNLIMITED) {
      ({ editor, viewer } = await this.fetchTotalViewerEditorCount(manager));
    }
    if (editorUsers !== LICENSE_LIMIT.UNLIMITED) {
      if (editor === -1) {
        editor = await this.fetchTotalEditorCount(manager);
      }
      if (editor > editorUsers) {
        throw new HttpException('You have reached your limit for number of builders.', 451);
      }
    }

    if (viewerUsers !== LICENSE_LIMIT.UNLIMITED) {
      if (viewer === -1) {
        ({ viewer } = await this.fetchTotalViewerEditorCount(manager));
      }
      const addedUsers = await this.getCount(true, manager);
      const addableUsers = users - addedUsers;

      if (viewer > viewerUsers && addableUsers < 0) {
        throw new HttpException('You have reached your limit for number of end users.', 451);
      }
    }
  }

  async getUserLimitsByType(type: LIMIT_TYPE) {
    const {
      allUsers: { total: users, editors: editorUsers, viewers: viewerUsers, superadmins: superadminUsers },
      status: licenseStatus,
    } = await this.licenseService.getLicenseTerms([LICENSE_FIELD.USER, LICENSE_FIELD.STATUS]);

    const manager = getManager();

    switch (type) {
      case LIMIT_TYPE.TOTAL: {
        if (users === LICENSE_LIMIT.UNLIMITED) {
          return;
        }
        const currentUsersCount = await this.getCount(true, manager);
        return generatePayloadForLimits(currentUsersCount, users, licenseStatus);
      }
      case LIMIT_TYPE.EDITOR: {
        if (editorUsers === LICENSE_LIMIT.UNLIMITED) {
          return;
        }
        const currentEditorsCount = await this.fetchTotalEditorCount(manager);
        return generatePayloadForLimits(currentEditorsCount, editorUsers, licenseStatus);
      }
      case LIMIT_TYPE.VIEWER: {
        if (viewerUsers === LICENSE_LIMIT.UNLIMITED) {
          return;
        }
        const { viewer: currentViewersCount } = await this.fetchTotalViewerEditorCount(manager);
        return generatePayloadForLimits(currentViewersCount, viewerUsers, licenseStatus);
      }
      case LIMIT_TYPE.ALL: {
        const currentUsersCount = await this.getCount(true, manager);
        const currentEditorsCount = await this.fetchTotalEditorCount(manager);
        const currentSuperadminsCount = await this.fetchTotalSuperadminCount(manager);
        const { viewer: currentViewersCount } = await this.fetchTotalViewerEditorCount(manager);

        return {
          usersCount: generatePayloadForLimits(currentUsersCount, users, licenseStatus, LICENSE_LIMITS_LABEL.USERS),
          editorsCount: generatePayloadForLimits(
            currentEditorsCount,
            editorUsers,
            licenseStatus,
            LICENSE_LIMITS_LABEL.EDIT_USERS
          ),
          viewersCount: generatePayloadForLimits(
            currentViewersCount,
            viewerUsers,
            licenseStatus,
            LICENSE_LIMITS_LABEL.END_USERS
          ),
          superadminsCount: generatePayloadForLimits(
            currentSuperadminsCount,
            superadminUsers,
            licenseStatus,
            LICENSE_LIMITS_LABEL.SUPERADMIN_USERS
          ),
        };
      }
    }
  }

  async createCRMUser(user): Promise<boolean> {
    if (process.env.NODE_ENV === 'test') return true;

    try {
      await got(`${freshDeskBaseUrl}contacts`, {
        method: 'post',
        headers: { Authorization: `Token token=${process.env.FWAPIKey}`, 'Content-Type': 'application/json' },
        json: {
          contact: {
            email: user.email,
            first_name: user.firstName,
            last_name: user.lastName,
            custom_field: {
              job_title: user.role,
            },
          },
        },
      });
    } catch (error) {
      console.error('error while connection to freshDeskBaseUrl : createCRMUser', error);
    }

    return true;
  }

  async updateCRM(user: User): Promise<boolean> {
    if (process.env.NODE_ENV === 'test') return true;

    try {
      const response = await got(`${freshDeskBaseUrl}lookup?q=${user.email}&f=email&entities=contact`, {
        method: 'get',
        headers: {
          Authorization: `Token token=${process.env.FWAPIKey}`,
          'Content-Type': 'application/json',
        },
      });

      const contacts = JSON.parse(response.body)['contacts']['contacts'];
      let contact = undefined;

      if (contacts) {
        if (contacts.length > 0) {
          contact = contacts[0];
        }
      }

      await got(`${freshDeskBaseUrl}contacts/${contact.id}`, {
        method: 'put',
        headers: { Authorization: `Token token=${process.env.FWAPIKey}`, 'Content-Type': 'application/json' },
        json: {
          contact: {
            email: user.email,
            first_name: user.firstName,
            last_name: user.lastName,
            custom_field: {
              job_title: user.role,
            },
          },
        },
      });
    } catch (error) {
      console.error('error while connection to freshDeskBaseUrl : updateCRM', error);
    }

    return true;
  }

  async updateSSOUserInfo(manager: EntityManager, userId: string, ssoUserInfo: any): Promise<void> {
    await manager.upsert(
      UserDetails,
      {
        userId,
        ssoUserInfo,
        updatedAt: new Date(),
      },
      ['userId']
    );
  }
}
