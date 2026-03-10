import { ExecutionContext, Injectable } from '@nestjs/common';
import { FeatureAbilityFactory } from '.';
import { AbilityGuard } from '@modules/app/guards/ability.guard';
import { ResourceDetails } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';
import { App } from '@entities/app.entity';
import { APP_TYPES } from '@modules/apps/constants';
import { FolderApp } from '@entities/folder_app.entity';
import { Folder } from '@entities/folder.entity';
import { ModuleRef, Reflector } from '@nestjs/core';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { TransactionLogger } from '@modules/logging/service';
import { DataSource } from 'typeorm';

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
    return App;
  }

  protected getResource(): ResourceDetails {
    const resource: App = this.getResourceObject();
    switch (resource?.type) {
      case APP_TYPES.FRONT_END:
        return {
          resourceType: MODULES.APP,
        };
      case APP_TYPES.WORKFLOW:
        return {
          resourceType: MODULES.WORKFLOWS,
        };
      case APP_TYPES.MODULE:
        return {
          resourceType: MODULES.MODULES,
        };
      default:
        return null;
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const app = request.tj_app;
    const user = request.user;

    // Check if the app belongs to any folder owned by the current user.
    if (user?.id && app) {
      const ownedFolderApp = await this.dataSource.manager
        .createQueryBuilder(FolderApp, 'folder_app')
        .innerJoin(Folder, 'folder', 'folder.id = folder_app.folderId')
        .where('folder_app.appId = :appId', { appId: app.id })
        .andWhere('folder.createdBy = :userId', { userId: user.id })
        .andWhere('folder.organizationId = :orgId', { orgId: user.organizationId })
        .getOne();

      request.tj_app_in_owned_folder = !!ownedFolderApp;
    }

    return super.canActivate(context);
  }
}
