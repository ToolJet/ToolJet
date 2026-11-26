import { BadRequestException, CanActivate, ExecutionContext, Injectable, NotFoundException } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { In } from 'typeorm';
import { dbTransactionWrap } from '@helpers/database.helper';
import { AppVersion } from '@entities/app_version.entity';
import { DataQuery } from '@entities/data_query.entity';
import { DataQueryFolder } from '@entities/data_query_folder.entity';
import { assertVersionEditable } from '@modules/git-sync-configs/guards/git-sync-edit-guard';
import { ChildType } from '../types';

interface FolderRequestTargets {
  versionIds: string[];
  folderIds: string[];
  queryIds: string[];
}

interface ReorderItem {
  childId?: string;
  childType?: string;
  parentId?: string | null;
}

// Every id a folder request names, whatever the route. Ids never decide scope: they are
// only used to find the one app version the request touches.
export function collectFolderRequestTargets(request: {
  params?: { id?: string };
  query?: { appVersionId?: string };
  body?: { appVersionId?: string } & ReorderItem & { items?: ReorderItem[] };
}): FolderRequestTargets {
  const targets: FolderRequestTargets = { versionIds: [], folderIds: [], queryIds: [] };
  const add = (list: string[], id?: string | null) => id && list.push(id);

  add(targets.folderIds, request.params?.id);
  add(targets.versionIds, request.query?.appVersionId);
  add(targets.versionIds, request.body?.appVersionId);

  const items = [request.body, ...(Array.isArray(request.body?.items) ? request.body.items : [])];
  for (const item of items) {
    add(item?.childType === ChildType.FOLDER ? targets.folderIds : targets.queryIds, item?.childId);
    add(targets.folderIds, item?.parentId);
  }
  return targets;
}

/**
 * Pins a query-folder request to one app version of the caller's workspace and exposes its app as
 * `request.tj_app` for the ability guard that runs next. Writes also need an editable, unreleased version.
 */
@Injectable()
export class QueryFolderScopeGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const organizationId: string | undefined = request.user?.organizationId;
    if (!organizationId) throw new NotFoundException();

    const targets = collectFolderRequestTargets(request);
    const allIds = [...targets.versionIds, ...targets.folderIds, ...targets.queryIds];
    if (allIds.some((id) => !isUUID(id))) throw new BadRequestException('Invalid id');

    const appVersion = await dbTransactionWrap(async (manager) => {
      const folderIds = [...new Set(targets.folderIds)];
      const queryIds = [...new Set(targets.queryIds)];
      const folders = folderIds.length
        ? await manager.find(DataQueryFolder, { where: { id: In(folderIds) }, select: ['id', 'appVersionId'] })
        : [];
      const queries = queryIds.length
        ? await manager.find(DataQuery, { where: { id: In(queryIds) }, select: ['id', 'appVersionId'] })
        : [];
      if (folders.length !== folderIds.length || queries.length !== queryIds.length) {
        throw new NotFoundException();
      }

      const versionIds = new Set([
        ...targets.versionIds,
        ...folders.map((f) => f.appVersionId),
        ...queries.map((q) => q.appVersionId),
      ]);
      if (!versionIds.size) throw new BadRequestException('Request must target an app version');
      // Org-scope every version first, so a foreign id never reaches the "one version" rule below.
      const found = await manager.find(AppVersion, {
        where: { id: In([...versionIds]), app: { organizationId } },
        relations: ['app'],
      });
      if (found.length !== versionIds.size) throw new NotFoundException();
      if (found.length > 1) throw new BadRequestException('Request must target exactly one app version');
      return found[0];
    });

    request.tj_app = appVersion.app;
    request.tj_resource_id = appVersion.app.id;
    request.tj_app_version = appVersion;

    if (request.method !== 'GET') {
      // Same rules as the other query routes; those read :versionId, which these routes do not have.
      // The git-sync rule needs an edition-specific service: see the EE QueryFolderGitSyncGuard.
      assertVersionEditable(appVersion.status);
      if (appVersion.app.currentVersionId === appVersion.id) {
        throw new BadRequestException('You cannot update a released version');
      }
    }
    return true;
  }
}
