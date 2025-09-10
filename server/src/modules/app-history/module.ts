import { Module } from '@nestjs/common';
import { AppHistoryService } from './service';
import { AppHistoryController } from './controller';

@Module({
  providers: [AppHistoryService],
  controllers: [AppHistoryController],
  exports: [AppHistoryService],
})
export class AppHistoryModule {}
