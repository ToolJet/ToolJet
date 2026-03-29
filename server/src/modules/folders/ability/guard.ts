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
    return Folder;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const folderId = request.params?.id;
    const rawFeatures = cloneDeep(this.reflector.get<string[]>('tjFeatureId', context.getHandler()));
    const features = Array.isArray(rawFeatures) ? rawFeatures : rawFeatures ? [rawFeatures] : [];

    if (
      user &&
      folderId &&
      (features.includes(FEATURE_KEY.UPDATE_FOLDER) || features.includes(FEATURE_KEY.DELETE_FOLDER))
    ) {
      request.tj_resource_id = folderId;

      const folder = await this.dataSource.manager.findOne(Folder, {
        where: { id: folderId, organizationId: user.organizationId },
        select: ['id', 'createdBy'],
      });

      request.tj_allow_owner_folder_manage = !!folder && folder.createdBy === user.id;
    }

    return super.canActivate(context);
  }
}
