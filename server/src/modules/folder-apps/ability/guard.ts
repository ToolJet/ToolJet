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

    if (request.user && folderId && request.body?.app_id && features.includes(FEATURE_KEY.CREATE_FOLDER_APP)) {
      const [folder, app] = await Promise.all([
        this.dataSource.manager.findOne(Folder, {
          where: { id: folderId, organizationId: request.user.organizationId },
          select: ['id', 'createdBy'],
        }),
        this.dataSource.manager.findOne(App, {
          where: { id: request.body.app_id, organizationId: request.user.organizationId },
          select: ['id', 'userId'],
        }),
      ]);

      request.tj_allow_owner_folder_app_create =
        !!folder && !!app && folder.createdBy === request.user.id && app.userId === request.user.id;
    }

    return super.canActivate(context);
  }
}
