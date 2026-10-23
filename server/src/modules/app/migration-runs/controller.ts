import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { InitModule } from '../decorators/init-module';
import { InitFeature } from '../decorators/init-feature.decorator';
import { MODULES } from '../constants/modules';
import { FEATURE_KEY } from '../constants';
import { FeatureAbilityGuard } from '../ability/guard';
import { MigrationRunsService } from './service';
import { MigrationRunLogQueryDto, MigrationRunLogResponseDto, MigrationRunsResponseDto } from './dto';

@InitModule(MODULES.ROOT)
@Controller('migration-runs')
@UseGuards(JwtAuthGuard, FeatureAbilityGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class MigrationRunsController {
  constructor(private readonly migrationRunsService: MigrationRunsService) {}

  @Get()
  @InitFeature(FEATURE_KEY.MIGRATION_RUNS)
  async list(): Promise<MigrationRunsResponseDto> {
    return plainToInstance(MigrationRunsResponseDto, { runs: await this.migrationRunsService.runs() });
  }

  /** Full log of a run, or of one migration in it (`?migration=<name>`). */
  @Get(':id/log')
  @InitFeature(FEATURE_KEY.MIGRATION_RUNS)
  async log(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query() { migration }: MigrationRunLogQueryDto
  ): Promise<MigrationRunLogResponseDto> {
    const log = await this.migrationRunsService.log(id, migration || undefined);
    return plainToInstance(MigrationRunLogResponseDto, { log });
  }
}
