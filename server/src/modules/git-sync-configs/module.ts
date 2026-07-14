import { DynamicModule } from '@nestjs/common';
import { SubModule } from '@modules/app/sub-module';
import { FeatureAbilityFactory } from './ability';
import { GitSyncConfigsRepository } from './repository';

// Self-contained module — does NOT import any other module. LicenseModule is global so
// its services (LicenseTermsService) are available without an explicit import; the same
// applies to OrganizationEnvModule (GitSyncEnvUtilService) and LoggingModule
// (TransactionLogger). Guards reference classes directly; their own deps are wired
// through the modules that define them.
export class GitSyncConfigsModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }, isMainImport?: boolean): Promise<DynamicModule> {
    const cacheKey = this.buildCacheKey(configs, isMainImport);
    const cached = this.getCachedModule(cacheKey);
    if (cached) return cached;

    const {
      GitSyncConfigsController,
      GitSyncConfigsService,
      GitSyncConfigsUtilService,
      RemoteBranchCacheService,
      GitObjectCacheService,
    } = await this.getProviders(configs, 'git-sync-configs', [
      'controller',
      'service',
      'util.service',
      'services/remote-branch-cache.service',
      'services/git-object-cache.service',
    ]);

    return this.cacheModule(cacheKey, {
      module: GitSyncConfigsModule,
      controllers: isMainImport ? [GitSyncConfigsController] : [],
      providers: [
        GitSyncConfigsRepository,
        GitSyncConfigsService,
        GitSyncConfigsUtilService,
        FeatureAbilityFactory,
        RemoteBranchCacheService,
        GitObjectCacheService,
      ],
      exports: [GitSyncConfigsUtilService, RemoteBranchCacheService, GitObjectCacheService],
    });
  }
}
