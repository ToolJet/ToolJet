import type { ObservableResult } from '@opentelemetry/api';
import { ATTR, METRIC } from '@otel/semconv';

type QueryCacheMetrics = typeof import('@otel/query-cache-metrics');

/** @group platform */
describe('query cache metrics', () => {
  const add = jest.fn();
  const callbacks = new Map<string, (result: ObservableResult) => void>();

  // Instruments live in module state, so each test loads a fresh copy of the module. The isolated
  // registry has its own @opentelemetry/api, so the meter is stubbed on that copy.
  const load = (): QueryCacheMetrics => {
    let loaded: QueryCacheMetrics;
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const api: typeof import('@opentelemetry/api') = require('@opentelemetry/api');
      jest.spyOn(api.metrics, 'getMeter').mockReturnValue({
        createCounter: (name: string) => ({ add: (...args: unknown[]) => add(name, ...args) }),
        createObservableGauge: (name: string) => ({
          addCallback: (callback: (result: ObservableResult) => void) => callbacks.set(name, callback),
        }),
      } as unknown as ReturnType<typeof api.metrics.getMeter>);
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      loaded = require('@otel/query-cache-metrics');
    });
    return loaded;
  };
  const observe = (name: string) => {
    const observed: number[] = [];
    callbacks.get(name)?.({ observe: (value: number) => observed.push(value) } as unknown as ObservableResult);
    return observed;
  };

  beforeEach(() => callbacks.clear());

  afterEach(() => {
    jest.restoreAllMocks();
    add.mockReset();
  });

  it('records nothing until OpenTelemetry initializes the instruments', () => {
    const cache = load();
    cache.recordQueryCacheWrite('stored', 'org-1', 100);
    expect(cache.isQueryCacheMetricsEnabled()).toBe(false);
    expect(add).not.toHaveBeenCalled();
  });

  it('counts every write by result, without a workspace label', () => {
    const cache = load();
    cache.initializeQueryCacheMetrics();
    cache.recordQueryCacheWrite('over_limit', 'org-1');
    expect(add).toHaveBeenCalledTimes(1);
    expect(add).toHaveBeenCalledWith(METRIC.QUERY_CACHE_WRITES, 1, { [ATTR.QUERY_CACHE_WRITE_RESULT]: 'over_limit' });
  });

  it('adds stored bytes to the workspace counter only for a stored write', () => {
    const cache = load();
    cache.initializeQueryCacheMetrics();
    cache.recordQueryCacheWrite('stored', 'org-1', 4096);
    cache.recordQueryCacheWrite('confirm_refused', 'org-1', 4096);
    expect(add).toHaveBeenCalledWith(METRIC.QUERY_CACHE_BYTES_STORED, 4096, { [ATTR.ORGANIZATION_ID]: 'org-1' });
    expect(add.mock.calls.filter(([name]) => name === METRIC.QUERY_CACHE_BYTES_STORED)).toHaveLength(1);
  });

  it('reports the latest polled usage and limit, and nothing before the first poll', () => {
    const cache = load();
    cache.initializeQueryCacheMetrics();
    expect(observe(METRIC.QUERY_CACHE_MEMORY_USED)).toEqual([]);

    cache.setQueryCacheUsage({ usedBytes: 2048, limitBytes: 134217728 });
    expect(observe(METRIC.QUERY_CACHE_MEMORY_USED)).toEqual([2048]);
    expect(observe(METRIC.QUERY_CACHE_MEMORY_LIMIT)).toEqual([134217728]);
  });
});
