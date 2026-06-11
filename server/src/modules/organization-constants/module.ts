import { Module, DynamicModule } from '@nestjs/common';
import { AppEnvironmentsModule } from '@modules/app-environments/module';
import { EncryptionModule } from '@modules/encryption/module';
import { OrganizationConstantRepository } from './repository';
import { FeatureAbilityFactory } from './ability';
import { OrganizationRepository } from '@modules/organizations/repository';
import { AppsRepository } from '@modules/apps/repository';
import { SubModule } from '@modules/app/sub-module';

@Module({})
export class OrganizationConstantModule extends SubModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }, isMainImport?: boolean): Promise<DynamicModule> {
    const cacheKey = this.buildCacheKey(configs, isMainImport);
    const cached = this.getCachedModule(cacheKey);
    if (cached) return cached;

    const {
      OrganizationConstantController,
      OrganizationConstantsService,
      OrganizationConstantsUtilService,
      EnvironmentConstantsService,
    } = await this.getProviders(configs, 'organization-constants', [
      'controller',
      'service',
      'util.service',
      'services/environment-constants.service',
    ]);

    return this.cacheModule(cacheKey, {
      module: OrganizationConstantModule,
      imports: [
        await AppEnvironmentsModule.register(configs),
        await EncryptionModule.register(configs),
      ],
      controllers: isMainImport ? [OrganizationConstantController] : [],
      providers: [
        EnvironmentConstantsService,
        OrganizationConstantsUtilService,
        OrganizationConstantRepository,
        OrganizationRepository,
        AppsRepository,
        OrganizationConstantsService,
        FeatureAbilityFactory,
      ],
      exports: [EnvironmentConstantsService, OrganizationConstantsUtilService],
    });
  }
}
