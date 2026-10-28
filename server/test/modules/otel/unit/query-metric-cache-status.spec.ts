import { metrics } from '@opentelemetry/api';
import { initializeAuditLogMetrics, recordQueryMetric } from '@otel/audit-metrics';
import { ATTR } from '@otel/semconv';

/** @group platform */
describe('query metric cache status label', () => {
  const add = jest.fn();
  const record = jest.fn();

  beforeAll(() => {
    jest.spyOn(metrics, 'getMeter').mockReturnValue({
      createCounter: () => ({ add }),
      createHistogram: () => ({ record }),
    } as unknown as ReturnType<typeof metrics.getMeter>);
    initializeAuditLogMetrics();
  });

  afterEach(() => jest.clearAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const payload = {
    userId: 'user-1',
    organizationId: 'org-1',
    appId: 'app-1',
    queryId: 'query-1',
    dataSourceType: 'restapi',
    appMode: 'view',
    environment: 'development',
    status: 'success',
    duration: 12,
  };

  it('labels the execution and its duration with the cache status when given', () => {
    recordQueryMetric({ ...payload, cacheStatus: 'hit' });
    expect(add).toHaveBeenCalledWith(1, expect.objectContaining({ [ATTR.QUERY_CACHE_STATUS]: 'hit' }));
    expect(record).toHaveBeenCalledWith(0.012, expect.objectContaining({ [ATTR.QUERY_CACHE_STATUS]: 'hit' }));
  });

  it('leaves the label off when the cache is not in play', () => {
    recordQueryMetric(payload);
    expect(add.mock.calls[0][1]).not.toHaveProperty(ATTR.QUERY_CACHE_STATUS);
  });
});
