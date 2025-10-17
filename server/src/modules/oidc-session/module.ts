import { DynamicModule } from '@nestjs/common';
import { SubModule } from '@modules/app/sub-module';
import { LoginConfigsModule } from '@modules/login-configs/module';

export class OidcSessionModule extends SubModule {
  static async register(config: { IS_GET_CONTEXT: boolean }, isMainImport?: boolean): Promise<DynamicModule> {
    const { OidcSessionUtilService } = await this.getProviders(config, 'oidc-session', ['oidc-session-util.service']);

    const providerImports = [
      //   RolesRepository,
      //   UserRepository,
      //   AppsRepository,
      //   OrganizationRepository,
      //   OrganizationUsersRepository,
      //   GroupPermissionsRepository,
      //   FeatureAbilityFactory,
      //   UserSessionRepository,
      OidcSessionUtilService,
    ];

    return {
      module: OidcSessionModule,
      imports: [await LoginConfigsModule.register(config)],
      providers: providerImports,
      exports: [OidcSessionUtilService],
    };
  }
}
