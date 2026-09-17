import { InstanceSettingsModule } from '@modules/instance-settings/module';
import { DynamicModule } from '@nestjs/common';
import { OrganizationRepository } from '@modules/organizations/repository';
import { SSOConfigsRepository } from './repository';
import { EncryptionModule } from '@modules/encryption/module';
import { FeatureAbilityFactory } from './ability';
import { SsoConfigOidcGroupSyncRepository } from './oidc-group-sync.repository';
import { SubModule } from '@modules/app/sub-module';

export class LoginConfigsModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }, isMainImport?: boolean): Promise<DynamicModule> {
    const cacheKey = this.buildCacheKey(configs, isMainImport);
    const cached = this.getCachedModule(cacheKey);
    if (cached) return cached;

    const { LoginConfigsService, LoginConfigsController, LoginConfigsUtilService } = await this.getProviders(
      configs,
      'login-configs',
      ['service', 'controller', 'util.service']
    );

    const { SSOGuard, FeatureGuard } = await this.getProviders(configs, 'licensing', [
      'guards/sso.guard',
      'guards/feature.guard',
    ]);

    return this.cacheModule(cacheKey, {
      module: LoginConfigsModule,
      imports: [await InstanceSettingsModule.register(configs), await EncryptionModule.register(configs)],
      controllers: isMainImport ? [LoginConfigsController] : [],
      providers: [
        LoginConfigsService,
        LoginConfigsUtilService,
        OrganizationRepository,
        SSOConfigsRepository,
        SsoConfigOidcGroupSyncRepository,
        FeatureAbilityFactory,
        SSOGuard,
        FeatureGuard,
      ],
      exports: [LoginConfigsUtilService],
    });
  }
}
