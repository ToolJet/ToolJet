import { Module } from '@nestjs/common';
import { WorkerService } from '@services/worker.service';

@Module({
  imports: [],
  providers: [WorkerService],
  controllers: [],
  exports: [],
})
export class WorkerModule {}
