import { DynamicModule } from '@nestjs/common';
import { SessionModule } from '@modules/session/module';
import { SubModule } from '@modules/app/sub-module';

export class EventsModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const cacheKey = this.buildCacheKey(configs);
    const cached = this.getCachedModule(cacheKey);
    if (cached) return cached;

    const providers = [];

    // WebSocket gateways are runtime endpoints — nothing injects them, and each opens Redis
    // subscribers in onModuleInit. They serve no purpose in migration/get-context mode, so skip
    // them there to keep the migration context free of pub/sub connections.
    if (!configs?.IS_GET_CONTEXT) {
      const { EventsGateway, YjsGateway, NotificationsGateway } = await this.getProviders(configs, 'events', [
        'events.gateway',
        'yjs.gateway',
        'notifications.gateway',
      ]);

      providers.unshift(YjsGateway);
      providers.unshift(NotificationsGateway);
      if (process.env.COMMENT_FEATURE_ENABLE !== 'false') {
        providers.unshift(EventsGateway);
      }
    }

    return this.cacheModule(cacheKey, {
      module: EventsModule,
      imports: [await SessionModule.register(configs)],
      providers,
    });
  }
}
