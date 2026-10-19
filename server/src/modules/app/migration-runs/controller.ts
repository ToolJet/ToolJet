import { Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { User } from '@modules/app/decorators/user.decorator';
import { User as UserEntity } from '@entities/user.entity';
import { InitModule } from '../decorators/init-module';
import { InitFeature } from '../decorators/init-feature.decorator';
import { MODULES } from '../constants/modules';
import { FEATURE_KEY } from '../constants';
import { FeatureAbilityGuard } from '../ability/guard';
import { MigrationRun, MigrationRunsService } from './service';

@InitModule(MODULES.ROOT)
@Controller('migration-runs')
@UseGuards(JwtAuthGuard, FeatureAbilityGuard)
export class MigrationRunsController {
  constructor(private readonly migrationRunsService: MigrationRunsService) {}

  @Get()
  @InitFeature(FEATURE_KEY.MIGRATION_RUNS)
  async list(): Promise<{ runs: MigrationRun[] }> {
    return { runs: await this.migrationRunsService.runs() };
  }

  @Post('retry')
  @HttpCode(201)
  @InitFeature(FEATURE_KEY.MIGRATION_RETRY)
  async retry(@User() user: UserEntity): Promise<{ ok: true }> {
    await this.migrationRunsService.retry(user.email);
    return { ok: true };
  }
}
