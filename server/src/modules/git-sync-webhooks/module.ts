import { DynamicModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { SubModule } from '@modules/app/sub-module';
import { TOOLJET_EDITIONS } from '@modules/app/constants';
import { BullModule } from '@nestjs/bullmq';
import { getTooljetEdition } from '@helpers/utils.helper';
import { WorkspaceBranchesModule } from '@modules/workspace-branches/module';
import { WebhookSkipFlagModule } from '@modules/git-sync-webhooks/webhook-skip-flag.module';
import { NotificationsModule } from '@modules/notifications/module';

export class GitSyncWebhookModule extends SubModule {
  static async register(
    configs?: { IS_GET_CONTEXT: boolean },
    isMainImport?: boolean,
  ): Promise<DynamicModule> {
    const cacheKey = this.buildCacheKey(configs, isMainImport);
    const cached = this.getCachedModule(cacheKey);
    if (cached) return cached;

    const { GitSyncWebhooksController, GitSyncWebhookService } = await this.getProviders(
      configs,
      'git-sync-webhooks',
      ['controller', 'service'],
    );

    const edition = getTooljetEdition();
    const isEEOrCloud = edition === TOOLJET_EDITIONS.EE || edition === TOOLJET_EDITIONS.Cloud;

    const imports: any[] = [
      ThrottlerModule.forRootAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => [
          {
            ttl: config.get('WEBHOOK_THROTTLE_TTL') || 60000,
            limit: config.get('WEBHOOK_THROTTLE_LIMIT') || 100,
          },
        ],
      }),
    ];
    const providers: any[] = [GitSyncWebhookService];

    if (isEEOrCloud) {
      imports.push(
        BullModule.registerQueue({
          name: 'git-sync-webhooks',
          defaultJobOptions: {
            removeOnComplete: { age: 86400, count: 1000 },
            removeOnFail: { age: 604800, count: 5000 },
            attempts: 5,
            backoff: {
              type: 'exponential',
              delay: 5000,
            },
          },
        }),
        await WorkspaceBranchesModule.register(configs),
        await WebhookSkipFlagModule.register(configs),
        await NotificationsModule.register(configs),
      );

      // EE-only services — no CE stubs needed since the entire block is edition-gated
      const { WebhookSignatureService } = await this.getProviders(
        configs,
        'git-sync-webhooks',
        ['services/webhook-signature.service'],
      );
      const { WebhookDeduplicationService } = await this.getProviders(
        configs,
        'git-sync-webhooks',
        ['services/webhook-deduplication.service'],
      );

      providers.push(WebhookSignatureService, WebhookDeduplicationService);

      if (isMainImport && !configs?.IS_GET_CONTEXT) {
        const { GitSyncWebhookWorker } = await this.getProviders(
          configs,
          'git-sync-webhooks',
          ['processors/git-sync-webhook.worker'],
        );
        providers.push(GitSyncWebhookWorker);
      }
    }

    return this.cacheModule(cacheKey, {
      module: GitSyncWebhookModule,
      imports,
      controllers: isMainImport ? [GitSyncWebhooksController] : [],
      providers,
      exports: providers,
    });
  }
}
