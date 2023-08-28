import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, createQueryBuilder, In, Not, EntityManager, Brackets } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { GroupPermission } from 'src/entities/group_permission.entity';
import { App } from 'src/entities/app.entity';
import { AppGroupPermission } from 'src/entities/app_group_permission.entity';
import { UserGroupPermission } from 'src/entities/user_group_permission.entity';
import { UsersService } from './users.service';
import { dbTransactionWrap } from 'src/helpers/utils.helper';

@Injectable()
export class GroupPermissionsService {
  constructor(
    @InjectRepository(GroupPermission)
    private groupPermissionsRepository: Repository<GroupPermission>,

    @InjectRepository(AppGroupPermission)
    private appGroupPermissionsRepository: Repository<AppGroupPermission>,

    @InjectRepository(UserGroupPermission)
    private userGroupPermissionsRepository: Repository<UserGroupPermission>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(App)
    private appRepository: Repository<App>,

    private usersService: UsersService
  ) {}

  async create(user: User, group: string, manager?: EntityManager): Promise<void> {
    if (!group || group === '') {
      throw new BadRequestException('Cannot create group without name');
    }

    const reservedGroups = ['All Users', 'Admin'];

    if (reservedGroups.includes(group)) {
      throw new BadRequestException('Group name already exist');
    }

    const groupToFind = await this.groupPermissionsRepository.findOne({
      where: {
        organizationId: user.organizationId,
        group,
      },
    });

    if (groupToFind) {
      throw new ConflictException('Group name already exist');
    }

    await dbTransactionWrap(async (manager: EntityManager) => {
      await manager.save(
        manager.create(GroupPermission, {
          organizationId: user.organizationId,
          group: group,
        })
      );
    }, manager);
  }

  async destroy(user: User, groupPermissionId: string, manager?: EntityManager): Promise<void> {
    const groupPermission = await this.groupPermissionsRepository.findOne({
      where: {
        id: groupPermissionId,
      },
    });

    if (groupPermission.group == 'admin' || groupPermission.group == 'all_users') {
      throw new BadRequestException('Cannot delete default group');
    }
    await dbTransactionWrap(async (manager: EntityManager) => {
      const relationalEntitiesToBeDeleted = [AppGroupPermission, UserGroupPermission];

      for (const entityToDelete of relationalEntitiesToBeDeleted) {
        const entities = await manager.find(entityToDelete, {
          where: { groupPermissionId },
        });

        for (const entity of entities) {
          await manager.delete(entityToDelete, entity.id);
        }
      }

      await manager.delete(GroupPermission, {
        organizationId: user.organizationId,
        id: groupPermissionId,
      });
    }, manager);
  }

  async updateAppGroupPermission(
    user: User,
    groupPermissionId: string,
    appGroupPermissionId: string,
    actions: any,
    manager?: EntityManager
  ) {
    const appGroupPermission = await this.appGroupPermissionsRepository.findOne({
      where: {
        id: appGroupPermissionId,
        groupPermissionId: groupPermissionId,
      },
    });
    const groupPermission = await this.groupPermissionsRepository.findOne({
      where: {
        id: appGroupPermission.groupPermissionId,
      },
    });

    if (groupPermission.organizationId !== user.organizationId) {
      throw new BadRequestException();
    }
    if (groupPermission.group == 'admin') {
      throw new BadRequestException('Cannot update admin group');
    }

    await dbTransactionWrap(async (manager: EntityManager) => {
      await manager.update(AppGroupPermission, appGroupPermissionId, actions);
    }, manager);
  }

