import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, createQueryBuilder, getManager, In, Not } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { GroupPermission } from 'src/entities/group_permission.entity';
import { App } from 'src/entities/app.entity';
import { AppGroupPermission } from 'src/entities/app_group_permission.entity';
import { UserGroupPermission } from 'src/entities/user_group_permission.entity';
import { UsersService } from './users.service';

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

  async create(user: User, group: string): Promise<GroupPermission> {
    if (!group || group === '') {
      throw new BadRequestException('Cannot create group without name');
    }
    return this.groupPermissionsRepository.save(
      this.groupPermissionsRepository.create({
        organizationId: user.organizationId,
        group: group,
      })
    );
  }

  async destroy(user: User, groupPermissionId: string) {
    let result;

    const groupPermission = await this.groupPermissionsRepository.findOne({
      where: {
        id: groupPermissionId,
      },
    });

    if (groupPermission.group == 'admin' || groupPermission.group == 'all_users') {
      throw new BadRequestException('Cannot delete default group');
    }
    await getManager().transaction(async (manager) => {
      const relationalEntitiesToBeDeleted = [AppGroupPermission, UserGroupPermission];

      for (const entityToDelete of relationalEntitiesToBeDeleted) {
        const entities = await manager.find(entityToDelete, {
          where: { groupPermissionId },
        });

        for (const entity of entities) {
          await manager.delete(entityToDelete, entity.id);
        }
      }

      result = await manager.delete(GroupPermission, {
        organizationId: user.organizationId,
        id: groupPermissionId,
      });
    });
    return result;
  }

  async updateAppGroupPermission(user: User, groupPermissionId: string, appGroupPermissionId: string, actions: any) {
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

    return this.appGroupPermissionsRepository.update(appGroupPermissionId, actions);
  }

  async update(user: User, groupPermissionId: string, body: any) {
    const groupPermission = await this.groupPermissionsRepository.findOne({
      where: {
        id: groupPermissionId,
        organizationId: user.organizationId,
      },
    });

    const { app_create, app_delete, add_apps, remove_apps, add_users, remove_users, folder_create } = body;

    await getManager().transaction(async (manager) => {
      // update group permissions
      const groupPermissionUpdateParams = {
        ...(typeof app_create === 'boolean' && { appCreate: app_create }),
        ...(typeof app_delete === 'boolean' && { appDelete: app_delete }),
        ...(typeof folder_create === 'boolean' && { folderCreate: folder_create }),
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
          await this.usersService.update(userId, params, manager);
        }
      }

      if (add_users) {
        for (const userId of body.add_users) {
          const params = {
            addGroups: [groupPermission.group],
          };
          await this.usersService.update(userId, params, manager);
        }
      }
    });

    return this.groupPermissionsRepository.findOne({ id: groupPermissionId });
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
      organizationId: user.organizationId,
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
      .innerJoinAndSelect('users.groupPermissions', 'group_permissions')
      .innerJoinAndSelect('users.userGroupPermissions', 'user_group_permissions')
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

  async findAddableUsers(user: User, groupPermissionId: string): Promise<User[]> {
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

    return await this.userRepository.find({
      id: Not(In([...usersInGroupIds, ...adminUserIds])),
      organizationId: user.organizationId,
    });
  }
}
