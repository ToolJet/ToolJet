import { UserAppsPermissions } from '@module/permissions/interface/permissions-ability.interface';
import { AppBase } from 'src/entities/app_base.entity';
import { Folder } from 'src/entities/folder.entity';
import { User } from 'src/entities/user.entity';
import { EntityManager, SelectQueryBuilder } from 'typeorm';

export function getFolderQuery(
  organizationId: string,
  manager: EntityManager,
  userAppPermissions: UserAppsPermissions,
  searchKey?: string
): SelectQueryBuilder<Folder> {
  const { isAllEditable, isAllViewable, hideAll } = userAppPermissions;
  const viewableApps = userAppPermissions.hideAll
    ? [null, ...userAppPermissions.editableAppsId]
    : [
        null,
        ...Array.from(
          new Set([
            ...userAppPermissions.editableAppsId,
            ...userAppPermissions.viewableAppsId.filter((id) => !userAppPermissions.hiddenAppsId.includes(id)),
          ])
        ),
      ];
  const hiddenApps = userAppPermissions.hiddenAppsId.filter((id) => !userAppPermissions.editableAppsId.includes(id));

  const query = manager.createQueryBuilder(Folder, 'folders');
  if (!isAllEditable) {
    if ((isAllViewable && hideAll) || (!isAllViewable && !hideAll) || (!isAllViewable && hideAll))
      query.leftJoinAndSelect('folders.folderApps', 'folder_apps', 'folder_apps.appId IN (:...viewableApps)', {
        viewableApps,
      });
    else if (!userAppPermissions.hideAll && isAllViewable) {
      if (hiddenApps.length > 0)
        query.leftJoinAndSelect('folders.folderApps', 'folder_apps', 'folder_apps.appId NOT IN (:...hiddenApps)', {
          hiddenApps,
        });
      else {
        query.leftJoinAndSelect('folders.folderApps', 'folder_apps');
      }
    }
  } else {
    query.leftJoinAndSelect('folders.folderApps', 'folder_apps');
  }

  query.leftJoin('folder_apps.app', 'app');
  if (searchKey) {
    query.where('LOWER(app.name) like :searchKey', {
      searchKey: `%${searchKey && searchKey.toLowerCase()}%`,
    });
  }
  query
    .andWhere('folders.organization_id = :organizationId', {
      organizationId,
    })
    .orderBy('folders.name', 'ASC');

  return query;
}

export function viewableAppsQueryUsingPermissions(
  user: User,
  userAppPermissions: UserAppsPermissions,
  manager: EntityManager,
  searchKey?: string,
  select?: Array<string>
): SelectQueryBuilder<AppBase> {
  const viewableApps = userAppPermissions.hideAll
    ? [null, ...userAppPermissions.editableAppsId]
    : [
        null,
        ...Array.from(
          new Set([
            ...userAppPermissions.editableAppsId,
            ...userAppPermissions.viewableAppsId.filter((id) => !userAppPermissions.hiddenAppsId.includes(id)),
          ])
        ),
      ];

  const viewableAppsQb = manager
    .createQueryBuilder(AppBase, 'viewable_apps')
    .innerJoin('viewable_apps.user', 'user')
    .addSelect(['user.firstName', 'user.lastName'])
    .where('viewable_apps.organizationId = :organizationId', { organizationId: user.organizationId });

  if (searchKey) {
    viewableAppsQb.andWhere('LOWER(viewable_apps.name) like :searchKey', {
      searchKey: `%${searchKey && searchKey.toLowerCase()}%`,
    });
  }

  if (select) {
    viewableAppsQb.select(select.map((col) => `viewable_apps.${col}`));
  }

  viewableAppsQb.orderBy('viewable_apps.createdAt', 'DESC');

  const { isAllEditable, isAllViewable, hideAll } = userAppPermissions;
  if (isAllEditable) return viewableAppsQb;
  if ((isAllViewable && hideAll) || (!isAllViewable && !hideAll) || (!isAllViewable && hideAll)) {
    viewableAppsQb.andWhere('viewable_apps.id IN (:...viewableApps)', {
      viewableApps,
    });
    return viewableAppsQb;
  }
  const hiddenApps = userAppPermissions.hiddenAppsId.filter((id) => !userAppPermissions.editableAppsId.includes(id));
  if (!userAppPermissions.hideAll && isAllViewable && hiddenApps.length > 0) {
    viewableAppsQb.andWhere('viewable_apps.id NOT IN (:...hiddenApps)', {
      hiddenApps,
    });
  }
  return viewableAppsQb;
}
