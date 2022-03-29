import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { YjsGateway } from './yjs.module';
import { AuthModule } from 'src/modules/auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [YjsGateway, EventsGateway],
})
export class EventsModule {}
