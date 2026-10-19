import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { InitModule } from './decorators/init-module';
import { MODULES } from './constants/modules';
import { InitFeature } from './decorators/init-feature.decorator';
import { FEATURE_KEY } from './constants';
import { FeatureAbilityGuard } from './ability/guard';
import { AppService } from './service';
import { MigrationRunsService, MigrationStatus } from './migration-runs/service';

@InitModule(MODULES.ROOT)
@Controller()
@UseGuards(FeatureAbilityGuard)
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly migrationRunsService: MigrationRunsService
  ) {}

  @Get(['/health', '/api/health'])
  @InitFeature(FEATURE_KEY.HEALTH)
  async healthCheck(@Query('verbose') verbose?: string) {
    return this.appService.getHealth(verbose === 'true');
  }

  // Public: the upgrade banner polls it for every user, including public released apps.
  @Get('migration-status')
  @InitFeature(FEATURE_KEY.MIGRATION_STATUS)
  migrationStatus(): Promise<MigrationStatus> {
    return this.migrationRunsService.status();
  }

  @Get('/')
  @InitFeature(FEATURE_KEY.ROOT)
  async rootPage() {
    return { message: 'Instance seems healthy but this is probably not the right URL to access.' };
  }
}
