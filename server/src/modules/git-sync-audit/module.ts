import { DynamicModule } from '@nestjs/common';
import { SubModule } from '@modules/app/sub-module';
import { GitSyncConfigsModule } from '@modules/git-sync-configs/module';

// Global: Git Sync operations finish in several modules (app-git, workspace-branches, webhooks),
// and in queue workers, and all of them record through the one service.
export class GitSyncAuditModule extends SubModule {
  static async forRoot(configs: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const { GitSyncAuditService } = await this.getProviders(configs, 'git-sync-audit', ['service']);

    return {
      module: GitSyncAuditModule,
      global: true,
      imports: [await GitSyncConfigsModule.register(configs)],
      providers: [GitSyncAuditService],
      exports: [GitSyncAuditService],
    };
  }
}
