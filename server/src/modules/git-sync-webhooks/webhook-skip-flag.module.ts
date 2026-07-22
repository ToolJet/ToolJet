import { SubModule } from '@modules/app/sub-module';
import { DynamicModule } from '@nestjs/common';

/**
 * Standalone module for the webhook skip-flag service.
 *
 * Extracted from GitSyncWebhookModule to break a circular dependency:
 *   GitSyncWebhookModule → WorkspaceBranchesModule → (skip flag) → GitSyncWebhookModule
 *
 * Consumers: WorkspaceBranchesModule, AppGitModule, GitSyncWebhookModule
 */
export class WebhookSkipFlagModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const cacheKey = this.buildCacheKey(configs);
    const cached = this.getCachedModule(cacheKey);
    if (cached) return cached;

    const { WebhookSkipFlagService } = await this.getProviders(configs, 'git-sync-webhooks', [
      'webhook-skip-flag.service',
    ]);

    return this.cacheModule(cacheKey, {
      module: WebhookSkipFlagModule,
      providers: [WebhookSkipFlagService],
      exports: [WebhookSkipFlagService],
    });
  }
}
