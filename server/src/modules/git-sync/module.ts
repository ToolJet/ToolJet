import { DynamicModule } from '@nestjs/common';
import { EncryptionModule } from '@modules/encryption/module';
import { ImportExportResourcesModule } from '@modules/import-export-resources/module';
import { TooljetDbModule } from '@modules/tooljet-db/module';
import { AppsModule } from '@modules/apps/module';
import { VersionModule } from '@modules/versions/module';
import { PluginsModule } from '@modules/plugins/module';
import { OrganizationGitSyncRepository } from './repository';
import { VersionRepository } from '@modules/versions/repository';
import { SubModule } from '@modules/app/sub-module';
import { FeatureAbilityFactory } from './ability';
import { GitSyncConfigsModule } from '@modules/git-sync-configs/module';

export class GitSyncModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }, isMainImport: boolean = false): Promise<DynamicModule> {
    const cacheKey = this.buildCacheKey(configs, isMainImport);
    const cached = this.getCachedModule(cacheKey);
    if (cached) return cached;

    const {
      GitSyncController,
      GitSyncService,
      SourceControlProviderService,
      HTTPSGitSyncService,
      GitLabGitSyncService,
      HTTPSGitSyncUtilityService,
      GitLabGitSyncUtilityService,
      BaseGitUtilService,
      BaseGitSyncService,
      GitSyncAdapter,
      WorkspaceGitSyncAdapter,
    } = await this.getProviders(configs, 'git-sync', [
      'controller',
      'service',
      'source-control-provider',
      'providers/github-https/service',
      'providers/gitlab/service',
      'providers/github-https/util.service',
      'providers/gitlab/util.service',
      'base-git-util.service',
      'base-git.service',
      'git-sync-adapter',
      'workspace-git-sync-adapter',
    ]);

    return this.cacheModule(cacheKey, {
      module: GitSyncModule,
      imports: [
        await GitSyncConfigsModule.register(configs),
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
        HTTPSGitSyncService,
        GitLabGitSyncService,
        HTTPSGitSyncUtilityService,
        GitLabGitSyncUtilityService,
        // Registry of git-sync provider adapters — the SINGLE place a new provider (e.g. Bitbucket)
        // is added. The dispatcher (SourceControlProviderService) resolves by gitType from this list,
        // so no dispatcher/base/adapter file changes are needed to add a provider.
        {
          provide: 'GIT_SYNC_PROVIDER_ADAPTERS',
          useFactory: (https, gitlab) => [https, gitlab],
          inject: [HTTPSGitSyncService, GitLabGitSyncService],
        },
        SourceControlProviderService,
        FeatureAbilityFactory,
        GitSyncAdapter,
        WorkspaceGitSyncAdapter,
      ],
      exports: [
        HTTPSGitSyncUtilityService,
        GitLabGitSyncUtilityService,
        BaseGitSyncService,
        BaseGitUtilService,
        GitSyncAdapter,
        WorkspaceGitSyncAdapter,
        OrganizationGitSyncRepository,
        SourceControlProviderService,
      ],
    });
  }
}
