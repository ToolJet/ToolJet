import { UserAppsPermissions } from '@module/permissions/interface/permissions-ability.interface';
import { AppBase } from 'src/entities/app_base.entity';
import { Folder } from 'src/entities/folder.entity';
import { User } from 'src/entities/user.entity';
import { createQueryBuilder, EntityManager, SelectQueryBuilder } from 'typeorm';

export function getFolderQuery(organizationId: string, searchKey?: string): SelectQueryBuilder<Folder> {
  const query = createQueryBuilder(Folder, 'folders');

  if (searchKey) {
    query
      .leftJoinAndSelect('folders.folderApps', 'folder_apps')
      .leftJoin('folder_apps.app', 'app')
      .where('LOWER(app.name) like :searchKey', {
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
  let viewableApps = userAppPermissions.hideAll
    ? [null]
    : [
        null,
        ...Array.from(
          new Set(
            [...userAppPermissions.editableAppsId, ...userAppPermissions.viewableAppsId].filter(
              (id) => !userAppPermissions.hiddenAppsId.includes(id)
            )
          )
        ),
      ];
  viewableApps = viewableApps.filter((id) => !userAppPermissions.hiddenAppsId.includes(id));
  const viewableAppsQb = manager
    .createQueryBuilder(AppBase, 'viewable_apps')
    .innerJoin('viewable_apps.user', 'user')
    .addSelect(['user.firstName', 'user.lastName'])
    .where('viewable_apps.organization_id = :organizationId', { organizationId: user.organizationId });

  if (select) {
    viewableAppsQb.select(select.map((col) => `viewable_apps.${col}`));
  }
  if (userAppPermissions.hideAll || !(userAppPermissions.isAllEditable || userAppPermissions.isAllViewable)) {
    viewableAppsQb.where('viewable_apps.id IN (:...viewableApps)', {
      viewableApps,
    });
  }
  return viewableAppsQb;
}
