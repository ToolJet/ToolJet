import { DynamicModule } from '@nestjs/common';
import { SubModule } from '@modules/app/sub-module';
import { LoginConfigsModule } from '@modules/login-configs/module';
import { InstanceSettingsModule } from '@modules/instance-settings/module';
import { SSOConfigsRepository } from '@modules/login-configs/repository';

export class OidcSessionModule extends SubModule {
  static async register(config: { IS_GET_CONTEXT: boolean }, isMainImport?: boolean): Promise<DynamicModule> {
    const { OidcSessionUtilService } = await this.getProviders(config, 'oidc-session', ['oidc-session-util.service']);

    const providerImports = [OidcSessionUtilService, SSOConfigsRepository];

    return {
      module: OidcSessionModule,
      imports: [await LoginConfigsModule.register(config), await InstanceSettingsModule.register(config)],
      providers: providerImports,
      exports: [OidcSessionUtilService],
    };
  }
}
