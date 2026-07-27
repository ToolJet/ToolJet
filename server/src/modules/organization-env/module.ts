import { DynamicModule } from '@nestjs/common';
import { SubModule } from '@modules/app/sub-module';
import { OrganizationRepository } from '@modules/organizations/repository';
import { OrganizationGitSyncRepository } from '@modules/git-sync/repository';
import { SSOConfigsRepository } from '@modules/login-configs/repository';

export class OrganizationEnvModule extends SubModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const cacheKey = this.buildCacheKey(configs);
    const cached = this.getCachedModule(cacheKey);
    if (cached) return cached;

    const {
      OrganizationEnvRegistryService,
      GitSyncEnvUtilService,
      OidcEnvUtilService,
      SamlEnvUtilService,
      LdapEnvUtilService,
      OrganizationEnvUtilService,
    } = await this.getProviders(configs, 'organization-env', [
      'service',
      'services/gitsync.util.service',
      'services/oidc.util.service',
      'services/saml.util.service',
      'services/ldap.util.service',
      'util.service',
    ]);

    return this.cacheModule(cacheKey, {
      module: OrganizationEnvModule,
      global: true,
      imports: [],
      providers: [
        OrganizationEnvRegistryService,
        GitSyncEnvUtilService,
        OidcEnvUtilService,
        SamlEnvUtilService,
        LdapEnvUtilService,
        OrganizationEnvUtilService,
        OrganizationRepository,
        OrganizationGitSyncRepository,
        SSOConfigsRepository,
      ],
      exports: [
        GitSyncEnvUtilService,
        OidcEnvUtilService,
        SamlEnvUtilService,
        LdapEnvUtilService,
        OrganizationEnvUtilService,
      ],
    });
  }
}
