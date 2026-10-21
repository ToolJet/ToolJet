import { Controller, Get, HttpCode, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
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

  /** Full log of a run, or of one migration in it (`?migration=<name>`). */
  @Get(':id/log')
  @InitFeature(FEATURE_KEY.MIGRATION_RUNS)
  async log(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query('migration') migration?: string
  ): Promise<{ log: string }> {
    return { log: await this.migrationRunsService.log(id, migration || undefined) };
  }

  /** Retries a failed run. */
  @Post('run')
  @HttpCode(201)
  @InitFeature(FEATURE_KEY.MIGRATION_RUN)
  async run(@User() user: UserEntity): Promise<{ ok: true }> {
    await this.migrationRunsService.run(user.email);
    return { ok: true };
  }
}
