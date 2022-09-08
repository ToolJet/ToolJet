import { HttpException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { FilesService } from '../services/files.service';
import { App } from 'src/entities/app.entity';
import { Brackets, Connection, createQueryBuilder, EntityManager, getRepository, In, Repository } from 'typeorm';
import { AppGroupPermission } from 'src/entities/app_group_permission.entity';
import { UserGroupPermission } from 'src/entities/user_group_permission.entity';
import { GroupPermission } from 'src/entities/group_permission.entity';
import { BadRequestException } from '@nestjs/common';
import { cleanObject, dbTransactionWrap } from 'src/helpers/utils.helper';
import { CreateFileDto } from '@dto/create-file.dto';
import { ConfigService } from '@nestjs/config';
import License from '@ee/licensing/configs/License';
const uuid = require('uuid');
const bcrypt = require('bcrypt');

@Injectable()
export class UsersService {
  constructor(
    private readonly filesService: FilesService,
    private connection: Connection,
    private configService: ConfigService,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(App)
    private appsRepository: Repository<App>
  ) {}

  async findAll(organizationId: string): Promise<User[]> {
    return this.usersRepository.find({
      where: { defaultOrganizationId: organizationId },
      select: ['id', 'email', 'firstName', 'lastName'],
      relations: [],
    });
  }

  async getCount(isOnlyActive?: boolean): Promise<number> {
    const statusList = ['invited', 'active'];
    !isOnlyActive && statusList.push('archived');
    return await createQueryBuilder(User, 'users')
      .innerJoin('users.organizationUsers', 'organization_users', 'organization_users.status IN (:...statusList)', {
        statusList,
      })
      .select('users.id')
      .distinct()
      .getCount();
  }

  async findOne(id: string): Promise<User> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string, organizationId?: string, status?: string | Array<string>): Promise<User> {
    if (!organizationId) {
      return this.usersRepository.findOne({
        where: { email },
      });
    } else {
      const statusList = status ? (typeof status === 'object' ? status : [status]) : ['active', 'invited', 'archived'];
      return await createQueryBuilder(User, 'users')
        .innerJoinAndSelect(
          'users.organizationUsers',
          'organization_users',
          'organization_users.organizationId = :organizationId',
          { organizationId }
        )
        .where('organization_users.status IN(:...statusList)', {
          statusList,
        })
        .andWhere('users.email = :email', { email })
        .getOne();
    }
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
    const password = uuid.v4();

    const { email, firstName, lastName } = userParams;
    let user: User;

    await dbTransactionWrap(async (manager: EntityManager) => {
      if (!existingUser) {
        user = manager.create(User, {
          email,
          firstName,
          lastName,
          password,
          invitationToken: isInvite ? uuid.v4() : null,
          defaultOrganizationId: defaultOrganizationId || organizationId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        await manager.save(user);
      } else {
        user = existingUser;
      }
      await this.attachUserGroup(groups, organizationId, user.id, manager);
    }, manager);

    return user;
  }

  async attachUserGroup(groups, organizationId, userId, manager?: EntityManager) {
    await dbTransactionWrap(async (manager: EntityManager) => {
      for (const group of groups) {
        const orgGroupPermission = await manager.findOne(GroupPermission, {
          where: {
            organizationId: organizationId,
            group: group,
          },
        });

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

  async findOrCreateByEmail(
    userParams: Partial<User>,
    organizationId: string,
    manager?: EntityManager
  ): Promise<{ user: User; newUserCreated: boolean }> {
    let user: User;
    let newUserCreated = false;

    user = await this.findByEmail(userParams.email);

    if (user?.organizationUsers?.some((ou) => ou.organizationId === organizationId)) {
      // User exist in current organization
      return { user, newUserCreated };
    }

    const groups = ['all_users'];
    user = await this.create(userParams, organizationId, groups, user, null, null, manager);
    newUserCreated = true;

    return { user, newUserCreated };
  }

  async update(userId: string, params: any, manager?: EntityManager, organizationId?: string) {
    const { forgotPasswordToken, password, firstName, lastName, addGroups, removeGroups } = params;

    const hashedPassword = password ? bcrypt.hashSync(password, 10) : undefined;

    const updatableParams = {
      forgotPasswordToken,
      firstName,
      lastName,
      password: hashedPassword,
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
      .andWhere('organization_users.status = :status', { status: 'active' })
      .andWhere('group_permissions.group = :group', { group: 'admin' })
      .andWhere('group_permissions.organization_id = :organizationId', {
        organizationId,
      })
      .getCount();

    if (result == 0) throw new BadRequestException('Atleast one active admin is required.');
  }

  async hasGroup(user: User, group: string, organizationId?: string): Promise<boolean> {
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
        return await this.canUserPerformActionOnApp(user, action, resourceId);

      case 'User':
        return await this.hasGroup(user, 'admin');

      case 'Thread':
      case 'Comment':
        return await this.canUserPerformActionOnApp(user, 'update', resourceId);

      case 'Folder':
        return await this.canUserPerformActionOnFolder(user, action);

      case 'OrgEnvironmentVariable':
        return await this.canUserPerformActionOnEnvironmentVariable(user, action);

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

  async isUserOwnerOfApp(user: User, appId: string): Promise<boolean> {
    const app: App = await this.appsRepository.findOne({
      where: {
        id: appId,
        userId: user.id,
      },
    });
    return !!app && app.organizationId === user.organizationId;
  }

  async addAvatar(userId: number, imageBuffer: Buffer, filename: string) {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await queryRunner.manager.findOne(User, userId);
      const currentAvatarId = user.avatarId;
      const createFileDto = new CreateFileDto();
      createFileDto.filename = filename;
      createFileDto.data = imageBuffer;
      const avatar = await this.filesService.create(createFileDto, queryRunner);

      await queryRunner.manager.update(User, userId, {
        avatarId: avatar.id,
      });

      if (currentAvatarId) {
        await this.filesService.remove(currentAvatarId, queryRunner);
      }

      await queryRunner.commitTransaction();

      return avatar;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(error);
    } finally {
      await queryRunner.release();
    }
  }

  canAnyGroupPerformAction(action: string, permissions: AppGroupPermission[] | GroupPermission[]): boolean {
    return permissions.some((p) => p[action]);
  }

  async groupPermissions(user: User): Promise<GroupPermission[]> {
    const orgUserGroupPermissions = await this.userGroupPermissions(user, user.organizationId);
    const groupIds = orgUserGroupPermissions.map((p) => p.groupPermissionId);
    const groupPermissionRepository = getRepository(GroupPermission);

    return await groupPermissionRepository.findByIds(groupIds);
  }

  async groupPermissionsForOrganization(organizationId: string) {
    const groupPermissionRepository = getRepository(GroupPermission);

    return await groupPermissionRepository.find({ organizationId });
  }

  async appGroupPermissions(user: User, appId?: string): Promise<AppGroupPermission[]> {
    const orgUserGroupPermissions = await this.userGroupPermissions(user, user.organizationId);
    const groupIds = orgUserGroupPermissions.map((p) => p.groupPermissionId);

    if (!groupIds || groupIds.length === 0) {
      return [];
    }

    const query = createQueryBuilder(AppGroupPermission, 'app_group_permissions')
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
  }

  async userGroupPermissions(user: User, organizationId?: string): Promise<UserGroupPermission[]> {
    const orgId = organizationId || user.organizationId;

    return await createQueryBuilder(UserGroupPermission, 'user_group_permissions')
      .innerJoin('user_group_permissions.groupPermission', 'group_permissions')
      .where('group_permissions.organization_id = :organizationId', {
        organizationId: orgId,
      })
      .andWhere('user_group_permissions.user_id = :userId', { userId: user.id })
      .getMany();
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
        .where(
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
      await createQueryBuilder(User, 'users')
        .innerJoin('users.apps', 'apps')
        .innerJoin('users.organizationUsers', 'organization_users', 'organization_users.status IN (:...statusList)', {
          statusList,
        })
        .select('users.id')
        .distinct()
        .getMany()
    ).map((record) => record.id);

    return [...new Set([...userIdsWithEditPermissions, ...userIdsOfAppOwners])];
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

    const statusList = ['invited', 'active'];
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
      .where('users.id NOT IN(:...userIdsWithEditPermissions)', { userIdsWithEditPermissions })
      .select('users.id')
      .distinct()
      .getCount();

    return { editor: userIdsWithEditPermissions?.length || 0, viewer };
  }

  async validateLicense(manager: EntityManager): Promise<void> {
    const licensing = License.Instance;
    let editor = -1,
      viewer = -1;

    if (licensing.users !== 'UNLIMITED' && (await this.getCount(true)) > licensing.users) {
      throw new HttpException('License violation - Maximum user limit reached', 451);
    }

    if (licensing.editorUsers !== 'UNLIMITED' && licensing.viewerUsers !== 'UNLIMITED') {
      ({ editor, viewer } = await this.fetchTotalViewerEditorCount(manager));
    }
    if (licensing.editorUsers !== 'UNLIMITED') {
      if (editor === -1) {
        editor = await this.fetchTotalEditorCount(manager);
      }
      if (editor > licensing.editorUsers) {
        throw new HttpException('License violation - Number of editors exceeded', 451);
      }
    }

    if (licensing.viewerUsers !== 'UNLIMITED') {
      if (viewer === -1) {
        ({ viewer } = await this.fetchTotalViewerEditorCount(manager));
      }
      if (viewer > licensing.viewerUsers) {
        throw new HttpException('License violation - Number of viewers exceeded', 451);
      }
    }
  }
}
