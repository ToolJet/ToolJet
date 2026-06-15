import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { User, UserEntity } from '@modules/app/decorators/user.decorator';
import { FrontendMetricsService } from './service';
import { IngestFrontendMetricsDto } from './dto/ingest.dto';

/**
 * Receives frontend telemetry batches from the React SPA and streams
 * them to the OTEL metric pipeline (Track 1 of feat/app-based-metricsv2).
 *
 * Endpoint: POST /api/otel/frontend-metrics
 *
 * The frontend uses navigator.sendBeacon (on page unload) or a regular fetch
 * on a periodic flush interval. JWT auth is required so that server-validated
 * userId/organizationId are attached to every metric label — the client cannot
 * forge these.
 *
 * Always returns 204 No Content so sendBeacon callers don't need to read the body.
 */
@Controller('otel')
export class FrontendMetricsController {
  constructor(private readonly frontendMetricsService: FrontendMetricsService) {}

  @Post('frontend-metrics')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async ingest(@Body() dto: IngestFrontendMetricsDto, @User() user: UserEntity): Promise<void> {
    await this.frontendMetricsService.ingest(dto, {
      userId: user.id,
      organizationId: user.organizationId,
    });
  }
}
