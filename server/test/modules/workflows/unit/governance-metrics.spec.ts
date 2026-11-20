import { metrics } from '@opentelemetry/api';
import {
  AggregationTemporality,
  InMemoryMetricExporter,
  MeterProvider,
  PeriodicExportingMetricReader,
} from '@opentelemetry/sdk-metrics';
import { workflowMetrics, WORKFLOW_METRIC } from '@modules/workflows/governance-metrics';
import { LocalPool } from '@modules/workflows/admission/local-pool';
import { startStepDeadline } from '@modules/workflows/run-budget/step-deadline';

const exporter = new InMemoryMetricExporter(AggregationTemporality.CUMULATIVE);
const reader = new PeriodicExportingMetricReader({ exporter, exportIntervalMillis: 60_000 });

/** Sums of each counter by its label set, as exported. */
const collected = async () => {
  await reader.forceFlush();
  const sums: Record<string, number> = {};
  for (const resourceMetrics of exporter.getMetrics()) {
    for (const scope of resourceMetrics.scopeMetrics) {
      for (const metric of scope.metrics) {
        for (const point of metric.dataPoints) {
          const labels = Object.values(point.attributes).join(',');
          sums[`${metric.descriptor.name}${labels ? `{${labels}}` : ''}`] = point.value as number;
        }
      }
    }
  }
  exporter.reset();
  return sums;
};

/**
 * Governance counters (Phase 5, D46): exported through OpenTelemetry with low-cardinality labels.
 *
 * @group workflows
 */
describe('Workflow governance metrics', () => {
  beforeAll(() => {
    metrics.setGlobalMeterProvider(new MeterProvider({ readers: [reader] }));
  });

  afterAll(async () => {
    await reader.shutdown();
    metrics.disable();
  });

  it('should count refusals by reason and budget breaches by limit', async () => {
    workflowMetrics.admissionRefused('quota');
    workflowMetrics.admissionRefused('quota');
    workflowMetrics.admissionRefused('rate_limit');
    workflowMetrics.budgetExceeded('maxNodes');

    const sums = await collected();

    expect(sums[`${WORKFLOW_METRIC.ADMISSION_REFUSED}{quota}`]).toBe(2);
    expect(sums[`${WORKFLOW_METRIC.ADMISSION_REFUSED}{rate_limit}`]).toBe(1);
    expect(sums[`${WORKFLOW_METRIC.BUDGET_EXCEEDED}{maxNodes}`]).toBe(1);
  });

  it('should count a stopped step and a pool wait where they happen', async () => {
    const deadline = startStepDeadline({ runRemainingMs: 0 });
    await new Promise((resolve) => setTimeout(resolve, 20));
    const pool = new LocalPool('python', 1);
    let release: () => void;
    const busy = pool.run(() => new Promise<void>((resolve) => (release = resolve)));
    const queued = pool.run(async () => undefined);
    await new Promise((resolve) => setImmediate(resolve));
    release();
    await Promise.all([busy, queued]);

    const sums = await collected();

    expect(deadline.signal.aborted).toBe(true);
    expect(sums[`${WORKFLOW_METRIC.STEP_STOPPED}{timeout}`]).toBeGreaterThanOrEqual(1);
    expect(sums[`${WORKFLOW_METRIC.POOL_WAITED}{python}`]).toBe(1);
  });
});
