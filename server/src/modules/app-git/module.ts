import { DynamicModule } from '@nestjs/common';
import { GitTagInterface } from '@ee/app-git/interfaces/git-tag.interface';
import { AppsRepository } from '@modules/apps/repository';
import { VersionRepository } from '@modules/versions/repository';
import { GitSyncModule } from '@modules/git-sync/module';
import { AppsModule } from '@modules/apps/module';
import { TooljetDbModule } from '@modules/tooljet-db/module';
import { ImportExportResourcesModule } from '@modules/import-export-resources/module';
import { VersionModule } from '@modules/versions/module';
import { FeatureAbilityFactory } from '@modules/app-git/ability/index';
import { OrganizationGitSyncRepository } from '@modules/git-sync/repository';
import { SubModule } from '@modules/app/sub-module';
import { FolderAppsModule } from '@modules/folder-apps/module';
import { FoldersModule } from '@modules/folders/module';
export class AppGitModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }, isMainImport: boolean = false): Promise<DynamicModule> {
    const cacheKey = this.buildCacheKey(configs, isMainImport);
    const cached = this.getCachedModule(cacheKey);
    if (cached) return cached;

    const {
      AppGitController,
      AppGitService,
      SourceControlProviderService,
      SSHAppGitService,
      HTTPSAppGitService,
      GitLabAppGitService,
      SSHAppGitUtilityService,
      HTTPSAppGitUtilityService,
      GitLabAppGitUtilityService,
      AppVersionRenameListener,
      AppGitOperationsUtil,
      AppGitFileOperationsUtil,
      GitOperationsUtil,
      BranchingBusinessUtil,
      DataSourceBranchUtil,
    } = await this.getProviders(configs, 'app-git', [
      'controller',
      'service',
      'source-control-provider',
      'providers/github-ssh/service',
      'providers/github-https/service',
      'providers/gitlab/service',
      'providers/github-https/util.service',
      'providers/github-ssh/util.service',
      'providers/gitlab/util.service',
      'listener',
      'shared/app-git-operations.util',
      'shared/app-git-file-operations.util',
      'shared/git-operations.util',
      'shared/branching-business.util',
      'shared/datasource-branch.util',
    ]);

    const { GitConflictDetectionService } = await this.getProviders(
      configs,
      'platform-git-sync',
      ['git-conflict-detection.service']
    );
    return this.cacheModule(cacheKey, {
      module: AppGitModule,
      imports: [
        await FolderAppsModule.register(configs),
        await FoldersModule.register(configs),
        await AppsModule.register(configs),
        await GitSyncModule.register(configs),
        await TooljetDbModule.register(configs),
        await ImportExportResourcesModule.register(configs),
        await VersionModule.register(configs),
      ],
      controllers: isMainImport ? [AppGitController] : [],
      providers: [
        OrganizationGitSyncRepository,
        AppsRepository,
        AppGitService,
        { provide: GitTagInterface, useExisting: AppGitService },
        SourceControlProviderService,
        SSHAppGitService,
        HTTPSAppGitService,
        GitLabAppGitService,
        SSHAppGitUtilityService,
        HTTPSAppGitUtilityService,
        GitLabAppGitUtilityService,
        AppGitOperationsUtil,
        AppGitFileOperationsUtil,
        GitOperationsUtil,
        BranchingBusinessUtil,
        DataSourceBranchUtil,
        GitConflictDetectionService,
        VersionRepository,
        FeatureAbilityFactory,
        ...(isMainImport ? [AppVersionRenameListener] : []),
      ],
      exports: [
        GitTagInterface,
        SourceControlProviderService,
        SSHAppGitUtilityService,
        HTTPSAppGitUtilityService,
        GitLabAppGitUtilityService,
        BranchingBusinessUtil,
        DataSourceBranchUtil,
        HTTPSAppGitService,
        GitOperationsUtil,
      ],
    });
  }
}
