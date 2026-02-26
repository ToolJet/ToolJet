import { ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { FeatureAbilityFactory } from '.';
import { AbilityGuard } from '@modules/app/guards/ability.guard';
import { Folder } from '@entities/folder.entity';
import { DataSource } from 'typeorm';
import { ModuleRef, Reflector } from '@nestjs/core';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { TransactionLogger } from '@modules/logging/service';
import { MODULES } from '@modules/app/constants/modules';
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
    const features = cloneDeep(this.reflector.get<string[]>('tjFeatureId', context.getHandler()));

    // For DELETE_FOLDER with a specific folder ID, we need to check conditional ability
    if (folderId && features?.includes(FEATURE_KEY.DELETE_FOLDER)) {
      // First run the base guard for license checks etc.
      const baseResult = await super.canActivate(context);
      if (!baseResult) return false;

      // Fetch the folder to check ownership
      const folder = await this.dataSource.manager.findOne(Folder, {
        where: { id: folderId, organizationId: user.organizationId },
      });

      if (!folder) {
        throw new ForbiddenException('Folder not found');
      }

      const abilityFactory = await this.moduleRef.resolve(this.getAbilityFactory());
      const module = cloneDeep(this.reflector.get<MODULES>('tjModuleId', context.getClass()));
      const ability = await abilityFactory.createAbility(
        user,
        { moduleName: module, features: Array.isArray(features) ? features : [features] },
        [],
        request
      );

      if (!ability.can(FEATURE_KEY.DELETE_FOLDER, folder)) {
        throw new ForbiddenException({
          message: 'You do not have permission to delete this folder',
          organizationId: user.organizationId,
        });
      }

      return true;
    }

    // For other operations, use the base guard
    return super.canActivate(context);
  }
}
