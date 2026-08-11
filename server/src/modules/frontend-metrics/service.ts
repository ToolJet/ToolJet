import { Injectable } from '@nestjs/common';
import { SeverityNumber } from '@opentelemetry/api-logs';
import { IngestFrontendMetricsDto, FrontendMetricEventDto } from './dto/ingest.dto';
import { recordFrontendMetricsBatch } from '@otel/frontend-metrics';
import { getFrontendErrorLogger } from '@otel/logs';
import { getWorkspaceNameLabel } from '@otel/org-plan-cache';
import { getOrganizationNameCached } from '@otel/org-name-cache';
import { ATTR, isAcceptedBeaconAttr } from '@otel/semconv';

const MAX_EVENTS_PER_BATCH = 200;
const MAX_ATTR_VALUE_LENGTH = 200;

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
  async ingest(dto: IngestFrontendMetricsDto, context: { userId: string; organizationId: string }): Promise<void> {
    if (!dto.events || dto.events.length === 0) return;

    // Real name for logs, bucketed name for metric labels — the two must not be conflated.
    const organizationName = await getOrganizationNameCached(context.organizationId);
    const tooljetVersion = globalThis.TOOLJET_VERSION || 'unknown';

    const events = dto.events.slice(0, MAX_EVENTS_PER_BATCH).map((ev) => {
      const attrs = this.sanitizeAttrs(ev.attrs);
      // Platform-context events are platform health, never bucketed — mirrors organization.id gating
      const isPlatformContext = attrs['app.context'] === 'platform';
      return {
        ...ev,
        attrs: {
          ...attrs,
          'organization.name': isPlatformContext
            ? organizationName
            : getWorkspaceNameLabel(context.organizationId, organizationName),
          'tooljet.version': tooljetVersion,
        },
      };
    });

    recordFrontendMetricsBatch(
      {
        collected_at: dto.collected_at || new Date().toISOString(),
        events,
      },
      context
    );

    this.emitErrorLogs(events, context, organizationName);
  }

  private emitErrorLogs(
    events: (Pick<FrontendMetricEventDto, 'type' | 'count' | 'detail'> & {
      attrs: Record<string, string | number | boolean>;
    })[],
    context: { userId: string; organizationId: string },
    // Logs are structured metadata, not label dimensions — diagnosis needs the real workspace
    organizationName: string
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
          [ATTR.EVENT_TYPE]: ev.type,
          [ATTR.APP_CONTEXT]: ev.attrs['app.context'],
          [ATTR.APP_NAME]: ev.attrs['app.name'],
          [ATTR.ENVIRONMENT_NAME]: ev.attrs['app.environment'],
          [ATTR.APP_VERSION]: ev.attrs['app.version'],
          [ATTR.ERROR_TYPE]: ev.attrs['error.kind'],
          [ATTR.WIDGET_TYPE]: ev.attrs['widget.type'],
          [ATTR.ORGANIZATION_ID]: context.organizationId,
          [ATTR.ORGANIZATION_NAME]: organizationName,
          [ATTR.USER_ID]: context.userId,
          [ATTR.ERROR_FINGERPRINT]: `${ev.type}:${ev.detail.value}`.slice(0, 80),
          // exception.* stay log-record-only — the unbounded detail metrics can't carry
          [ATTR.EXCEPTION_TYPE]: ev.detail.type,
          [ATTR.EXCEPTION_MESSAGE]: ev.detail.value,
          [ATTR.EXCEPTION_STACKTRACE]: ev.detail.stacktrace ?? '',
          [ATTR.EVENT_COUNT]: ev.count ?? 1,
        },
      });
    }
  }

  private sanitizeAttrs(attrs: unknown): Record<string, string | number | boolean> {
    if (!attrs || typeof attrs !== 'object' || Array.isArray(attrs)) return {};
    const result: Record<string, string | number | boolean> = {};
    for (const key of Object.keys(attrs as object)) {
      // Bounded keyspace — an arbitrary client key is unbounded OTEL cardinality.
      // Server-injected keys are absent from the map, so a client cannot pre-empt them.
      if (!isAcceptedBeaconAttr(key)) continue;
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
