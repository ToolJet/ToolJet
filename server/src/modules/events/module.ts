import { DynamicModule } from '@nestjs/common';
import { SessionModule } from '@modules/session/module';
import { SubModule } from '@modules/app/sub-module';

export class EventsModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const cacheKey = this.buildCacheKey(configs);
    const cached = this.getCachedModule(cacheKey);
    if (cached) return cached;

    const providers = [];

    const { EventsGateway, YjsGateway } = await this.getProviders(configs, 'events', ['events.gateway', 'yjs.gateway']);

    providers.unshift(YjsGateway);
    if (process.env.COMMENT_FEATURE_ENABLE !== 'false') {
      providers.unshift(EventsGateway);
    }

    return this.cacheModule(cacheKey, {
      module: EventsModule,
      imports: [await SessionModule.register(configs)],
      providers,
    });
  }
}
