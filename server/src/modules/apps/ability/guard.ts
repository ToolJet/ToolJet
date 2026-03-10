import { ExecutionContext, Injectable } from '@nestjs/common';
import { FeatureAbilityFactory } from '.';
import { AbilityGuard } from '@modules/app/guards/ability.guard';
import { App } from '@entities/app.entity';
import { ResourceDetails } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';
import { APP_TYPES } from '../constants';
import { DataSource } from 'typeorm';
import { ModuleRef, Reflector } from '@nestjs/core';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { TransactionLogger } from '@modules/logging/service';
import { FolderApp } from '@entities/folder_app.entity';
import { Folder } from '@entities/folder.entity';

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

  protected getResource(): ResourceDetails {
    const resource = this.getResourceObject();
    switch (resource?.type) {
      case APP_TYPES.FRONT_END:
        return {
          resourceType: MODULES.APP,
        };
      case APP_TYPES.MODULE:
        return {
          resourceType: MODULES.MODULES,
        };
      case APP_TYPES.WORKFLOW:
        return {
          resourceType: MODULES.WORKFLOWS,
        };
      default:
        return null;
    }
  }
  protected getAbilityFactory() {
    return FeatureAbilityFactory;
  }

  protected getSubjectType() {
    return App;
  }

  protected forwardAbility(): boolean {
    return true;
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
