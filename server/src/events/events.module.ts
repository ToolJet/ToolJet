import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { YjsGateway } from './yjs.gateway';
import { AuthModule } from 'src/modules/auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [EventsGateway, YjsGateway],
})
export class EventsModule {}
