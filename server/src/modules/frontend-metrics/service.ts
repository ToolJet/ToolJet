import { Injectable } from '@nestjs/common';
import { SeverityNumber } from '@opentelemetry/api-logs';
import { IngestFrontendMetricsDto, FrontendMetricEventDto } from './dto/ingest.dto';
import { recordFrontendMetricsBatch } from '@otel/frontend-metrics';
import { getFrontendErrorLogger } from '@otel/logs';

const MAX_EVENTS_PER_BATCH = 200;
const MAX_ATTR_VALUE_LENGTH = 200;

// Bounded keyspace — prevents unbounded OTEL cardinality from arbitrary client keys.
const ALLOWED_ATTR_KEYS = new Set(['app.name', 'app.context', 'widget.type', 'vital.name']);
// Server injects these — strip from client payload so clients cannot pre-empt them.
const RESERVED_ATTR_KEYS = new Set(['organization.id', 'user.id']);

// Client dedup doesn't protect against N clients or attacker-chosen fingerprints;
// cap verbose log emits per org. Metrics keep counting when capped.
const LOG_EMITS_PER_ORG_PER_MIN = 100;
const orgLogBuckets = new Map<string, { tokens: number; ts: number }>();

function takeOrgLogToken(orgId: string): boolean {
  const now = Date.now();
  const bucket = orgLogBuckets.get(orgId) ?? { tokens: LOG_EMITS_PER_ORG_PER_MIN, ts: now };
  const refill = ((now - bucket.ts) / 60_000) * LOG_EMITS_PER_ORG_PER_MIN;
  bucket.tokens = Math.min(LOG_EMITS_PER_ORG_PER_MIN, bucket.tokens + refill);
  bucket.ts = now;
  const allowed = bucket.tokens >= 1;
  if (allowed) bucket.tokens -= 1;
  orgLogBuckets.set(orgId, bucket);
  return allowed;
}

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

    this.emitErrorLogs(events, context);
  }

  private emitErrorLogs(
    events: (Pick<FrontendMetricEventDto, 'type' | 'count' | 'detail'> & {
      attrs: Record<string, string | number | boolean>;
    })[],
    context: { userId: string; organizationId: string }
  ): void {
    const logger = getFrontendErrorLogger();
    if (!logger) return;

    for (const ev of events) {
      if ((ev.type !== 'js_error' && ev.type !== 'widget_error') || !ev.detail) continue;
      if (!takeOrgLogToken(context.organizationId)) return;

      logger.emit({
        severityNumber: SeverityNumber.WARN,
        severityText: 'WARN',
        body: ev.detail.value,
        attributes: {
          'event.type': ev.type,
          'app.context': ev.attrs['app.context'],
          'app.name': ev.attrs['app.name'],
          'widget.type': ev.attrs['widget.type'],
          'organization.id': context.organizationId,
          'user.id': context.userId,
          'error.fingerprint': `${ev.type}:${ev.detail.value}`.slice(0, 80),
          'exception.type': ev.detail.type,
          'exception.message': ev.detail.value,
          'exception.stacktrace': ev.detail.stacktrace ?? '',
          'event.count': ev.count ?? 1,
        },
      });
    }
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
