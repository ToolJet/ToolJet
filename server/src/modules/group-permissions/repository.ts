import { GroupPermissions } from '@entities/group_permissions.entity';
import { dbTransactionWrap } from '@helpers/database.helper';
import { catchDbException } from '@helpers/utils.helper';
import { Injectable } from '@nestjs/common';
import {
  Brackets,
  DataSource,
  EntityManager,
  Equal,
  FindOptionsWhere,
  ILike,
  In,
  Like,
  Not,
  Repository,
} from 'typeorm';
import { CreateDefaultGroupObject, GranularPermissionQuerySearchParam } from './types';
import { GranularPermissions } from '@entities/granular_permissions.entity';
import { AppsGroupPermissions } from '@entities/apps_group_permissions.entity';
import { DataSourcesGroupPermissions } from '@entities/data_sources_group_permissions.entity';
import { FoldersGroupPermissions } from '@entities/folders_group_permissions.entity';
import { GroupApps } from '@entities/group_apps.entity';
import { GroupDataSources } from '@entities/group_data_source.entity';
import { GroupFolders } from '@entities/group_folders.entity';
import { GROUP_PERMISSIONS_TYPE, ResourceType } from './constants';
import { GroupUsers } from '@entities/group_users.entity';
import { USER_STATUS, WORKSPACE_USER_STATUS } from '@modules/users/constants/lifecycle';
import { User } from '@entities/user.entity';
import { DATA_BASE_CONSTRAINTS } from './constants/error';
@Injectable()
export class GroupPermissionsRepository extends Repository<GroupPermissions> {
  constructor(private dataSource: DataSource) {
    super(GroupPermissions, dataSource.createEntityManager());
  }

  getGroup(options: FindOptionsWhere<GroupPermissions>, manager?: EntityManager): Promise<GroupPermissions> {
    const m = manager ?? this.manager;
    return m.findOne(GroupPermissions, { where: options });
  }

  async getAllUserGroups(userId: string, organizationId: string, manager?: EntityManager): Promise<GroupPermissions[]> {
    const m = manager ?? this.manager;
    return m.find(GroupPermissions, {
      where: {
        organizationId,
        groupUsers: {
          userId,
          group: { type: GROUP_PERMISSIONS_TYPE.CUSTOM_GROUP },
        },
      },
      relations: { groupUsers: { group: true } },
    });
  }

  async getAllUserGroupsAndRoles(
    userId: string,
    appId: string,
    organizationId: string,
    manager?: EntityManager
  ): Promise<GroupPermissions[]> {
    const m = manager ?? this.manager;
    return m
      .createQueryBuilder(GroupPermissions, 'group')
      .innerJoin('granular_permissions', 'gp', 'gp.group_id = group.id')
      .innerJoin('apps_group_permissions', 'agp', "agp.granular_permission_id = gp.id AND agp.app_type = 'front-end'")
      .leftJoin('group_apps', 'ga', 'ga.apps_group_permissions_id = agp.id')
      .leftJoin('group_users', 'gu', 'gu.group_id = group.id')
      .where('group.organization_id = :organizationId', { organizationId })
      .andWhere('gu.user_id = :userId', { userId })
      .andWhere(
        new Brackets((qb) => {
          qb.where('agp.can_view = true').orWhere('agp.can_edit = true');
        })
      )
      .andWhere(
        new Brackets((qb) => {
          qb.where('gp.is_all = true').orWhere('gp.is_all = false AND ga.app_id = :appId', { appId });
        })
      )
      .select(['group.id AS id'])
      .groupBy('group.id')
      .distinct(true)
      .getRawMany();
  }

