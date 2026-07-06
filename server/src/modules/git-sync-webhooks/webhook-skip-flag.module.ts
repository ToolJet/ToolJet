import { DynamicModule, Module } from '@nestjs/common';
import { getImportPath } from '@modules/app/constants';

@Module({})
export class WebhookSkipFlagModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const importPath = await getImportPath(configs?.IS_GET_CONTEXT);

    // CE stub lives at src/modules/git-sync-webhooks/webhook-skip-flag.service.ts
    // EE real service lives at ee/git-sync-webhooks/webhook-skip-flag.service.ts (re-exports from services/)
    const { WebhookSkipFlagService } = await import(`${importPath}/git-sync-webhooks/webhook-skip-flag.service`);

    return {
      module: WebhookSkipFlagModule,
      providers: [WebhookSkipFlagService],
      exports: [WebhookSkipFlagService],
    };
  }
}
