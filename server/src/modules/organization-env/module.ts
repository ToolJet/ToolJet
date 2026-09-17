import { DynamicModule } from '@nestjs/common';
import { SubModule } from '@modules/app/sub-module';
import { OrganizationRepository } from '@modules/organizations/repository';
import { OrganizationGitSyncRepository } from '@modules/git-sync/repository';

export class OrganizationEnvModule extends SubModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const cacheKey = this.buildCacheKey(configs);
    const cached = this.getCachedModule(cacheKey);
    if (cached) return cached;

    const { OrganizationEnvRegistryService, GitSyncEnvUtilService, OrganizationEnvUtilService } =
      await this.getProviders(configs, 'organization-env', [
        'service',
        'services/gitsync.util.service',
        'util.service',
      ]);

    return this.cacheModule(cacheKey, {
      module: OrganizationEnvModule,
      global: true,
      imports: [],
      providers: [
        OrganizationEnvRegistryService,
        GitSyncEnvUtilService,
        OrganizationEnvUtilService,
        OrganizationRepository,
        OrganizationGitSyncRepository,
      ],
      exports: [GitSyncEnvUtilService, OrganizationEnvUtilService],
    });
  }
}
