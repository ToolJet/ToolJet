import { Injectable } from '@nestjs/common';
import { getFilteredEvents, getFilterValues, getRecentFailures, QueryEvent } from '@otel/metrics-store';

@Injectable()
export class ObservabilityService {
  getMetrics(query: {
    appName?: string;
    environment?: string;
    mode?: string;
    from?: string;
    to?: string;
    bucketSize?: string;
  }) {
    const bucketSizeMs = parseInt(query.bucketSize || '30', 10) * 1000;
    const to = parseInt(query.to || String(Date.now()), 10);
    const from = parseInt(query.from || String(to - 5 * 60 * 1000), 10);

    const events = getFilteredEvents({
      appName: query.appName,
      environment: query.environment,
      mode: query.mode,
      from,
      to,
    });

    return {
      overview: this.computeOverview(events),
      timeSeries: this.computeTimeSeries(events, from, to, bucketSizeMs),
      topQueries: this.computeTopQueries(events),
      recentFailures: this.computeRecentFailures(events),
      filterValues: getFilterValues(),
    };
  }

  private computeOverview(events: QueryEvent[]) {
    const total = events.length;
    const failures = events.filter((e) => e.status === 'failure').length;
    const successes = total - failures;
    const successRate = total > 0 ? (successes / total) * 100 : null;
    const durations = events.filter((e) => e.duration != null).map((e) => e.duration as number);
    const p95Latency = this.percentile(durations, 95);
    const uniqueQueryNames = new Set(events.map((e) => e.queryName)).size;

    return {
      totalQueryExecutions: total,
      successRate: successRate != null ? Math.round(successRate * 10) / 10 : null,
      p95Latency: durations.length > 0 ? Math.round(p95Latency * 10) / 10 : null,
      queryFailures: failures,
      totalQueriesInApp: uniqueQueryNames,
    };
  }

  private computeTimeSeries(events: QueryEvent[], from: number, to: number, bucketSizeMs: number) {
    const numBuckets = Math.ceil((to - from) / bucketSizeMs);
    const buckets: QueryEvent[][] = Array.from({ length: numBuckets }, () => []);

    for (const event of events) {
      const bucketIndex = Math.floor((event.timestamp - from) / bucketSizeMs);
      if (bucketIndex >= 0 && bucketIndex < numBuckets) {
        buckets[bucketIndex].push(event);
      }
    }

    const bucketSizeSeconds = bucketSizeMs / 1000;

    // executionRateByQuery: queryName -> [{time, rate}]
    const executionRateByQuery: Record<string, { time: number; rate: number }[]> = {};
    // latencyByQuery: queryName -> [{time, p95}]
    const latencyByQuery: Record<string, { time: number; p95: number }[]> = {};
    // executionsByDatasourceType: dsType -> [{time, rate}]
    const executionsByDatasourceType: Record<string, { time: number; rate: number }[]> = {};
    // successVsFailure: [{time, successRate, failureRate}]
    const successVsFailure: { time: number; successRate: number; failureRate: number }[] = [];

    for (let i = 0; i < numBuckets; i++) {
      const bucketTime = from + i * bucketSizeMs;
      const bucketEvents = buckets[i];

      // per-query execution rate and latency
      const byQuery = new Map<string, { count: number; durations: number[] }>();
      for (const event of bucketEvents) {
        if (!byQuery.has(event.queryName)) {
          byQuery.set(event.queryName, { count: 0, durations: [] });
        }
        const q = byQuery.get(event.queryName)!;
        q.count++;
        if (event.duration != null) q.durations.push(event.duration);
      }

      for (const [queryName, data] of byQuery.entries()) {
        if (!executionRateByQuery[queryName]) executionRateByQuery[queryName] = [];
        executionRateByQuery[queryName].push({
          time: bucketTime,
          rate: data.count / bucketSizeSeconds,
        });

        if (!latencyByQuery[queryName]) latencyByQuery[queryName] = [];
        latencyByQuery[queryName].push({
          time: bucketTime,
          p95: this.percentile(data.durations, 95),
        });
      }

      // per-datasource type execution rate
      const byDsType = new Map<string, number>();
      for (const event of bucketEvents) {
        byDsType.set(event.dataSourceType, (byDsType.get(event.dataSourceType) || 0) + 1);
      }
      for (const [dsType, count] of byDsType.entries()) {
        if (!executionsByDatasourceType[dsType]) executionsByDatasourceType[dsType] = [];
        executionsByDatasourceType[dsType].push({
          time: bucketTime,
          rate: count / bucketSizeSeconds,
        });
      }

      // success vs failure rate
      const total = bucketEvents.length;
      const failures = bucketEvents.filter((e) => e.status === 'failure').length;
      const successes = total - failures;
      successVsFailure.push({
        time: bucketTime,
        successRate: total > 0 ? successes / bucketSizeSeconds : 0,
        failureRate: total > 0 ? failures / bucketSizeSeconds : 0,
      });
    }

    return {
      executionRateByQuery,
      latencyByQuery,
      executionsByDatasourceType,
      successVsFailure,
    };
  }

