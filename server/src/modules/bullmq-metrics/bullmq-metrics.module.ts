import { Module } from '@nestjs/common';
import { BullMqMetricsService } from './bullmq-metrics.service';

@Module({
  providers: [BullMqMetricsService],
})
export class BullMqMetricsModule {}
