import { Controller, Get, UseGuards } from '@nestjs/common';
import { InitModule } from './decorators/init-module';
import { MODULES } from './constants/modules';
import { InitFeature } from './decorators/init-feature.decorator';
import { FEATURE_KEY } from './constants';
import { FeatureAbilityGuard } from './ability/guard';
import { AppService } from './service';

@InitModule(MODULES.ROOT)
@Controller()
@UseGuards(FeatureAbilityGuard)
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get(['/health', '/api/health'])
  @InitFeature(FEATURE_KEY.HEALTH)
  async healthCheck() {
    return this.appService.getHealth();
  }

  @Get('/')
  @InitFeature(FEATURE_KEY.ROOT)
  async rootPage() {
    return { message: 'Instance seems healthy but this is probably not the right URL to access.' };
  }
}
