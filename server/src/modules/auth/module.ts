import { Module, DynamicModule } from '@nestjs/common';
import { getImportPath } from '@modules/app/constants';
import { SessionModule } from '@modules/session/module';
import { InstanceSettingsModule } from '@modules/instance-settings/module';
import { OrganizationUsersModule } from '@modules/organization-users/module';
import { RolesModule } from '@modules/roles/module';
import { GroupPermissionsModule } from '@modules/group-permissions/module';
import { OnboardingModule } from '@modules/onboarding/module';
import { ProfileModule } from '@modules/profile/module';
import { UserRepository } from '@modules/users/repository';
import { OrganizationRepository } from '@modules/organizations/repository';
import { OrganizationUsersRepository } from '@modules/organization-users/repository';
import { RolesRepository } from '@modules/roles/repository';
import { LoginConfigsModule } from '@modules/login-configs/module';
import { SSOResponseRepository } from '@modules/auth/oauth/repository/sso-response.repository';
import { FeatureAbilityFactory } from './ability';
import { AbilityService } from '@modules/ability/service';
import { AbilityUtilService } from '@modules/ability/util.service';
import { GroupPermissionsRepository } from '@modules/group-permissions/repository';

@Module({})
export class AuthModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const importPath = await getImportPath(configs?.IS_GET_CONTEXT);
    const { AuthController } = await import(`${importPath}/auth/controller`);
    const { AuthService } = await import(`${importPath}/auth/service`);
    const { AuthUtilService } = await import(`${importPath}/auth/util.service`);
    const { OauthController } = await import(`${importPath}/auth/oauth/controller`);
    const { OauthService } = await import(`${importPath}/auth/oauth/service`);
    const { SamlService } = await import(`${importPath}/auth/oauth/util-services/saml.service`);
    const { GitOAuthService } = await import(`${importPath}/auth/oauth/util-services/git-oauth.service`);
    const { GoogleOAuthService } = await import(`${importPath}/auth/oauth/util-services/google-oauth.service`);
    const { OidcOAuthService } = await import(`${importPath}/auth/oauth/util-services/oidc-auth.service`);
    const { LdapService } = await import(`${importPath}/auth/oauth/util-services/ldap.service`);
    const { OrganizationsUtilService } = await import(`${importPath}/organizations/util.service`);
    const { AppEnvironmentUtilService } = await import(`${importPath}/app-environments/util.service`);

    return {
      module: AuthModule,
      imports: [
        await SessionModule.register(configs),
        await InstanceSettingsModule.register(configs),
        await OrganizationUsersModule.register(configs),
        await RolesModule.register(configs),
        await OnboardingModule.register(configs),
        await GroupPermissionsModule.register(configs),
        await ProfileModule.register(configs),
        await SessionModule.register(configs),
        await OrganizationUsersModule.register(configs),
        await LoginConfigsModule.register(configs),
      ],
      controllers: [AuthController, OauthController],
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
        AbilityService,
        AbilityUtilService,
        OrganizationsUtilService,
        AppEnvironmentUtilService,
        GroupPermissionsRepository,
      ],
      exports: [AuthUtilService],
    };
  }
}