  private computeTopQueries(events: QueryEvent[]) {
    // Group by queryName
    const byQuery = new Map<
      string,
      { count: number; durations: number[]; failures: number; lastError?: string; lastErrorDescription?: string; lastFailedAt?: number }
    >();

    const windowSeconds = events.length > 0
      ? (Math.max(...events.map((e) => e.timestamp)) - Math.min(...events.map((e) => e.timestamp)) + 1) / 1000
      : 1;

    for (const event of events) {
      if (!byQuery.has(event.queryName)) {
        byQuery.set(event.queryName, { count: 0, durations: [], failures: 0 });
      }
      const q = byQuery.get(event.queryName)!;
      q.count++;
      if (event.duration != null) q.durations.push(event.duration);
      if (event.status === 'failure') {
        q.failures++;
        // Keep the most recent failure details
        if (!q.lastFailedAt || event.timestamp > q.lastFailedAt) {
          q.lastFailedAt = event.timestamp;
          q.lastError = event.errorMessage;
          q.lastErrorDescription = event.errorDescription;
        }
      }
    }

    const entries = Array.from(byQuery.entries());

    // Top 10 most executed
    const mostExecuted = entries
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([queryName, data]) => ({
        queryName,
        count: data.count,
        execRate: data.count / windowSeconds,
      }));

    // Top 10 slowest (p95)
    const slowest = entries
      .filter(([, data]) => data.durations.length > 0)
      .sort((a, b) => this.percentile(b[1].durations, 95) - this.percentile(a[1].durations, 95))
      .slice(0, 10)
      .map(([queryName, data]) => ({
        queryName,
        p95Latency: this.percentile(data.durations, 95),
      }));

    // Top 10 failed
    const failed = entries
      .filter(([, data]) => data.failures > 0)
      .sort((a, b) => b[1].failures - a[1].failures)
      .slice(0, 10)
      .map(([queryName, data]) => ({
        queryName,
        count: data.failures,
        lastError: data.lastError || '',
        lastErrorDescription: data.lastErrorDescription || '',
        lastFailedAt: data.lastFailedAt,
      }));

    return { mostExecuted, slowest, failed };
  }

  private computeRecentFailures(events: QueryEvent[]) {
    return events
      .filter((e) => e.status === 'failure')
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 50)
      .map((e) => ({
        timestamp: e.timestamp,
        appName: e.appName,
        queryName: e.queryName,
        dataSourceType: e.dataSourceType,
        environment: e.environment,
        mode: e.mode,
        duration: e.duration,
        errorMessage: e.errorMessage || 'Unknown error',
        errorDescription: e.errorDescription || '',
      }));
  }

  private percentile(values: number[], p: number): number {
    if (!values.length) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const idx = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, idx)];
  }
}