  async createGroup(
    organizationId: string,
    createGroupObject: CreateDefaultGroupObject,
    manager?: EntityManager
  ): Promise<GroupPermissions> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await catchDbException(async () => {
        const group = manager.create(GroupPermissions, { ...createGroupObject, organizationId });
        return await manager.save(group);
      }, [DATA_BASE_CONSTRAINTS.GROUP_NAME_UNIQUE]);
    }, manager || this.manager);
  }

  async getAllGranularPermissions(
    searchParam: GranularPermissionQuerySearchParam,
    organizationId: string,
    manager: EntityManager
  ): Promise<GranularPermissions[]> {
    const em = manager || this.manager;
    const { name, type, groupId } = searchParam;
    const where: FindOptionsWhere<GranularPermissions> = { group: { organizationId } };
    if (searchParam?.filterDataSource) where.type = Not(Equal(ResourceType.DATA_SOURCE));
    if (groupId) where.groupId = groupId;
    if (name) where.name = name.useLike ? Like(`%${name.value}%`) : name.value;
    if (type) where.type = type as ResourceType;

    const gps = await em.find(GranularPermissions, {
      where,
      relations: { group: true },
    });
    if (gps.length === 0) return gps;

    const gpIds = gps.map((g) => g.id);
    const [agps, dgps, fgps] = await Promise.all([
      em.find(AppsGroupPermissions, { where: { granularPermissionId: In(gpIds) } }),
      em.find(DataSourcesGroupPermissions, { where: { granularPermissionId: In(gpIds) } }),
      em.find(FoldersGroupPermissions, { where: { granularPermissionId: In(gpIds) } }),
    ]);

    const agpIds = agps.map((a) => a.id);
    const dgpIds = dgps.map((d) => d.id);
    const fgpIds = fgps.map((f) => f.id);
    const [groupApps, groupDataSources, groupFolders] = await Promise.all([
      agpIds.length
        ? em.find(GroupApps, {
            where: { appsGroupPermissionsId: In(agpIds) },
            relations: { app: true },
          })
        : Promise.resolve([] as GroupApps[]),
      dgpIds.length
        ? em.find(GroupDataSources, {
            where: { dataSourcesGroupPermissionsId: In(dgpIds) },
            relations: { dataSource: true },
          })
        : Promise.resolve([] as GroupDataSources[]),
      fgpIds.length
        ? em.find(GroupFolders, {
            where: { foldersGroupPermissionsId: In(fgpIds) },
            relations: { folder: true },
          })
        : Promise.resolve([] as GroupFolders[]),
    ]);

    const groupAppsByAgp = new Map<string, GroupApps[]>();
    for (const ga of groupApps) {
      const list = groupAppsByAgp.get(ga.appsGroupPermissionsId) ?? [];
      list.push(ga);
      groupAppsByAgp.set(ga.appsGroupPermissionsId, list);
    }
    const groupDssByDgp = new Map<string, GroupDataSources[]>();
    for (const gd of groupDataSources) {
      const list = groupDssByDgp.get(gd.dataSourcesGroupPermissionsId) ?? [];
      list.push(gd);
      groupDssByDgp.set(gd.dataSourcesGroupPermissionsId, list);
    }
    const groupFoldersByFgp = new Map<string, GroupFolders[]>();
    for (const gf of groupFolders) {
      const list = groupFoldersByFgp.get(gf.foldersGroupPermissionsId) ?? [];
      list.push(gf);
      groupFoldersByFgp.set(gf.foldersGroupPermissionsId, list);
    }
    for (const agp of agps) agp.groupApps = groupAppsByAgp.get(agp.id) ?? [];
    for (const dgp of dgps) dgp.groupDataSources = groupDssByDgp.get(dgp.id) ?? [];
    for (const fgp of fgps) fgp.groupFolders = groupFoldersByFgp.get(fgp.id) ?? [];

    const agpByGp = new Map(agps.map((a) => [a.granularPermissionId, a]));
    const dgpByGp = new Map(dgps.map((d) => [d.granularPermissionId, d]));
    const fgpByGp = new Map(fgps.map((f) => [f.granularPermissionId, f]));
    for (const gp of gps) {
      const agp = agpByGp.get(gp.id);
      if (agp) gp.appsGroupPermissions = agp;
      const dgp = dgpByGp.get(gp.id);
      if (dgp) gp.dataSourcesGroupPermission = dgp;
      const fgp = fgpByGp.get(gp.id);
      if (fgp) gp.foldersGroupPermissions = fgp;
    }

    return gps;
  }

  async getGranularPermission(
    id: string,
    organizationId: string,
    manager: EntityManager
  ): Promise<GranularPermissions | null> {
    const m = manager ?? this.manager;
    return m.findOne(GranularPermissions, {
      where: { id, group: { organizationId } },
      relations: {
        group: true,
        appsGroupPermissions: true,
        dataSourcesGroupPermission: true,
        foldersGroupPermissions: true,
      },
    });
  }

  createGroupUser(userId: string, groupId: string, manager?: EntityManager): Promise<GroupUsers> {
    return dbTransactionWrap((manager: EntityManager) => {
      return catchDbException(() => {
        return manager.save(manager.create(GroupUsers, { groupId: userId }));
      }, [DATA_BASE_CONSTRAINTS.GROUP_USER_UNIQUE]);
    }, manager);
  }

  getUsersInGroup(
    id: string,
    organizationId: string,
    searchInput?: string,
    manager?: EntityManager
  ): Promise<GroupUsers[]> {
    const m = manager ?? this.manager;
    const baseWhere = {
        groupId: id,
        group: {
          organizationId,
        },
        user: {
          status: Not(USER_STATUS.ARCHIVED),
          organizationUsers: {
            organizationId: organizationId,
            status: Not(WORKSPACE_USER_STATUS.ARCHIVED),
          },
        },
      };

      // If there's a search input, use multiple find operations and merge results
      if (searchInput) {
        const searchLower = searchInput.toLowerCase();
        const [firstName, lastName] = searchLower.split(' ');
        return m.find(GroupUsers, {
          where: [
            {
              ...baseWhere,
              user: {
                ...baseWhere.user,
                email: ILike(`%${searchLower}%`),
              },
            },
            {
              ...baseWhere,
              user: {
                ...baseWhere.user,
                firstName: ILike(`%${searchLower}%`),
              },
            },
            {
              ...baseWhere,
              user: {
                ...baseWhere.user,
                lastName: ILike(`%${searchLower}%`),
              },
            },
            ...(lastName
              ? [
                  {
                    ...baseWhere,
                    user: {
                      ...baseWhere.user,
                      firstName: ILike(`%${firstName}%`),
                      lastName: ILike(`%${lastName}%`),
                    },
                  },
                ]
              : []),
          ],
          relations: {
            group: true,
            user: {
              organizationUsers: true,
            },
          },
        });
      }

    // If no search input, use simple find
    return m.find(GroupUsers, {
      where: baseWhere,
      relations: { group: true, user: { organizationUsers: true } },
    });
  }

  async getGroupUser(id: string, manager?: EntityManager): Promise<GroupUsers> {
    const m = manager ?? this.manager;
    return m.findOne(GroupUsers, { where: { id }, relations: { group: true } });
  }

  async addableUsersToGroup(
    groupId: string,
    organizationId: string,
    searchInput?: string,
    manager?: EntityManager
  ): Promise<User[]> {
    const existingUsers = await this.getUsersInGroup(groupId, organizationId, null, manager);

    const baseWhere = {
      status: Not(USER_STATUS.ARCHIVED),
      id: Not(In(existingUsers?.length ? existingUsers.map((user) => user.user.id) : [])),
      organizationUsers: {
        organizationId,
        status: Not(WORKSPACE_USER_STATUS.ARCHIVED),
      },
      userGroups: {
        group: {
          organizationId,
          type: GROUP_PERMISSIONS_TYPE.DEFAULT,
        },
      },
    };

    const m = manager ?? this.manager;
    if (searchInput) {
      const searchLower = searchInput.toLowerCase().trim();
      const [firstName, lastName] = searchLower.split(/\s+/);
      return m.find(User, {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
          relations: {
            organizationUsers: true,
            userGroups: {
              group: true,
            },
          },
          where: [
            {
              ...baseWhere,
              email: ILike(`%${searchLower}%`),
            },
            {
              ...baseWhere,
              firstName: ILike(`%${searchLower}%`),
            },
            {
              ...baseWhere,
              lastName: ILike(`%${searchLower}%`),
            },
            ...(lastName
              ? [
                  {
                    ...baseWhere,
                    firstName: ILike(`%${firstName}%`),
                    lastName: ILike(`%${lastName}%`),
                  },
                ]
              : []),
          ],
          order: {
            createdAt: 'DESC',
          },
        });
      }

    // If no search input, use simple find
    return m.find(User, {
      select: { id: true, firstName: true, lastName: true, email: true },
      relations: { organizationUsers: true, userGroups: { group: true } },
      where: baseWhere,
      order: { createdAt: 'DESC' },
    });
  }

  async removeUserFromGroup(groupUserId?: string, userId?: string, groupId?: string, manager?: EntityManager): Promise<void> {
    const m = manager ?? this.manager;
    await m.delete(GroupUsers, {
      ...(groupUserId ? { id: groupUserId } : {}),
      ...(userId ? { userId } : {}),
      ...(groupId ? { groupId } : {}),
    });
  }

  async removeUserFromAllCustomGroupUser(
    userId: string,
    organizationId: string,
    manager?: EntityManager
  ): Promise<void> {
    const m = manager ?? this.manager;
    const groupUsersToDelete = await this.getAllUserGroups(userId, organizationId, m);
    if (groupUsersToDelete.length > 0) {
      await m.delete(
        GroupUsers,
        groupUsersToDelete.map((gp) => gp.groupUsers[0].id)
      );
    }
  }

  async getAdminUserForOrg(organizationId: string, manager?: EntityManager): Promise<User | null> {
    const m = manager ?? this.manager;
    const result = await m
      .createQueryBuilder(User, 'user')
      .innerJoin('user.userGroups', 'groupUser')
      .innerJoin('groupUser.group', 'group')
      .where('group.name = :name', { name: 'admin' })
      .andWhere('group.organizationId = :organizationId', { organizationId })
      .andWhere('user.status != :archived', { archived: USER_STATUS.ARCHIVED })
      .limit(1)
      .getOne();
    return result ?? null;
  }
}
