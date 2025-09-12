import { Module, DynamicModule } from '@nestjs/common';
import { SessionModule } from '@modules/session/module';
import { InstanceSettingsModule } from '@modules/instance-settings/module';
import { OrganizationUsersModule } from '@modules/organization-users/module';
import { RolesModule } from '@modules/roles/module';
import { GroupPermissionsModule } from '@modules/group-permissions/module';
import { ProfileModule } from '@modules/profile/module';
import { UserRepository } from '@modules/users/repositories/repository';
import { OrganizationRepository } from '@modules/organizations/repository';
import { OrganizationUsersRepository } from '@modules/organization-users/repository';
import { RolesRepository } from '@modules/roles/repository';
import { LoginConfigsModule } from '@modules/login-configs/module';
import { SSOResponseRepository } from '@modules/auth/oauth/repository/sso-response.repository';
import { FeatureAbilityFactory } from './ability';
import { GroupPermissionsRepository } from '@modules/group-permissions/repository';
import { SetupOrganizationsModule } from '@modules/setup-organization/module';
import { SSOConfigsRepository } from '@modules/login-configs/repository';
import { AppEnvironmentsModule } from '@modules/app-environments/module';
import { SubModule } from '@modules/app/sub-module';
import { OnboardingModule } from '@modules/onboarding/module';

@Module({})
export class AuthModule extends SubModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const {
      AuthController,
      AuthService,
      AuthUtilService,
      OauthController,
      OauthService,
      SamlService,
      GitOAuthService,
      GoogleOAuthService,
      OidcOAuthService,
      LdapService,
      WebsiteAuthController,
      WebsiteAuthService,
    } = await this.getProviders(configs, 'auth', [
      'controller',
      'service',
      'util.service',
      'oauth/controller',
      'oauth/service',
      'oauth/util-services/saml.service',
      'oauth/util-services/git-oauth.service',
      'oauth/util-services/google-oauth.service',
      'oauth/util-services/oidc-auth.service',
      'oauth/util-services/ldap.service',
      'website/controller',
      'website/service',
    ]);

    return {
      module: AuthModule,
      imports: [
        await SessionModule.register(configs),
        await InstanceSettingsModule.register(configs),
        await OrganizationUsersModule.register(configs),
        await RolesModule.register(configs),
        await GroupPermissionsModule.register(configs),
        await ProfileModule.register(configs),
        await SessionModule.register(configs),
        await LoginConfigsModule.register(configs),
        await SetupOrganizationsModule.register(configs),
        await AppEnvironmentsModule.register(configs),
        await OnboardingModule.register(configs),
      ],
      controllers: [AuthController, OauthController, WebsiteAuthController],
      providers: [
        AuthService,
        UserRepository,
        OrganizationRepository,
        RolesRepository,
        OrganizationUsersRepository,
        AuthUtilService,
        OauthService,
        SamlService,
        GitOAuthService,
        GoogleOAuthService,
        OidcOAuthService,
        LdapService,
        SSOResponseRepository,
        FeatureAbilityFactory,
        GroupPermissionsRepository,
        SSOConfigsRepository,
        WebsiteAuthService,
      ],
      exports: [AuthUtilService],
    };
  }
}
