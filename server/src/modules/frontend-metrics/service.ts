import { Injectable } from '@nestjs/common';
import { IngestFrontendMetricsDto } from './dto/ingest.dto';
import { recordFrontendMetricsBatch } from '@otel/frontend-metrics';

const MAX_EVENTS_PER_BATCH = 200;
const MAX_ATTRS_PER_EVENT = 20;
const MAX_ATTR_VALUE_LENGTH = 200;

@Injectable()
export class FrontendMetricsService {
  /**
   * Validate and forward a batch of frontend metric events to OTEL.
   *
   * Security notes:
   * - userId/organizationId come from the verified JWT, never from the payload.
   * - attrs keys are capped at MAX_ATTRS_PER_EVENT to bound cardinality.
   * - attr values are truncated to MAX_ATTR_VALUE_LENGTH.
   * - Batch size is hard-capped at MAX_EVENTS_PER_BATCH (also enforced by @ArrayMaxSize in DTO).
   */
  async ingest(
    dto: IngestFrontendMetricsDto,
    context: { userId: string; organizationId: string }
  ): Promise<void> {
    if (!dto.events || dto.events.length === 0) return;

    const events = dto.events.slice(0, MAX_EVENTS_PER_BATCH).map((ev) => ({
      ...ev,
      attrs: this.sanitizeAttrs(ev.attrs),
    }));

    recordFrontendMetricsBatch(
      {
        collected_at: dto.collected_at || new Date().toISOString(),
        workspace_id: dto.workspace_id,
        events,
      },
      context
    );
  }

  private sanitizeAttrs(attrs: Record<string, string | number | boolean>): Record<string, string | number | boolean> {
    if (!attrs || typeof attrs !== 'object') return {};
    const keys = Object.keys(attrs).slice(0, MAX_ATTRS_PER_EVENT);
    const result: Record<string, string | number | boolean> = {};
    for (const key of keys) {
      const val = attrs[key];
      result[key] =
        typeof val === 'string' ? val.slice(0, MAX_ATTR_VALUE_LENGTH) : val;
    }
    return result;
  }
}
