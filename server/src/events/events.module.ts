import { Module } from '@nestjs/common';
import { YjsGateway } from './yjs.gateway';
import { AuthModule } from 'src/modules/auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [YjsGateway],
})
export class EventsModule {}
