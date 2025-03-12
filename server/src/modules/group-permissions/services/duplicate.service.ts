import { AppsGroupPermissions } from '@entities/apps_group_permissions.entity';
import { DataSourcesGroupPermissions } from '@entities/data_sources_group_permissions.entity';
import { GranularPermissions } from '@entities/granular_permissions.entity';
import { GroupApps } from '@entities/group_apps.entity';
import { GroupDataSources } from '@entities/group_data_source.entity';
import { GroupPermissions } from '@entities/group_permissions.entity';
import { dbTransactionWrap } from '@helpers/database.helper';
import { Injectable } from '@nestjs/common';
import { instanceToPlain } from 'class-transformer';
import { EntityManager, Not, Raw } from 'typeorm';
import { GROUP_PERMISSIONS_TYPE, ResourceType } from '../constants';
import { getMaxCopyNumber } from '@helpers/utils.helper';
import { IGroupPermissionsDuplicateService } from '../interfaces/IService';

@Injectable()
export class GroupPermissionsDuplicateService implements IGroupPermissionsDuplicateService {
  constructor() {}

  async duplicateGroup(
    group: GroupPermissions,
    addPermission: boolean,
    manager?: EntityManager
  ): Promise<GroupPermissions> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const newName = await this.getDuplicateGroupName(group, manager);
      const keysToDelete = ['id', 'createdAt', 'updatedAt', 'name', 'type'];
      if (addPermission)
        keysToDelete.forEach((key) => {
          delete group[key];
        });
      return await manager.save(
        manager.create(GroupPermissions, {
          name: newName,
          organizationId: group.organizationId,
          type: GROUP_PERMISSIONS_TYPE.CUSTOM_GROUP,
          ...(addPermission ? instanceToPlain(group) : {}),
        })
      );
    }, manager);
  }

  async duplicateGranularPermissions(
    granularPermissions: GranularPermissions,
    groupId: string,
    manager?: EntityManager
  ): Promise<GranularPermissions> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const keysToDelete = [
        'id',
        'createdAt',
        'updatedAt',
        'groupId',
        'group',
        'appsGroupPermissions',
        'dataSourcesGroupPermission',
      ];
      keysToDelete.forEach((key) => {
        delete granularPermissions[key];
      });
      return await manager.save(
        manager.create(GranularPermissions, { groupId, ...instanceToPlain(granularPermissions) })
      );
    }, manager);
  }

  async duplicateResourcePermissions(
    granularPermissionsToDuplicate: GranularPermissions,
    newGranularPermissionsId: string,
    manager?: EntityManager
  ): Promise<void> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      switch (granularPermissionsToDuplicate.type) {
        case ResourceType.APP:
          await this.duplicationAppsPermissions(
            granularPermissionsToDuplicate.appsGroupPermissions,
            newGranularPermissionsId,
            manager
          );
          break;
        default:
          await this.duplicationDataSourcePermissions(
            granularPermissionsToDuplicate.dataSourcesGroupPermission,
            newGranularPermissionsId,
            manager
          );
          break;
      }
    }, manager);
  }

  async duplicationAppsPermissions(
    appsPermissions: AppsGroupPermissions,
    granularPermissionId: string,
    manager: EntityManager
  ) {
    const groupApps = appsPermissions.groupApps;
    const keysToDelete = ['id', 'createdAt', 'updatedAt', 'granularPermissionId', 'groupApps'];
    keysToDelete.forEach((key) => {
      delete appsPermissions[key];
    });
    const newAppsPermissions = await manager.save(
      manager.create(AppsGroupPermissions, { granularPermissionId, ...instanceToPlain(appsPermissions) })
    );

    await manager.insert(
      GroupApps,
      groupApps.map((groupApp) => ({
        appsGroupPermissionsId: newAppsPermissions.id,
        appId: groupApp.appId,
      }))
    );
  }

  async duplicationDataSourcePermissions(
    dataSourcePermissions: DataSourcesGroupPermissions,
    granularPermissionId: string,
    manager: EntityManager
  ) {
    const groupDataSources = dataSourcePermissions.groupDataSources;
    const keysToDelete = ['id', 'createdAt', 'updatedAt', 'granularPermissionId', 'groupDataSources'];
    keysToDelete.forEach((key) => {
      delete dataSourcePermissions[key];
    });
    const newAppsPermissions = await manager.save(
      manager.create(DataSourcesGroupPermissions, { granularPermissionId, ...instanceToPlain(dataSourcePermissions) })
    );
    await manager.insert(
      GroupDataSources,
      groupDataSources.map((groupDs) => ({
        dataSourcesGroupPermissionsId: newAppsPermissions.id,
        dataSourceId: groupDs.dataSourceId,
      }))
    );
  }

  async getDuplicateGroupName(groupToDuplicate: GroupPermissions, manager: EntityManager): Promise<string> {
    const existNameList = await manager.find(GroupPermissions, {
      select: ['name', 'id'],
      where: [
        {
          name: Raw((alias) => `${alias} ~* :pattern`, { pattern: `^${groupToDuplicate.name}_copy_[0-9]+$` }),
          organizationId: groupToDuplicate.organizationId,
          id: Not(groupToDuplicate.id),
        },
        {
          name: `${groupToDuplicate.name}_copy`,
          organizationId: groupToDuplicate.organizationId,
          id: Not(groupToDuplicate.id),
        },
      ],
    });

    let newName = `${groupToDuplicate.name}_copy`;
    const number = getMaxCopyNumber(existNameList.map((group) => group.name));
    if (number) newName = `${groupToDuplicate.name}_copy_${number}`;
    return newName;
  }
}
