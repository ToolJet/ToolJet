import { DynamicModule } from '@nestjs/common';
import { SessionModule } from '@modules/session/module';
import { getImportPath } from '@modules/app/constants';

export class EventsModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const providers = [];

    const importPath = await getImportPath(configs?.IS_GET_CONTEXT);
    const { EventsGateway } = await import(`${importPath}/events/events.gateway`);
    const { YjsGateway } = await import(`${importPath}/events/yjs.gateway`);

    providers.unshift(YjsGateway);
    if (process.env.COMMENT_FEATURE_ENABLE !== 'false') {
      providers.unshift(EventsGateway);
    }

    return {
      module: EventsModule,
      imports: [await SessionModule.register(configs)],
      providers,
    };
  }
}
