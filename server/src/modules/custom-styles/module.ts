import { DynamicModule } from '@nestjs/common';
import { OrganizationsModule } from '@modules/organizations/module';
import { FeatureAbilityFactory } from './ability';
import { OrganizationRepository } from '@modules/organizations/repository';
import { AppsRepository } from '@modules/apps/repository';
import { SubModule } from '@modules/app/sub-module';

export class CustomStylesModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }, isMainImport: boolean = false): Promise<DynamicModule> {
    const cacheKey = this.buildCacheKey(configs, isMainImport);
    const cached = this.getCachedModule(cacheKey);
    if (cached) return cached;

    const { CustomStylesController, CustomStylesService } = await this.getProviders(configs, 'custom-styles', [
      'controller',
      'service',
    ]);
    return this.cacheModule(cacheKey, {
      module: CustomStylesModule,
      imports: [await OrganizationsModule.register(configs)],
      providers: [CustomStylesService, FeatureAbilityFactory, OrganizationRepository, AppsRepository],
      controllers: isMainImport ? [CustomStylesController] : [],
      exports: [],
    });
  }
}
