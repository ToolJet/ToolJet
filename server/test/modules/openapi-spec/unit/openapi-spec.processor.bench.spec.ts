// On-demand benchmark of OpenApiSpecProcessor against the full Microsoft Graph v1.0 spec.
// Skipped by default: 20-40 s, ~1.3 GB peak heap, downloads a 44 MB spec. To run, change
// `describe.skip` below to `describe` locally (don't commit that), then:
//   cd server && NODE_OPTIONS=--max-old-space-size=4096 SKIP_GLOBAL_SETUP=1 NODE_ENV=test npx jest --config jest.config.ts test/modules/openapi-spec/unit/openapi-spec.processor.bench.spec.ts
// The spec is cached in __fixtures__/.cache/ (gitignored); OPENAPI_SPEC_GRAPH_FIXTURE=<path> uses a local copy.
//
// Nothing dereferences at query-run time, so "the query path is quick" is measured here as
// (a) per-operation buildExtractedOperation time and (b) the heaviest persisted row's
// JSON.stringify/parse round-trip, standing in for the jsonb read when an operation is picked.
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';
import { performance } from 'perf_hooks';
import { definitionJob, loadProcessor, makeManager, makeProcessor } from './processor-harness';

const GRAPH_URL =
  'https://raw.githubusercontent.com/microsoftgraph/msgraph-metadata/refs/heads/master/openapi/v1.0/openapi.yaml';
const CACHE_FILE = path.join(__dirname, '../__fixtures__/.cache/microsoft-graph-v1.0.yaml');
const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'];

// Wall-clock budgets are loose: under load a GC pause can land on any operation. The single-op
// max and 2-env/1-env ratio are reported, not asserted; the 2-env test asserts dereference count instead.
const BUDGET = {
  wallMs: 60000, // measured 17.3-19.4 s idle, 30.7 s under load
  peakHeapMB: 3000, // measured 1187-1567 MB, includes uncollected garbage from the test's own yaml.load
  operationP95Ms: 10, // measured 1.99-2.34 ms idle, 4.09 ms under load
  heaviestRowKB: 2048, // measured 1079 KB (PATCH /security)
  heaviestRowRoundTripMs: 50, // measured 7.3-25.8 ms
};

const TIMEOUT_MS = 180000;

