import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { ObservabilityService } from './service';

@Controller('observability')
@UseGuards(JwtAuthGuard)
export class ObservabilityController {
  constructor(private readonly observabilityService: ObservabilityService) {}

  @Get('metrics')
  getMetrics(
    @Query()
    query: {
      appName?: string;
      environment?: string;
      mode?: string;
      from?: string;
      to?: string;
      bucketSize?: string;
    },
  ) {
    return this.observabilityService.getMetrics(query);
  }
}
