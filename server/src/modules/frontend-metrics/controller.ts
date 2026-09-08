import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { User, UserEntity } from '@modules/app/decorators/user.decorator';
import { InitModule } from '@modules/app/decorators/init-module';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { MODULES } from '@modules/app/constants/modules';
import { FrontendMetricsService } from './service';
import { IngestFrontendMetricsDto } from './dto/ingest.dto';
import { FeatureAbilityGuard } from './ability/guard';
import { UserScopedThrottlerGuard } from './throttler/user-scoped-throttler.guard';
import { FEATURE_KEY } from './constants';

@InitModule(MODULES.FRONTEND_METRICS)
@UseGuards(JwtAuthGuard, FeatureAbilityGuard, UserScopedThrottlerGuard)
@Controller('otel')
export class FrontendMetricsController {
  constructor(private readonly frontendMetricsService: FrontendMetricsService) {}

  @InitFeature(FEATURE_KEY.INGEST)
  @Post('frontend-metrics')
  @HttpCode(HttpStatus.NO_CONTENT)
  async ingest(@Body() dto: IngestFrontendMetricsDto, @User() user: UserEntity): Promise<void> {
    await this.frontendMetricsService.ingest(dto, {
      userId: user.id,
      organizationId: user.organizationId,
    });
  }
}
