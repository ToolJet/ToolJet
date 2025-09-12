import { InstanceSettingsModule } from '@modules/instance-settings/module';
import { DynamicModule } from '@nestjs/common';
import { OrganizationRepository } from '@modules/organizations/repository';
import { SSOConfigsRepository } from './repository';
import { EncryptionModule } from '@modules/encryption/module';
import { FeatureAbilityFactory } from './ability';
import { SsoConfigOidcGroupSyncRepository } from './oidc-group-sync.repository';
import { SubModule } from '@modules/app/sub-module';

export class LoginConfigsModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const { LoginConfigsService, LoginConfigsController, LoginConfigsUtilService } = await this.getProviders(
      configs,
      'login-configs',
      ['service', 'controller', 'util.service']
    );

    const { SSOGuard, FeatureGuard } = await this.getProviders(configs, 'licensing', [
      'guards/sso.guard',
      'guards/feature.guard',
    ]);

    return {
      module: LoginConfigsModule,
      imports: [await InstanceSettingsModule.register(configs), await EncryptionModule.register(configs)],
      controllers: [LoginConfigsController],
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
    };
  }
}
