import { Injectable } from '@nestjs/common';
import { SeverityNumber } from '@opentelemetry/api-logs';
import { Organization } from '@entities/organization.entity';
import { dbTransactionWrap } from '@helpers/database.helper';
import { IngestFrontendMetricsDto, FrontendMetricEventDto } from './dto/ingest.dto';
import { recordFrontendMetricsBatch } from '@otel/frontend-metrics';
import { getFrontendErrorLogger } from '@otel/logs';
import { getWorkspaceNameLabel } from '@otel/org-plan-cache';

const MAX_EVENTS_PER_BATCH = 200;
const MAX_ATTR_VALUE_LENGTH = 200;

// Bounded keyspace — prevents unbounded OTEL cardinality from arbitrary client keys.
const ALLOWED_ATTR_KEYS = new Set([
  'app.name',
  'app.context',
  'widget.type',
  'vital.name',
  'app.environment',
  'app.version',
  'error.kind',
]);
// Server injects these — strip from client payload so clients cannot pre-empt them.
const RESERVED_ATTR_KEYS = new Set(['organization.id', 'user.id', 'organization.name', 'tooljet.version']);

// organization.name changes rarely — cache id->name to avoid a DB hit per ingest.
const ORG_NAME_CACHE_TTL_MS = 5 * 60_000;
const orgNameCache = new Map<string, { name: string; ts: number }>();

async function getOrganizationName(organizationId: string): Promise<string> {
  const cached = orgNameCache.get(organizationId);
  if (cached && Date.now() - cached.ts < ORG_NAME_CACHE_TTL_MS) return cached.name;

  const name = await dbTransactionWrap(async (manager) => {
    const organization = await manager.findOne(Organization, { where: { id: organizationId } });
    return organization?.name ?? 'unknown';
  });
  orgNameCache.set(organizationId, { name, ts: Date.now() });
  return name;
}

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
    const organizationName = await getOrganizationName(context.organizationId);
    const injectedAttrs = {
      'organization.name': getWorkspaceNameLabel(context.organizationId, organizationName),
      'tooljet.version': globalThis.TOOLJET_VERSION || 'unknown',
    };

    const events = dto.events.slice(0, MAX_EVENTS_PER_BATCH).map((ev) => ({
      ...ev,
      attrs: { ...this.sanitizeAttrs(ev.attrs), ...injectedAttrs },
    }));

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
          'event.type': ev.type,
          'app.context': ev.attrs['app.context'],
          'app.name': ev.attrs['app.name'],
          'app.environment': ev.attrs['app.environment'],
          'app.version': ev.attrs['app.version'],
          'error.kind': ev.attrs['error.kind'],
          'widget.type': ev.attrs['widget.type'],
          'organization.id': context.organizationId,
          'organization.name': organizationName,
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
