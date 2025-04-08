import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { YjsGateway } from './yjs.gateway';
import { SessionModule } from '@modules/session/module';

const providers = [];

providers.unshift(YjsGateway);
if (process.env.COMMENT_FEATURE_ENABLE !== 'false') {
  providers.unshift(EventsGateway);
}

@Module({
  imports: [SessionModule],
  providers,
})
export class EventsModule {}
