import { Module } from '@nestjs/common';
import { MetricsService } from './service';
import { MetricsController } from './controller';

@Module({
  providers: [MetricsService],
  controllers: [MetricsController],
})
export class MetricsModule {}
