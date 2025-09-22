import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { Controller, Get, Req, Res } from '@nestjs/common';
import { FEATURE_KEY } from './constants';
import { InitModule } from '@modules/app/decorators/init-module';
import { MODULES } from '@modules/app/constants/modules';
import { Response, Request } from 'express';
import { MetricsService } from './service';

@Controller()
@InitModule(MODULES.METRICS)
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @InitFeature(FEATURE_KEY.GET)
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
