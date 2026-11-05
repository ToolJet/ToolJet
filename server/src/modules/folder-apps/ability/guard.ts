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

      const folderOwnedByUser = !!folder && folder.createdBy === request.user.id;
      request.tj_folder_type = folder?.type;

      const appIds: string[] = request.body.app_id ? [request.body.app_id] : request.body.app_ids;
      const apps = await this.dataSource.manager.find(App, {
        where: { id: In(appIds), organizationId: request.user.organizationId },
        select: ['id', 'userId', 'type'],
      });
      const allFound = apps.length === new Set(appIds).size;
      request.tj_allow_owner_folder_app_create =
        folderOwnedByUser && allFound && apps.every((app) => app.userId === request.user.id);
      request.tj_allow_owner_folder_app_delete = folderOwnedByUser && allFound;
      request.tj_folder_app_type_mismatch = !!folder?.type && apps.some((app) => app.type && app.type !== folder.type);
    }

    return super.canActivate(context);
  }
}