  async update(user: User, groupPermissionId: string, body: any, manager?: EntityManager) {
    const groupPermission = await this.groupPermissionsRepository.findOne({
      where: {
        id: groupPermissionId,
        organizationId: user.organizationId,
      },
    });

    const {
      name,
      app_create,
      app_delete,
      add_apps,
      remove_apps,
      add_users,
      remove_users,
      folder_create,
      org_environment_variable_create,
      org_environment_variable_update,
      org_environment_variable_delete,
      folder_delete,
      folder_update,
      org_environment_constant_create,
      org_environment_constant_delete,
    } = body;

    await dbTransactionWrap(async (manager: EntityManager) => {
      //update user group name
      if (name) {
        const newName = name.trim();
        if (!newName) {
          throw new BadRequestException('Group name should not be empty');
        }

        const reservedGroups = ['admin', 'all_users'];
        if (reservedGroups.includes(groupPermission.group)) {
          throw new BadRequestException('Cannot update a default group name');
        }

        if (reservedGroups.includes(newName.replace(/ /g, '_').toLowerCase())) {
          throw new BadRequestException('Group name already exists');
        }

        const groupToFind = await this.groupPermissionsRepository.findOne({
          where: {
            organizationId: user.organizationId,
            group: newName,
          },
        });

        if (groupToFind && groupToFind.id !== groupPermission.id) {
          throw new ConflictException('Group name already exists');
        } else if (!groupToFind) {
          await manager.update(GroupPermission, groupPermissionId, { group: newName });
        }
      }

      // update group permissions
      const groupPermissionUpdateParams = {
        ...(typeof app_create === 'boolean' && { appCreate: app_create }),
        ...(typeof app_delete === 'boolean' && { appDelete: app_delete }),
        ...(typeof folder_create === 'boolean' && { folderCreate: folder_create }),
        ...(typeof org_environment_variable_create === 'boolean' && {
          orgEnvironmentVariableCreate: org_environment_variable_create,
        }),
        ...(typeof org_environment_variable_update === 'boolean' && {
          orgEnvironmentVariableUpdate: org_environment_variable_update,
        }),
        ...(typeof org_environment_variable_delete === 'boolean' && {
          orgEnvironmentVariableDelete: org_environment_variable_delete,
        }),
        ...(typeof folder_delete === 'boolean' && { folderDelete: folder_delete }),
        ...(typeof folder_update === 'boolean' && { folderUpdate: folder_update }),

        ...(typeof org_environment_constant_create === 'boolean' && {
          orgEnvironmentConstantCreate: org_environment_constant_create,
        }),
        ...(typeof org_environment_constant_delete === 'boolean' && {
          orgEnvironmentConstantDelete: org_environment_constant_delete,
        }),
      };
      if (Object.keys(groupPermissionUpdateParams).length !== 0) {
        await manager.update(GroupPermission, groupPermissionId, groupPermissionUpdateParams);
      }

      // update app group permissions
      if (remove_apps) {
        if (groupPermission.group == 'admin') {
          throw new BadRequestException('Cannot update admin group');
        }
        for (const appId of remove_apps) {
          await manager.delete(AppGroupPermission, {
            appId: appId,
            groupPermissionId: groupPermissionId,
          });
        }
      }

      if (add_apps) {
        if (groupPermission.group == 'admin') {
          throw new BadRequestException('Cannot update admin group');
        }
        for (const appId of add_apps) {
          await manager.save(
            AppGroupPermission,
            manager.create(AppGroupPermission, {
              appId: appId,
              groupPermissionId: groupPermissionId,
              read: true,
            })
          );
        }
      }

      // update user group permissions
      if (remove_users) {
        for (const userId of body.remove_users) {
          const params = {
            removeGroups: [groupPermission.group],
          };
          await this.usersService.update(userId, params, manager, user.organizationId);
        }
      }

      if (add_users) {
        for (const userId of body.add_users) {
          const params = {
            addGroups: [groupPermission.group],
          };
          await this.usersService.update(userId, params, manager, user.organizationId);
        }
      }
    }, manager);
  }

  async findOne(user: User, groupPermissionId: string): Promise<GroupPermission> {
    return this.groupPermissionsRepository.findOne({
      where: {
        organizationId: user.organizationId,
        id: groupPermissionId,
      },
    });
  }

  async findAll(user: User): Promise<GroupPermission[]> {
    return this.groupPermissionsRepository.find({
      where: { organizationId: user.organizationId },
      order: { createdAt: 'ASC' },
    });
  }

