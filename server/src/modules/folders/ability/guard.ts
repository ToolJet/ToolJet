import { ExecutionContext, Injectable } from '@nestjs/common';
import { FeatureAbilityFactory } from '.';
import { AbilityGuard } from '@modules/app/guards/ability.guard';
import { Folder } from '@entities/folder.entity';
import { DataSource } from 'typeorm';
import { ModuleRef, Reflector } from '@nestjs/core';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { TransactionLogger } from '@modules/logging/service';
import { cloneDeep } from 'lodash';
import { FEATURE_KEY } from '../constants';
import { MODULES } from '@modules/app/constants/modules';
import { ResourceDetails } from '@modules/app/types';

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
    return Folder;
  }

  // FeatureAbilityFactory's UPDATE_FOLDER branch needs the granular bucket matching whichever
  // folder type is being managed, to let a per-folder canEditFolder grant through this guard
  // (not just isBuilder/the coarse create flag) — request all four so the lookup always hits.
  protected getResource(): ResourceDetails[] {
    return [
      { resourceType: MODULES.FOLDER },
      { resourceType: MODULES.WORKFLOW_FOLDER },
      { resourceType: MODULES.MODULE_FOLDER },
      { resourceType: MODULES.DATA_SOURCE_FOLDER },
    ];
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const folderId = request.params?.id;
    const rawFeatures = cloneDeep(this.reflector.get<string[]>('tjFeatureId', context.getHandler()));
    const features = Array.isArray(rawFeatures) ? rawFeatures : rawFeatures ? [rawFeatures] : [];

    if (user && features.includes(FEATURE_KEY.CREATE_FOLDER)) {
      request.tj_folder_type = request.body?.type;
    }

    if (
      user &&
      folderId &&
      (features.includes(FEATURE_KEY.UPDATE_FOLDER) || features.includes(FEATURE_KEY.DELETE_FOLDER))
    ) {
      request.tj_resource_id = folderId;

      const folder = await this.dataSource.manager.findOne(Folder, {
        where: { id: folderId, organizationId: user.organizationId },
        select: ['id', 'createdBy', 'type'],
      });

      request.tj_allow_owner_folder_manage = !!folder && folder.createdBy === user.id;
      request.tj_folder_type = folder?.type;
    }

    return super.canActivate(context);
  }
}
