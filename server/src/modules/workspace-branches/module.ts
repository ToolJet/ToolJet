import { FeatureAbilityFactory } from './ability';
import { SubModule } from '@modules/app/sub-module';
import { DynamicModule } from '@nestjs/common';
import { GitSyncModule } from '@modules/git-sync/module';
import { AppGitModule } from '@modules/app-git/module';
import { FolderAppsModule } from '@modules/folder-apps/module';
import { FoldersModule } from '@modules/folders/module';
import { ImportExportResourcesModule } from '@modules/import-export-resources/module';
import { BackgroundProcessorModule } from '@modules/background-processor/module';
import { AppsModule } from '@modules/apps/module';

export class WorkspaceBranchesModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }, isMainImport?: boolean): Promise<DynamicModule> {
    const cacheKey = this.buildCacheKey(configs, isMainImport);
    const cached = this.getCachedModule(cacheKey);
    if (cached) return cached;

    const { DeletionCommitListener, WorkspaceBranchController, WorkspaceBranchService } = await this.getProviders(
      configs,
      'workspace-branches',
      ['controller', 'service', 'deletion-commit.listener']
    );

    const { PlatformGitPullService, PlatformGitPushService, GitConflictDetectionService } = await this.getProviders(
      configs,
      'platform-git-sync',
      ['pull.service', 'push.service', 'git-conflict-detection.service']
    );

    return this.cacheModule(cacheKey, {
      module: WorkspaceBranchesModule,
      imports: [
        await AppsModule.register(configs),
        await GitSyncModule.register(configs),
        await AppGitModule.register(configs),
        await FolderAppsModule.register(configs),
        await FoldersModule.register(configs),
        await ImportExportResourcesModule.register(configs),
        await BackgroundProcessorModule.register(configs),
      ],
      controllers: isMainImport ? [WorkspaceBranchController] : [],
      providers: [
        WorkspaceBranchService,
        FeatureAbilityFactory,
        PlatformGitPullService,
        PlatformGitPushService,
        GitConflictDetectionService,
        ...(isMainImport ? [DeletionCommitListener] : []),
      ],
      exports: [
        WorkspaceBranchService,
        PlatformGitPullService,
        PlatformGitPushService,
        GitConflictDetectionService,
      ],
    });
  }
}
