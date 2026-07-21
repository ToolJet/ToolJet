import { FeatureAbilityFactory } from './ability';
import { SubModule } from '@modules/app/sub-module';
import { DynamicModule } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { GIT_SYNC_QUEUE } from './constants';
import { GitSyncModule } from '@modules/git-sync/module';
import { AppGitModule } from '@modules/app-git/module';
import { FolderAppsModule } from '@modules/folder-apps/module';
import { FoldersModule } from '@modules/folders/module';
import { ImportExportResourcesModule } from '@modules/import-export-resources/module';
import { AppsModule } from '@modules/apps/module';
import { WebhookSkipFlagModule } from '@modules/git-sync-webhooks/webhook-skip-flag.module';
import { NotificationsModule } from '@modules/notifications/module';

export class WorkspaceBranchesModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }, isMainImport?: boolean): Promise<DynamicModule> {
    const cacheKey = this.buildCacheKey(configs, isMainImport);
    const cached = this.getCachedModule(cacheKey);
    if (cached) return cached;

    const {
      DeletionCommitListener,
      WorkspaceBranchController,
      WorkspaceBranchService,
      GitSyncQueueService,
      GitSyncQueueProcessor,
    } = await this.getProviders(configs, 'workspace-branches', [
      'controller',
      'service',
      'deletion-commit.listener',
      'git-sync-queue.service',
      'git-sync-queue.processor',
    ]);

    const { PlatformGitPullService, PlatformGitPushService, GitConflictDetectionService } = await this.getProviders(
      configs,
      'platform-git-sync',
      ['pull.service', 'push.service', 'git-conflict-detection.service']
    );

    return this.cacheModule(cacheKey, {
      module: WorkspaceBranchesModule,
      imports: [
        // Heavy git-sync work (create/pull/delete branch) runs on this queue
        BullModule.registerQueue({
          name: GIT_SYNC_QUEUE,
        }),
        BullBoardModule.forFeature({
          name: GIT_SYNC_QUEUE,
          adapter: BullMQAdapter,
        }),
        await AppsModule.register(configs),
        await GitSyncModule.register(configs),
        await AppGitModule.register(configs),
        await FolderAppsModule.register(configs),
        await FoldersModule.register(configs),
        await ImportExportResourcesModule.register(configs),
        await WebhookSkipFlagModule.register(configs),
        await NotificationsModule.register(configs),
      ],
      controllers: isMainImport ? [WorkspaceBranchController] : [],
      providers: [
        WorkspaceBranchService,
        GitSyncQueueService,
        FeatureAbilityFactory,
        PlatformGitPullService,
        PlatformGitPushService,
        GitConflictDetectionService,
        ...(isMainImport
          ? [
              DeletionCommitListener,
              // Same pattern as workflows: job processors only on WORKER=true pods,
              // so HTTP-only instances never run git jobs
              ...(process.env.WORKER === 'true' ? [GitSyncQueueProcessor] : []),
            ]
          : []),
      ],
      exports: [
        WorkspaceBranchService,
        GitSyncQueueService,
        PlatformGitPullService,
        PlatformGitPushService,
        GitConflictDetectionService,
      ],
    });
  }
}
