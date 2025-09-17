import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { InitModule } from './decorators/init-module';
import { MODULES } from './constants/modules';
import { InitFeature } from './decorators/init-feature.decorator';
import { FEATURE_KEY } from './constants';
import { FeatureAbilityGuard } from './ability/guard';
import { MetricsService } from './services/metrics.service';
import { Response, Request } from 'express';

@InitModule(MODULES.ROOT)
@Controller()
@UseGuards(FeatureAbilityGuard)
export class AppController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get(['/health', '/api/health'])
  @InitFeature(FEATURE_KEY.HEALTH)
  async healthCheck() {
    return { works: 'yeah' };
  }

  @Get('/')
  @InitFeature(FEATURE_KEY.ROOT)
  async rootPage() {
    return { message: 'Instance seems healthy but this is probably not the right URL to access.' };
  }

  @InitFeature(FEATURE_KEY.METRICS)
  @Get('/metrics')
  async getMetrics(@Req() req: Request, @Res() res: Response) {
    const acceptHeader = req.headers['accept'] || '';

    if (acceptHeader?.includes('application/json')) {
      const metrics = await this.metricsService.getJsonMetrics();
      res.json(metrics);
    } else {
      const metrics = await this.metricsService.getPrometheusMetrics();
      res.setHeader('Content-Type', 'text/plain');
      res.send(metrics);
    }
  }
}
