import { Injectable } from '@nestjs/common';
import { IngestFrontendMetricsDto } from './dto/ingest.dto';
import { recordFrontendMetricsBatch } from '@otel/frontend-metrics';

const MAX_EVENTS_PER_BATCH = 200;
const MAX_ATTR_VALUE_LENGTH = 200;

// Bounded keyspace — prevents unbounded OTEL cardinality from arbitrary client keys.
const ALLOWED_ATTR_KEYS = new Set([
  'page', 'vital', 'app_id', 'mode',
  'query_id', 'status', 'error_type',
  'widget_type', 'error_message', 'component_stack',
]);
// Server injects these — strip from client payload so clients cannot pre-empt them.
const RESERVED_ATTR_KEYS = new Set(['workspace.id', 'user.id']);

@Injectable()
export class FrontendMetricsService {
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
        events,
      },
      context
    );
  }

  private sanitizeAttrs(attrs: unknown): Record<string, string | number | boolean> {
    if (!attrs || typeof attrs !== 'object' || Array.isArray(attrs)) return {};
    const result: Record<string, string | number | boolean> = {};
    for (const key of Object.keys(attrs as object)) {
      if (RESERVED_ATTR_KEYS.has(key)) continue;
      if (!ALLOWED_ATTR_KEYS.has(key)) continue;
      const val = (attrs as Record<string, unknown>)[key];
      if (typeof val === 'boolean' || typeof val === 'number') {
        result[key] = val;
      } else {
        result[key] = String(val ?? '').slice(0, MAX_ATTR_VALUE_LENGTH);
      }
    }
    return result;
  }
}
