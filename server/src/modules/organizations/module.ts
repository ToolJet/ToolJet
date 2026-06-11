import { DynamicModule } from '@nestjs/common';
import { InstanceSettingsModule } from '@modules/instance-settings/module';
import { OrganizationRepository } from './repository';
import { AppEnvironmentsModule } from '@modules/app-environments/module';
import { SubModule } from '@modules/app/sub-module';
import { CustomDomainRepository } from '@modules/custom-domains/repository';

export class OrganizationsModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }, isMainImport?: boolean): Promise<DynamicModule> {
    const cacheKey = this.buildCacheKey(configs, isMainImport);
    const cached = this.getCachedModule(cacheKey);
    if (cached) return cached;

    const { OrganizationsService, OrganizationsController, OrganizationsUtilService, FeatureAbilityFactory } =
      await this.getProviders(configs, 'organizations', ['controller', 'service', 'util.service', 'ability']);

    return this.cacheModule(cacheKey, {
      module: OrganizationsModule,
      imports: [await InstanceSettingsModule.register(configs), await AppEnvironmentsModule.register(configs)],
      controllers: isMainImport ? [OrganizationsController] : [],
      providers: [OrganizationsService, OrganizationRepository, CustomDomainRepository, FeatureAbilityFactory, OrganizationsUtilService],
      exports: [OrganizationsUtilService],
    });
  }
}
