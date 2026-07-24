import { ExecutionContext, Injectable } from '@nestjs/common';
import { ModuleRef, Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { FeatureAbilityFactory } from '.';
import { AbilityGuard } from '@modules/app/guards/ability.guard';
import { FolderApp } from '@entities/folder_app.entity';
import { Folder } from '@entities/folder.entity';
import { App } from '@entities/app.entity';
import { ResourceDetails } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';
import { APP_TYPES } from '@modules/apps/constants';
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
    private readonly dataSource: DataSource
  ) {
    super(reflector, moduleRef, licenseTermsService, transactionLogger);
  }

  protected getAbilityFactory() {
    return FeatureAbilityFactory;
  }

  protected getSubjectType() {
    return FolderApp;
  }

  protected getResource(): ResourceDetails {
    return {
      resourceType: MODULES.FOLDER,
    };
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

      const folderOwnedByUser = !!folder && folder.createdBy === request.user.id;

      if (request.body?.app_id) {
        // Single-app path: require both folder and app to be owned by the user.
        const app = await this.dataSource.manager.findOne(App, {
          where: { id: request.body.app_id, organizationId: request.user.organizationId },
          select: ['id', 'userId', 'type'],
        });
        request.tj_allow_owner_folder_app_create =
          folderOwnedByUser && !!app && app.userId === request.user.id;
        request.tj_allow_owner_folder_app_delete = folderOwnedByUser && !!app;
        request.tj_app_is_module = app?.type === APP_TYPES.MODULE;
        request.tj_folder_app_type_mismatch = !!(folder?.type && app?.type && folder.type !== app.type);
      } else {
        // Bulk path (app_ids): folder ownership is sufficient — the frontend already
        // gates on canModifyApp before surfacing the "Add to folder" option.
        request.tj_allow_owner_folder_app_create = folderOwnedByUser;
        request.tj_app_is_module = folder?.type === APP_TYPES.MODULE;
      }
    }

    return super.canActivate(context);
  }
}
