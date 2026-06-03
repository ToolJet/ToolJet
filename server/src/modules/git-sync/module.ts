import { DynamicModule } from '@nestjs/common';
import { EncryptionModule } from '@modules/encryption/module';
import { ImportExportResourcesModule } from '@modules/import-export-resources/module';
import { TooljetDbModule } from '@modules/tooljet-db/module';
import { AppsModule } from '@modules/apps/module';
import { VersionModule } from '@modules/versions/module';
import { PluginsModule } from '@modules/plugins/module';
import { EncryptionService } from '@modules/encryption/service';
import { OrganizationGitSyncRepository } from './repository';
import { VersionRepository } from '@modules/versions/repository';
import { SubModule } from '@modules/app/sub-module';
import { FeatureAbilityFactory } from './ability';

export class GitSyncModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }, isMainImport: boolean = false): Promise<DynamicModule> {
    const cacheKey = this.buildCacheKey(configs, isMainImport);
    const cached = this.getCachedModule(cacheKey);
    if (cached) return cached;

    const {
      GitSyncController,
      GitSyncService,
      SourceControlProviderService,
      SSHGitSyncService,
      HTTPSGitSyncService,
      GitLabGitSyncService,
      HTTPSGitSyncUtilityService,
      SSHGitSyncUtilityService,
      GitLabGitSyncUtilityService,
      BaseGitUtilService,
      BaseGitSyncService,
      GitSyncAdapter,
      WorkspaceGitSyncAdapter,
      RemoteBranchCacheService,
      GitObjectCacheService,
    } = await this.getProviders(configs, 'git-sync', [
      'controller',
      'service',
      'source-control-provider',
      'providers/github-ssh/service',
      'providers/github-https/service',
      'providers/gitlab/service',
      'providers/github-https/util.service',
      'providers/github-ssh/util.service',
      'providers/gitlab/util.service',
      'base-git-util.service',
      'base-git.service',
      'git-sync-adapter',
      'workspace-git-sync-adapter',
      'remote-branch-cache.service',
      'git-object-cache.service',
    ]);

    return this.cacheModule(cacheKey, {
      module: GitSyncModule,
      imports: [
        await EncryptionModule.register(configs),
        await ImportExportResourcesModule.register(configs),
        await TooljetDbModule.register(configs),
        await AppsModule.register(configs),
        await VersionModule.register(configs),
        await PluginsModule.register(configs),
      ],
      controllers: isMainImport ? [GitSyncController] : [],
      providers: [
        OrganizationGitSyncRepository,
        VersionRepository,
        BaseGitUtilService,
        BaseGitSyncService,
        GitSyncService,
        SSHGitSyncService,
        HTTPSGitSyncService,
        GitLabGitSyncService,
        HTTPSGitSyncUtilityService,
        SSHGitSyncUtilityService,
        GitLabGitSyncUtilityService,
        SourceControlProviderService,
        FeatureAbilityFactory,
        GitSyncAdapter,
        WorkspaceGitSyncAdapter,
        RemoteBranchCacheService,
        EncryptionService,
        GitObjectCacheService,
      ],
      exports: [
        HTTPSGitSyncUtilityService,
        SSHGitSyncUtilityService,
        GitLabGitSyncUtilityService,
        BaseGitSyncService,
        BaseGitUtilService,
        GitSyncAdapter,
        WorkspaceGitSyncAdapter,
        OrganizationGitSyncRepository,
        SourceControlProviderService,
        RemoteBranchCacheService,
        GitObjectCacheService,
      ],
    });
  }
}
