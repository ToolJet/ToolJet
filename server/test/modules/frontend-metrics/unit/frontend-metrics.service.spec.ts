/**
 * Unit tests for FrontendMetricsService
 *
 * Run: cd server && npx jest test/modules/frontend-metrics
 */

import { Test, TestingModule } from '@nestjs/testing';
import { FrontendMetricsService } from '@modules/frontend-metrics/service';
import { IngestFrontendMetricsDto } from '@modules/frontend-metrics/dto/ingest.dto';
import * as otelFrontendMetrics from '@otel/frontend-metrics';

function makeDto(overrides: Partial<IngestFrontendMetricsDto> = {}): IngestFrontendMetricsDto {
  return {
    collected_at: new Date().toISOString(),
    events: [
      { type: 'js_error', ts: Date.now(), attrs: { app_context: 'platform', error_message: 'boom' } },
    ],
    ...overrides,
  } as IngestFrontendMetricsDto;
}

const mockContext = { userId: 'user-from-jwt', organizationId: 'org-from-jwt' };

describe('FrontendMetricsService', () => {
  let service: FrontendMetricsService;
  let recordBatchSpy: jest.SpyInstance;

  beforeEach(async () => {
    recordBatchSpy = jest
      .spyOn(otelFrontendMetrics, 'recordFrontendMetricsBatch')
      .mockImplementation(() => undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [FrontendMetricsService],
    }).compile();

    service = module.get<FrontendMetricsService>(FrontendMetricsService);
  });

  afterEach(() => jest.restoreAllMocks());

  describe('ingest() — empty batch', () => {
    it('returns early when events is empty', async () => {
      await service.ingest(makeDto({ events: [] }), mockContext);
      expect(recordBatchSpy).not.toHaveBeenCalled();
    });

    it('returns early when events is undefined', async () => {
      const dto = makeDto();
      (dto as any).events = undefined;
      await service.ingest(dto, mockContext);
      expect(recordBatchSpy).not.toHaveBeenCalled();
    });
  });

  describe('ingest() — context injection', () => {
    it('passes JWT-extracted context to recordFrontendMetricsBatch', async () => {
      await service.ingest(makeDto(), mockContext);
      expect(recordBatchSpy).toHaveBeenCalledWith(
        expect.anything(),
        { userId: 'user-from-jwt', organizationId: 'org-from-jwt' }
      );
    });

    it('uses fallback collected_at when absent', async () => {
      const dto = makeDto();
      (dto as any).collected_at = undefined;
      await service.ingest(dto, mockContext);
      const [batch] = recordBatchSpy.mock.calls[0];
      expect(new Date(batch.collected_at).toString()).not.toBe('Invalid Date');
    });
  });

  describe('sanitizeAttrs()', () => {
    it('truncates string values exceeding 200 characters', async () => {
      const dto = makeDto({
        events: [{ type: 'js_error', ts: Date.now(), attrs: { error_message: 'a'.repeat(300) } }],
      });
      await service.ingest(dto, mockContext);
      const [batch] = recordBatchSpy.mock.calls[0];
      expect(batch.events[0].attrs.error_message).toHaveLength(200);
    });

    it('passes through number and boolean values unchanged', async () => {
      const dto = makeDto({
        events: [{ type: 'query_error', ts: Date.now(), attrs: { query_id: 42 as any, app_id: true as any } }],
      });
      await service.ingest(dto, mockContext);
      const [batch] = recordBatchSpy.mock.calls[0];
      expect(batch.events[0].attrs.query_id).toBe(42);
      expect(batch.events[0].attrs.app_id).toBe(true);
    });

    it('drops keys not in the allowlist', async () => {
      const dto = makeDto({
        events: [{ type: 'js_error', ts: Date.now(), attrs: { error_message: 'x', retries: 3, cached: false } as any }],
      });
      await service.ingest(dto, mockContext);
      const [batch] = recordBatchSpy.mock.calls[0];
      expect('retries' in batch.events[0].attrs).toBe(false);
      expect('cached' in batch.events[0].attrs).toBe(false);
    });

    it('strips reserved keys (workspace.id, user.id) from client attrs', async () => {
      const dto = makeDto({
        events: [{
          type: 'js_error', ts: Date.now(),
          attrs: { 'workspace.id': 'evil-tenant', 'user.id': 'evil-user' } as any,
        }],
      });
      await service.ingest(dto, mockContext);
      const [batch] = recordBatchSpy.mock.calls[0];
      expect('workspace.id' in batch.events[0].attrs).toBe(false);
      expect('user.id' in batch.events[0].attrs).toBe(false);
    });

    it('returns empty object for array attrs', async () => {
      const dto = makeDto({
        events: [{ type: 'js_error', ts: Date.now(), attrs: ['evil'] as any }],
      });
      await service.ingest(dto, mockContext);
      const [batch] = recordBatchSpy.mock.calls[0];
      expect(batch.events[0].attrs).toEqual({});
    });

    it('returns empty object for null attrs', async () => {
      const dto = makeDto({
        events: [{ type: 'js_error', ts: Date.now(), attrs: null as any }],
      });
      await service.ingest(dto, mockContext);
      const [batch] = recordBatchSpy.mock.calls[0];
      expect(batch.events[0].attrs).toEqual({});
    });
  });

  describe('ingest() — batch size cap', () => {
    it('caps at 200 events', async () => {
      const events = Array.from({ length: 250 }, () => ({
        type: 'js_error' as const,
        ts: Date.now(),
        attrs: { app_context: 'platform' },
      }));
      await service.ingest(makeDto({ events }), mockContext);
      const [batch] = recordBatchSpy.mock.calls[0];
      expect(batch.events).toHaveLength(200);
    });
  });

  describe('ingest() — all three error event types', () => {
    const errorTypes = ['js_error', 'widget_error', 'query_error'] as const;

    it.each(errorTypes)('forwards "%s" to recordFrontendMetricsBatch', async (type) => {
      await service.ingest(makeDto({ events: [{ type, ts: Date.now(), attrs: {} }] }), mockContext);
      expect(recordBatchSpy).toHaveBeenCalledTimes(1);
      const [batch] = recordBatchSpy.mock.calls[0];
      expect(batch.events[0].type).toBe(type);
    });
  });
});
