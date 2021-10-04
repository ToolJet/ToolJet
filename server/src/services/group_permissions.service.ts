import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, createQueryBuilder } from 'typeorm';
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

    private usersService: UsersService
  ) {}

  async create(user: User, group: string): Promise<GroupPermission> {
    return this.groupPermissionsRepository.save(
      this.groupPermissionsRepository.create({
        organizationId: user.organizationId,
        group: group,
      })
    );
  }

  async updateAppGroupPermission(appGroupPermissionId: string, action: string, value: boolean) {
    const updateParams = {};
    updateParams[action] = value;

    const appGroupPermission = await this.appGroupPermissionsRepository.findOne({ id: appGroupPermissionId });
    const groupPermission = await this.groupPermissionsRepository.findOne({
      id: appGroupPermission.groupPermissionId,
    });

    if (groupPermission.group == 'admin') {
      throw new BadRequestException('Cannot update admin group');
    }

    return this.appGroupPermissionsRepository.update(appGroupPermissionId, updateParams);
  }

  async update(groupPermissionId: string, body: any) {
    const groupPermission = await this.groupPermissionsRepository.findOne({
      id: groupPermissionId,
    });

    await this.appGroupPermissionsRepository.manager.transaction(async (manager) => {
      if (body.remove_apps) {
        if (groupPermission.group == 'admin') {
          throw new BadRequestException('Cannot update admin group');
        }
        for (const appId of body.remove_apps) {
          manager.delete(AppGroupPermission, {
            appId: appId,
            groupPermissionId: groupPermissionId,
          });
        }
      }

      if (body.add_apps) {
        if (groupPermission.group == 'admin') {
          throw new BadRequestException('Cannot update admin group');
        }
        for (const appId of body.add_apps) {
          manager.save(
            AppGroupPermission,
            manager.create(AppGroupPermission, {
              appId: appId,
              groupPermissionId: groupPermissionId,
            })
          );
        }
      }
    });

    await this.userGroupPermissionsRepository.manager.transaction(async (manager) => {
      if (body.remove_users) {
        for (const userId of body.remove_users) {
          const params = {
            removeGroups: [groupPermission.group],
          };
          await this.usersService.update(userId, params, manager);
        }
      }

      if (body.add_users) {
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
      organizationId: user.organizationId,
      id: groupPermissionId,
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
    return createQueryBuilder(App, 'apps')
      .innerJoinAndSelect('apps.groupPermissions', 'group_permissions')
      .where('group_permissions.id != :groupPermissionId', {
        groupPermissionId,
      })
      .andWhere('group_permissions.organization_id = :organizationId', {
        organizationId: user.organizationId,
      })
      .orderBy('apps.created_at', 'DESC')
      .getMany();
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
    return createQueryBuilder(User, 'users')
      .innerJoinAndSelect('users.groupPermissions', 'group_permissions')
      .innerJoinAndSelect('users.userGroupPermissions', 'user_group_permissions')
      .where('group_permissions.id != :groupPermissionId', {
        groupPermissionId,
      })
      .andWhere('group_permissions.organization_id = :organizationId', {
        organizationId: user.organizationId,
      })
      .orderBy('users.created_at', 'DESC')
      .getMany();
  }
}
