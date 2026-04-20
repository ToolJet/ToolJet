import { DynamicModule } from '@nestjs/common';
import { SubModule } from '@modules/app/sub-module';
import { OrganizationRepository } from '@modules/organizations/repository';
import { OrganizationGitSyncRepository } from '@modules/git-sync/repository';

export class OrganizationEnvModule extends SubModule {
  private static cachedModule: DynamicModule | null = null;

  static async register(configs: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    if (this.cachedModule) {
      return this.cachedModule;
    }

    const { OrganizationEnvRegistryService, GitSyncEnvUtilService, OrganizationEnvUtilService } = await this.getProviders(configs, 'organization-env', [
      'service',
      'services/gitsync.util.service',
      'util.service',
    ]);

    this.cachedModule = {
      module: OrganizationEnvModule,
      global: true,
      imports: [],
      providers: [OrganizationEnvRegistryService, GitSyncEnvUtilService, OrganizationEnvUtilService, OrganizationRepository, OrganizationGitSyncRepository],
      exports: [GitSyncEnvUtilService, OrganizationEnvUtilService],
    };

    return this.cachedModule;
  }
}