async function graphSpec(): Promise<string> {
  if (process.env.OPENAPI_SPEC_GRAPH_FIXTURE) return fs.readFileSync(process.env.OPENAPI_SPEC_GRAPH_FIXTURE, 'utf8');
  if (!fs.existsSync(CACHE_FILE)) {
    const res = await fetch(GRAPH_URL);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText} fetching ${GRAPH_URL}`);
    fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
    fs.writeFileSync(CACHE_FILE, await res.text());
  }
  return fs.readFileSync(CACHE_FILE, 'utf8');
}

type BenchRun = {
  wallMs: number;
  peakHeapMB: number;
  rowsPerEnvironment: Record<string, number>;
  skipped: number;
  operations: { ms: number; id: string }[];
  heaviest: { length: number; row: Record<string, any> } | null;
};

async function benchRun(definition: string, environmentIds: string[]): Promise<BenchRun> {
  const run: BenchRun = {
    wallMs: 0,
    peakHeapMB: 0,
    rowsPerEnvironment: Object.fromEntries(environmentIds.map((id) => [id, 0])),
    skipped: 0,
    operations: [],
    heaviest: null,
  };
  let rowMeasurementMs = 0;
  const sampleHeap = () => {
    run.peakHeapMB = Math.max(run.peakHeapMB, process.memoryUsage().heapUsed / 1024 / 1024);
  };

  // Rows are counted and dropped (only the heaviest kept), so the measured heap is the processor's.
  const { manager } = makeManager();
  manager.save.mockImplementation(async (_entity: unknown, rows: Record<string, any>[]) => {
    sampleHeap();
    run.rowsPerEnvironment[rows[0].environmentId] += rows.length;
    const measuringStartedAt = performance.now();
    for (const row of rows) {
      const length = JSON.stringify(row).length;
      if (length > (run.heaviest?.length ?? 0)) run.heaviest = { length, row };
    }
    rowMeasurementMs += performance.now() - measuringStartedAt;
    return rows;
  });

  const { processor, logger } = makeProcessor();
  logger.log.mockImplementation(sampleHeap);
  logger.error.mockImplementation((message: string) => {
    if (message.includes('skipping operation')) run.skipped++;
  });

  const buildExtractedOperation = (processor as any).buildExtractedOperation.bind(processor);
  jest.spyOn(processor as any, 'buildExtractedOperation').mockImplementation((...args: any[]) => {
    const startedAt = performance.now();
    const operation = buildExtractedOperation(...args);
    run.operations.push({ ms: performance.now() - startedAt, id: `${args[1].toUpperCase()} ${args[0]}` });
    return operation;
  });

  const startedAt = performance.now();
  await processor.process(definitionJob(definition, environmentIds));
  run.wallMs = performance.now() - startedAt - rowMeasurementMs;
  return run;
}

const percentile = (sorted: number[], p: number) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];

/** @group marketplace */
describe.skip('OpenApiSpecProcessor bench, Microsoft Graph', () => {
  let definition: string;
  let expectedOperations: number;
  let singleEnvironment: BenchRun;
  const results: [string, string, string][] = [];

  beforeAll(async () => {
    await loadProcessor();
    definition = await graphSpec();
    const paths = (yaml.load(definition) as Record<string, any>).paths || {};
    expectedOperations = Object.values(paths).reduce<number>(
      (count, pathItem: any) => count + HTTP_METHODS.filter((method) => pathItem[method]).length,
      0
    );
    singleEnvironment = await benchRun(definition, ['env-1']);
  }, TIMEOUT_MS);

  afterAll(() => {
    const widths = [0, 1, 2].map((i) =>
      Math.max(...[['metric', 'measured', 'budget'], ...results].map((r) => r[i].length))
    );
    const line = (r: string[]) => `| ${r.map((cell, i) => cell.padEnd(widths[i])).join(' | ')} |\n`;
    process.stdout.write(
      `\n[openapi-spec bench] Microsoft Graph, ${expectedOperations} operations\n` +
        line(['metric', 'measured', 'budget']) +
        line(widths.map((w) => '-'.repeat(w))) +
        results.map(line).join('')
    );
  });

  it(
    'should process the whole spec within the time and memory budget',
    async () => {
      const { wallMs, peakHeapMB, rowsPerEnvironment, skipped } = singleEnvironment;

      results.push(
        ['rows saved (env-1)', String(rowsPerEnvironment['env-1']), `${expectedOperations} - skipped`],
        ['operations skipped', String(skipped), '0'],
        ['wall time, 1 env', `${(wallMs / 1000).toFixed(1)} s`, `${BUDGET.wallMs / 1000} s`],
        ['peak heapUsed', `${peakHeapMB.toFixed(0)} MB`, `${BUDGET.peakHeapMB} MB`]
      );
      expect(rowsPerEnvironment['env-1']).toBe(expectedOperations - skipped);
      expect(skipped).toBe(0);
      expect(wallMs).toBeLessThan(BUDGET.wallMs);
      expect(peakHeapMB).toBeLessThan(BUDGET.peakHeapMB);
    },
    TIMEOUT_MS
  );

  it(
    'should process two environments without doubling the dereference work',
    async () => {
      const { wallMs, rowsPerEnvironment, operations } = await benchRun(definition, ['env-1', 'env-2']);
      const ratio = wallMs / singleEnvironment.wallMs;

      results.push(['wall time, 2 envs / 1 env', `${ratio.toFixed(2)}x`, '-']);
      const expectedRows = expectedOperations - singleEnvironment.skipped;
      expect(rowsPerEnvironment).toEqual({ 'env-1': expectedRows, 'env-2': expectedRows });
      expect(operations).toHaveLength(singleEnvironment.operations.length);
    },
    TIMEOUT_MS
  );

  it(
    'should dereference each operation quickly',
    async () => {
      const { operations } = singleEnvironment;
      const sorted = operations.map(({ ms }) => ms).sort((a, b) => a - b);
      const p50 = percentile(sorted, 0.5);
      const p95 = percentile(sorted, 0.95);
      const max = sorted[sorted.length - 1];
      const slowest = [...operations].sort((a, b) => b.ms - a.ms).slice(0, 3);

      results.push(
        ['buildExtractedOperation p50', `${p50.toFixed(2)} ms`, '-'],
        ['buildExtractedOperation p95', `${p95.toFixed(2)} ms`, `${BUDGET.operationP95Ms} ms`],
        ['buildExtractedOperation max', `${max.toFixed(1)} ms`, '-'],
        ...slowest.map(({ ms, id }, i): [string, string, string] => [
          `  slowest #${i + 1} ${id}`,
          `${ms.toFixed(1)} ms`,
          '-',
        ])
      );
      expect(p95).toBeLessThan(BUDGET.operationP95Ms);
    },
    TIMEOUT_MS
  );

  it(
    'should keep the heaviest persisted operation small and fast to read back',
    async () => {
      const { length, row } = singleEnvironment.heaviest;
      const iterations = 20;
      const startedAt = performance.now();
      for (let i = 0; i < iterations; i++) JSON.parse(JSON.stringify(row));
      const roundTripMs = (performance.now() - startedAt) / iterations;
      const kb = length / 1024;

      results.push(
        [`heaviest row ${row.method.toUpperCase()} ${row.path}`, `${kb.toFixed(1)} KB`, `${BUDGET.heaviestRowKB} KB`],
        ['heaviest row stringify+parse', `${roundTripMs.toFixed(2)} ms`, `${BUDGET.heaviestRowRoundTripMs} ms`]
      );
      expect(kb).toBeLessThan(BUDGET.heaviestRowKB);
      expect(roundTripMs).toBeLessThan(BUDGET.heaviestRowRoundTripMs);
    },
    TIMEOUT_MS
  );
});
