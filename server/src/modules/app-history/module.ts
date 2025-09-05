import { Module } from '@nestjs/common';
import { AppHistoryController } from './controller';
import { AppHistoryService } from './service';

@Module({
  controllers: [AppHistoryController],
  providers: [AppHistoryService],
  exports: [AppHistoryService],
})
export class AppHistoryModule {}
