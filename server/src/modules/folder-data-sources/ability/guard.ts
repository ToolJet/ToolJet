import { ExecutionContext, Injectable } from '@nestjs/common';
import { ModuleRef, Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { FeatureAbilityFactory } from '.';
import { AbilityGuard } from '@modules/app/guards/ability.guard';
import { FolderDataSource } from '@entities/folder_data_source.entity';
import { Folder } from '@entities/folder.entity';
import { ResourceDetails } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';
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
    return FolderDataSource;
  }

  protected getResource(): ResourceDetails | ResourceDetails[] {
    return [{ resourceType: MODULES.DATA_SOURCE_FOLDER }];
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const folderId = request.params?.folderId || request.body?.folder_id;
    if (folderId) {
      request.tj_resource_id = folderId;
    }

    const rawFeatures = this.reflector.get<string[]>('tjFeatureId', context.getHandler());
    const features = Array.isArray(rawFeatures) ? rawFeatures : rawFeatures ? [rawFeatures] : [];

    const isMutating =
      request.user &&
      folderId &&
      (features.includes(FEATURE_KEY.CREATE_FOLDER_DATA_SOURCE) ||
        features.includes(FEATURE_KEY.DELETE_FOLDER_DATA_SOURCE));

    if (isMutating) {
      // Folder ownership is the owner-level grant (mirrors folder-apps). Unlike apps there is no
      // folder/resource type-mismatch to guard — data-source folders only ever hold data sources.
      const folder = await this.dataSource.manager.findOne(Folder, {
        where: { id: folderId, organizationId: request.user.organizationId },
        select: ['id', 'createdBy', 'type'],
      });
      request.tj_folder_owned_by_user = !!folder && folder.createdBy === request.user.id;
      request.tj_folder_type = folder?.type;
    }

    return super.canActivate(context);
  }
}
