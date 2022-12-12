import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { YjsGateway } from './yjs.gateway';
import { AuthModule } from 'src/modules/auth/auth.module';

const providers = [];

if (process.env.COMMENT_FEATURE_ENABLE !== 'false') {
  providers.unshift(EventsGateway);
}

if (process.env.ENABLE_MULTIPLAYER_EDITING !== 'false') {
  providers.unshift(YjsGateway);
}

@Module({
  imports: [AuthModule],
  providers,
})
export class EventsModule {}