  async findApps(user: User, groupPermissionId: string): Promise<App[]> {
    return createQueryBuilder(App, 'apps')
      .innerJoinAndSelect('apps.groupPermissions', 'group_permissions')
      .innerJoinAndSelect('apps.appGroupPermissions', 'app_group_permissions')
      .where('group_permissions.id = :groupPermissionId', {
        groupPermissionId,
      })
      .andWhere('group_permissions.organization_id = :organizationId', {
        organizationId: user.organizationId,
      })
      .andWhere('app_group_permissions.group_permission_id = :groupPermissionId', { groupPermissionId })
      .orderBy('apps.created_at', 'DESC')
      .getMany();
  }

  async findAddableApps(user: User, groupPermissionId: string): Promise<App[]> {
    const groupPermission = await this.groupPermissionsRepository.findOne({
      where: {
        id: groupPermissionId,
        organizationId: user.organizationId,
      },
    });

    const appsInGroup = await groupPermission.apps;
    const appsInGroupIds = appsInGroup.map((u) => u.id);

    return await this.appRepository.find({
      where: {
        id: Not(In(appsInGroupIds)),
        organizationId: user.organizationId,
      },
      loadEagerRelations: false,
      relations: ['groupPermissions', 'appGroupPermissions'],
    });
  }

  async findUsers(user: User, groupPermissionId: string): Promise<User[]> {
    return createQueryBuilder(User, 'users')
      .select(['users.id', 'users.firstName', 'users.lastName', 'users.email'])
      .innerJoin('users.groupPermissions', 'group_permissions')
      .innerJoin('users.userGroupPermissions', 'user_group_permissions')
      .where('group_permissions.id = :groupPermissionId', {
        groupPermissionId,
      })
      .andWhere('group_permissions.organization_id = :organizationId', {
        organizationId: user.organizationId,
      })
      .andWhere('user_group_permissions.group_permission_id = :groupPermissionId', { groupPermissionId })
      .orderBy('users.created_at', 'DESC')
      .getMany();
  }

  async findAddableUsers(user: User, groupPermissionId: string, searchInput: string): Promise<User[]> {
    if (!searchInput) {
      return [];
    }

    const groupPermission = await this.groupPermissionsRepository.findOne({
      where: {
        id: groupPermissionId,
        organizationId: user.organizationId,
      },
    });

    const userInGroup = await groupPermission.users;
    const usersInGroupIds = userInGroup.map((u) => u.id);

    const adminUsers = await createQueryBuilder(UserGroupPermission, 'user_group_permissions')
      .innerJoin(
        GroupPermission,
        'group_permissions',
        'group_permissions.id = user_group_permissions.group_permission_id'
      )
      .where('group_permissions.group = :group', { group: 'admin' })
      .andWhere('group_permissions.organization_id = :organizationId', {
        organizationId: user.organizationId,
      })
      .getMany();
    const adminUserIds = adminUsers.map((u) => u.userId);

    const getOrConditions = () => {
      return new Brackets((qb) => {
        qb.orWhere('lower(user.email) like :email', {
          email: `%${searchInput.toLowerCase()}%`,
        });
        qb.orWhere('lower(user.firstName) like :firstName', {
          firstName: `%${searchInput.toLowerCase()}%`,
        });
        qb.orWhere('lower(user.lastName) like :lastName', {
          lastName: `%${searchInput.toLowerCase()}%`,
        });
      });
    };

    return await createQueryBuilder(User, 'user')
      .select(['user.id', 'user.firstName', 'user.lastName', 'user.email'])
      .innerJoin(
        'user.organizationUsers',
        'organization_users',
        'organization_users.organizationId = :organizationId',
        { organizationId: user.organizationId }
      )
      .andWhere(getOrConditions)
      .where('user.id NOT IN (:...userList)', { userList: [...usersInGroupIds, ...adminUserIds] })
      .getMany();
  }

  async createUserGroupPermission(userId: string, groupPermissionId: string, manager?: EntityManager) {
    await dbTransactionWrap(async (manager: EntityManager) => {
      await manager.save(
        manager.create(UserGroupPermission, {
          userId,
          groupPermissionId,
        })
      );
    }, manager);
  }
}
