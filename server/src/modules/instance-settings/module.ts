import { EncryptionModule } from '@modules/encryption/module';
import { DynamicModule } from '@nestjs/common';
import { FeatureAbilityFactory } from './ability';
import { OrganizationRepository } from '@modules/organizations/repository';
import { SubModule } from '@modules/app/sub-module';

export class InstanceSettingsModule extends SubModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }, isMainImport?: boolean): Promise<DynamicModule> {
    const cacheKey = this.buildCacheKey(configs, isMainImport);
    const cached = this.getCachedModule(cacheKey);
    if (cached) return cached;

    const {
      InstanceSettingsService,
      InstanceSettingsUtilService,
      InstanceSettingsController,
      SsrfRuntimeConfigService,
    } = await this.getProviders(configs, 'instance-settings', [
      'service',
      'controller',
      'util.service',
      'ssrf-runtime-config.service',
    ]);

    return this.cacheModule(cacheKey, {
      module: InstanceSettingsModule,
      imports: [await EncryptionModule.register(configs)],
      controllers: isMainImport ? [InstanceSettingsController] : [],
      providers: [
        InstanceSettingsUtilService,
        InstanceSettingsService,
        SsrfRuntimeConfigService,
        FeatureAbilityFactory,
        OrganizationRepository,
      ],
      exports: [InstanceSettingsUtilService],
    });
  }
}
