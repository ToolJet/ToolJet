import { FeatureAbilityFactory } from './ability';
import { SubModule } from '@modules/app/sub-module';
import { DynamicModule } from '@nestjs/common';
import { GitSyncModule } from '@modules/git-sync/module';
import { AppGitModule } from '@modules/app-git/module';
import { FolderAppsModule } from '@modules/folder-apps/module';
import { FoldersModule } from '@modules/folders/module';
import { ImportExportResourcesModule } from '@modules/import-export-resources/module';

export class WorkspaceBranchesModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }, isMainImport?: boolean): Promise<DynamicModule> {
    const { WorkspaceBranchController, WorkspaceBranchService } = await this.getProviders(
      configs,
      'workspace-branches',
      ['controller', 'service']
    );

    const { PlatformGitPullService, PlatformGitPushService } = await this.getProviders(
      configs,
      'platform-git-sync',
      ['pull.service', 'push.service']
    );

    return {
      module: WorkspaceBranchesModule,
      imports: [
        await GitSyncModule.register(configs),
        await AppGitModule.register(configs),
        await FolderAppsModule.register(configs),
        await FoldersModule.register(configs),
        await ImportExportResourcesModule.register(configs),
      ],
      controllers: isMainImport ? [WorkspaceBranchController] : [],
      providers: [WorkspaceBranchService, FeatureAbilityFactory, PlatformGitPullService, PlatformGitPushService],
      exports: [WorkspaceBranchService, PlatformGitPullService, PlatformGitPushService],
    };
  }
}
