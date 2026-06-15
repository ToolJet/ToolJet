import { Module } from '@nestjs/common';
import { FrontendMetricsController } from './controller';
import { FrontendMetricsService } from './service';

@Module({
  providers: [FrontendMetricsService],
  controllers: [FrontendMetricsController],
})
export class FrontendMetricsModule {}
