import { ExecutionContext, Injectable } from '@nestjs/common';
import { ModuleRef, Reflector } from '@nestjs/core';
import { DataSource, In } from 'typeorm';
import { FeatureAbilityFactory } from '.';
import { AbilityGuard } from '@modules/app/guards/ability.guard';
import { FolderApp } from '@entities/folder_app.entity';
import { Folder } from '@entities/folder.entity';
import { App } from '@entities/app.entity';
import { ResourceDetails } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';
import { cloneDeep } from 'lodash';
import { FEATURE_KEY } from '../constants';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { TransactionLogger } from '@modules/logging/service';

@Injectable()
export class FeatureAbilityGuard extends AbilityGuard {
  constructor(
    reflector: Reflector,
    moduleRef: ModuleRef,
    licenseTermsService: LicenseTermsService,
    transactionLogger: TransactionLogger,
    dataSource: DataSource
  ) {
    super(reflector, moduleRef, licenseTermsService, transactionLogger, dataSource);
  }

  protected getAbilityFactory() {
    return FeatureAbilityFactory;
  }

  protected getSubjectType() {
    return FolderApp;
  }

  protected getResource(): ResourceDetails | ResourceDetails[] {
    return [
      { resourceType: MODULES.FOLDER },
      { resourceType: MODULES.WORKFLOW_FOLDER },
      { resourceType: MODULES.MODULE_FOLDER },
    ];
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const folderId = request.params?.folderId || request.body?.folder_id;
    if (folderId) {
      request.tj_resource_id = folderId;
    }

    const rawFeatures = cloneDeep(this.reflector.get<string[]>('tjFeatureId', context.getHandler()));
    const features = Array.isArray(rawFeatures) ? rawFeatures : rawFeatures ? [rawFeatures] : [];

    const isMutatingFolderApp =
      request.user &&
      folderId &&
      (features.includes(FEATURE_KEY.CREATE_FOLDER_APP) || features.includes(FEATURE_KEY.DELETE_FOLDER_APP));

    if (isMutatingFolderApp && (request.body?.app_id || request.body?.app_ids?.length)) {
      const folder = await this.dataSource.manager.findOne(Folder, {
        where: { id: folderId, organizationId: request.user.organizationId },
        select: ['id', 'createdBy', 'type'],
      });

      // Cross-workspace guard: the target folder must belong to the caller's workspace.
      // folder_apps rows carry no organization_id, so a folder from another org is never a
      // valid sink — deny here, before the role-based grants in the ability factory (which
      // grant admins unconditionally) can bind a foreign resource.
      if (!folder) return false;

      const folderOwnedByUser = folder.createdBy === request.user.id;
      request.tj_folder_type = folder.type;

      // Every target app must belong to the caller's workspace too. The create/bulkCreate
      // sinks look up and move a binding by app_id alone (no org scope), so a cross-org
      // app_id would hijack another workspace's folder binding. Resolve all ids org-scoped
      // and reject unless each one resolves in-org — for every role, admins included.
      const appIds: string[] = request.body?.app_id ? [request.body.app_id] : request.body.app_ids;
      const apps = await this.dataSource.manager.find(App, {
        where: { id: In(appIds), organizationId: request.user.organizationId },
        select: ['id', 'userId', 'type'],
      });
      if (apps.length !== new Set(appIds).size) return false;

      if (request.body?.app_id) {
        // Single-app path: creating also requires the caller to own the app; deleting only
        // requires folder ownership (app workspace membership is already enforced above).
        const app = apps[0];
        request.tj_allow_owner_folder_app_create = folderOwnedByUser && app.userId === request.user.id;
        request.tj_allow_owner_folder_app_delete = folderOwnedByUser;
        request.tj_folder_app_type_mismatch = !!(folder.type && app.type && folder.type !== app.type);
      } else {
        // Bulk path (app_ids): folder ownership is sufficient — the frontend already
        // gates on canModifyApp before surfacing the "Add to folder" option.
        request.tj_allow_owner_folder_app_create = folderOwnedByUser;
      }
    }

    return super.canActivate(context);
  }
}
