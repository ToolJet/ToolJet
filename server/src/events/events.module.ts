import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { YjsGateway } from './yjs.gateway';
import { AuthModule } from 'src/modules/auth/auth.module';

const providers = [];

providers.unshift(YjsGateway);
if (process.env.COMMENT_FEATURE_ENABLE !== 'false') {
  providers.unshift(EventsGateway);
}

@Module({
  imports: [AuthModule],
  providers,
})
export class EventsModule {}
