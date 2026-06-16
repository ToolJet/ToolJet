/**
 * Unit tests for FrontendMetricsService
 *
 * Note: ts-jest does NOT hoist jest.mock() the way babel-jest does. Using
 * jest.spyOn on the module namespace object works because TypeScript's CommonJS
 * output references `module.exportedFn(...)`, not a destructured local copy.
 *
 * Run: cd server && npx jest test/modules/frontend-metrics
 */

import { Test, TestingModule } from '@nestjs/testing';
import { FrontendMetricsService } from '@modules/frontend-metrics/service';
import { IngestFrontendMetricsDto } from '@modules/frontend-metrics/dto/ingest.dto';
import * as otelFrontendMetrics from '@otel/frontend-metrics';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeDto(overrides: Partial<IngestFrontendMetricsDto> = {}): IngestFrontendMetricsDto {
  return {
    collected_at: new Date().toISOString(),
    workspace_id: 'ws-client-supplied',
    events: [
      {
        type: 'page_view',
        ts: Date.now(),
        attrs: { page: 'dashboard' },
      },
    ],
    ...overrides,
  } as IngestFrontendMetricsDto;
}

const mockContext = { userId: 'user-from-jwt', organizationId: 'org-from-jwt' };

// ── Setup ─────────────────────────────────────────────────────────────────────

describe('FrontendMetricsService', () => {
  let service: FrontendMetricsService;
  let recordBatchSpy: jest.SpyInstance;

  beforeEach(async () => {
    // Spy on the module namespace object — TypeScript's CommonJS output uses
    // `require('@otel/frontend-metrics').recordFrontendMetricsBatch(...)` so
    // spying on the namespace is reliable even without jest.mock() hoisting.
    recordBatchSpy = jest
      .spyOn(otelFrontendMetrics, 'recordFrontendMetricsBatch')
      .mockImplementation(() => undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [FrontendMetricsService],
    }).compile();

    service = module.get<FrontendMetricsService>(FrontendMetricsService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ── Empty / missing events ────────────────────────────────────────────────

  describe('ingest() — empty batch', () => {
    it('returns early without calling recordFrontendMetricsBatch when events is empty', async () => {
      await service.ingest(makeDto({ events: [] }), mockContext);
      expect(recordBatchSpy).not.toHaveBeenCalled();
    });

    it('returns early without calling recordFrontendMetricsBatch when events is undefined', async () => {
      const dto = makeDto();
      (dto as any).events = undefined;
      await service.ingest(dto, mockContext);
      expect(recordBatchSpy).not.toHaveBeenCalled();
    });
  });

  // ── Context injection — server wins over client ───────────────────────────

  describe('ingest() — server-side context injection', () => {
    it('passes JWT-extracted userId and organizationId to recordFrontendMetricsBatch', async () => {
      await service.ingest(makeDto(), mockContext);
      expect(recordBatchSpy).toHaveBeenCalledWith(
        expect.anything(),
        { userId: 'user-from-jwt', organizationId: 'org-from-jwt' }
      );
    });

    it('preserves the client-supplied workspace_id in the batch (OTEL uses context.organizationId to override)', async () => {
      await service.ingest(makeDto({ workspace_id: 'ws-from-client' }), mockContext);
      const [batch] = recordBatchSpy.mock.calls[0];
      expect(batch.workspace_id).toBe('ws-from-client');
    });

    it('uses fallback collected_at when the dto field is absent', async () => {
      const dto = makeDto();
      (dto as any).collected_at = undefined;
      await service.ingest(dto, mockContext);
      const [batch] = recordBatchSpy.mock.calls[0];
      expect(new Date(batch.collected_at).toString()).not.toBe('Invalid Date');
    });
  });

  // ── Attribute sanitization ────────────────────────────────────────────────

  describe('sanitizeAttrs() — via ingest()', () => {
    it('truncates string attr values exceeding 200 characters', async () => {
      const dto = makeDto({
        events: [{
          type: 'page_view',
          ts: Date.now(),
          attrs: { page: 'a'.repeat(300) },
        }],
      });
      await service.ingest(dto, mockContext);
      const [batch] = recordBatchSpy.mock.calls[0];
      expect(batch.events[0].attrs.page).toHaveLength(200);
    });

    it('passes through non-string attr values (numbers, booleans) unchanged', async () => {
      const dto = makeDto({
        events: [{
          type: 'query_exec',
          ts: Date.now(),
          attrs: { retries: 3, cached: false, duration: 1234.5 },
        }],
      });
      await service.ingest(dto, mockContext);
      const [batch] = recordBatchSpy.mock.calls[0];
      expect(batch.events[0].attrs.retries).toBe(3);
      expect(batch.events[0].attrs.cached).toBe(false);
      expect(batch.events[0].attrs.duration).toBe(1234.5);
    });

    it('caps attributes at 20 keys per event, dropping excess', async () => {
      const tooManyAttrs: Record<string, string> = {};
      for (let i = 0; i < 25; i++) {
        tooManyAttrs[`key_${i}`] = `value_${i}`;
      }
      const dto = makeDto({
        events: [{ type: 'page_view', ts: Date.now(), attrs: tooManyAttrs }],
      });
      await service.ingest(dto, mockContext);
      const [batch] = recordBatchSpy.mock.calls[0];
      expect(Object.keys(batch.events[0].attrs)).toHaveLength(20);
    });

    it('returns empty object when attrs is null/undefined', async () => {
      const dto = makeDto({
        events: [{ type: 'page_view', ts: Date.now(), attrs: null as any }],
      });
      await service.ingest(dto, mockContext);
      const [batch] = recordBatchSpy.mock.calls[0];
      expect(batch.events[0].attrs).toEqual({});
    });
  });

  // ── Batch size hard cap ───────────────────────────────────────────────────

  describe('ingest() — batch size cap', () => {
    it('processes at most 200 events even if more are provided', async () => {
      const events = Array.from({ length: 250 }, (_, i) => ({
        type: 'page_view' as const,
        ts: Date.now(),
        attrs: { page: `page_${i}` },
      }));
      await service.ingest(makeDto({ events }), mockContext);
      const [batch] = recordBatchSpy.mock.calls[0];
      expect(batch.events).toHaveLength(200);
    });
  });

  // ── Normal event types ────────────────────────────────────────────────────

  describe('ingest() — all valid event types forwarded to OTEL', () => {
    const eventTypes = [
      'page_view', 'page_load', 'app_open', 'app_load',
      'query_exec', 'query_error', 'widget_render', 'widget_error', 'js_error',
    ] as const;

    it.each(eventTypes)('forwards "%s" events to recordFrontendMetricsBatch', async (type) => {
      const dto = makeDto({
        events: [{ type, ts: Date.now(), attrs: {} }],
      });
      await service.ingest(dto, mockContext);
      expect(recordBatchSpy).toHaveBeenCalledTimes(1);
      const [batch] = recordBatchSpy.mock.calls[0];
      expect(batch.events[0].type).toBe(type);
    });
  });
});
