/** @group platform */
import { Counter, context, metrics, propagation, trace } from '@opentelemetry/api';
import { RPCType, setRPCMetadata } from '@opentelemetry/core';
import { DataPointType, MeterProvider, MetricReader } from '@opentelemetry/sdk-metrics';
import { InMemorySpanExporter, NodeTracerProvider, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { Logger } from 'nestjs-pino';
import * as requestSpan from '@otel/request-span';
import { AppValidationService } from '@modules/app-validation/service';
import { AppValidationException } from '@modules/app-validation/core/exception';
import { Issue, Rule, ValidationMode, WriteSource } from '@modules/app-validation/types';
import { VersionIndex } from '@modules/app-validation/version-index';

class TestReader extends MetricReader {
  protected async onForceFlush(): Promise<void> {}
  protected async onShutdown(): Promise<void> {}
}

const reader = new TestReader();
let exporter: InMemorySpanExporter;
let provider: NodeTracerProvider;

// Meter first: the counter is created lazily on first use and must bind to this provider.
beforeAll(() => metrics.setGlobalMeterProvider(new MeterProvider({ readers: [reader] })));
afterAll(() => metrics.disable());

// Fresh exporter per test: provider.shutdown() stops it for good.
beforeEach(() => {
  exporter = new InMemorySpanExporter();
  provider = new NodeTracerProvider({ spanProcessors: [new SimpleSpanProcessor(exporter)] });
  provider.register();
});

afterEach(async () => {
  jest.restoreAllMocks();
  await provider.shutdown();
  trace.disable();
  context.disable();
  propagation.disable();
});

const issue = (code: string, overrides: Partial<Issue> = {}): Issue => ({
  code,
  severity: 'critical',
  confidence: 'certain',
  path: 'button1.properties.text',
  message: `button1: ${code}`,
  ...overrides,
});

const warning = (code: string) => issue(code, { severity: 'medium' });

const ruleReturning = (...issues: Issue[]): Rule<unknown> => ({
  id: 'returns-issues',
  description: 'test rule',
  check: () => issues,
});

type Point = { attributes: Record<string, unknown>; value: number };

const issuePoints = async (): Promise<Point[]> => {
  const { resourceMetrics } = await reader.collect();
  const metric = resourceMetrics.scopeMetrics
    .flatMap((scope) => scope.metrics)
    .find((m) => m.descriptor.name === 'tooljet.app_validation.issues');
  return metric?.dataPointType === DataPointType.SUM
    ? metric.dataPoints.map(({ attributes, value }) => ({ attributes, value }))
    : [];
};

// Counter is cumulative across tests: compare deltas for one label set.
const countFor = (points: Point[], labels: Record<string, string>) =>
  points.find((p) => JSON.stringify(p.attributes) === JSON.stringify(labels))?.value ?? 0;

async function inRequest(fn: () => Promise<unknown>) {
  const tracer = trace.getTracer('test');
  const server = tracer.startSpan('PUT /api/v2/apps/:id/versions/:versionId/components');
  const serverContext = setRPCMetadata(trace.setSpan(context.active(), server), { type: RPCType.HTTP, span: server });
  const handler = tracer.startSpan('ComponentsController.update', undefined, serverContext);
  const outcome = await context.with(trace.setSpan(serverContext, handler), () =>
    fn().catch((error: unknown) => error)
  );
  handler.end();
  server.end();
  const spans = exporter.getFinishedSpans();
  return {
    outcome,
    server: spans.find((span) => span.name.startsWith('PUT ')),
    handler: spans.find((span) => span.name === 'ComponentsController.update'),
  };
}

describe('AppValidationService telemetry', () => {
  let logger: { warn: jest.Mock; error: jest.Mock };
  let service: AppValidationService;

  beforeEach(() => {
    logger = { warn: jest.fn(), error: jest.fn() };
    service = new AppValidationService(logger as unknown as Logger);
  });

  const setMode = (mode: ValidationMode) =>
    jest.spyOn(service as unknown as { modeFor(source: WriteSource): ValidationMode }, 'modeFor').mockReturnValue(mode);

  const check = (rules: Rule<unknown>[], source: WriteSource = 'ai') =>
    service.check('components', [{}], { appVersionId: 'v1', source, rules, index: VersionIndex.fromData({}) });

  const labels = (code: string, severity: string, mode: string, outcome: string, source = 'ai') => ({
    area: 'components',
    source,
    mode,
    code,
    severity,
    outcome,
  });

  it('report mode: stamps write source, records the event and counts errors as reported, warnings as warned', async () => {
    setMode('report');
    const reported = labels('COMPONENT_UNKNOWN_TYPE', 'critical', 'report', 'reported');
    const warned = labels('PROPERTY_ENUM_MISMATCH', 'medium', 'report', 'warned');
    const before = await issuePoints();

    const { server, handler } = await inRequest(() =>
      check([
        ruleReturning(
          issue('COMPONENT_UNKNOWN_TYPE'),
          issue('COMPONENT_UNKNOWN_TYPE'),
          warning('PROPERTY_ENUM_MISMATCH')
        ),
      ])
    );

    expect(server?.attributes['tooljet.write_source']).toBe('ai');
    expect(handler?.events).toEqual([
      expect.objectContaining({
        name: 'app_validation',
        attributes: {
          area: 'components',
          source: 'ai',
          mode: 'report',
          blocked: 0,
          reported: 2,
          warned: 1,
          codes: ['COMPONENT_UNKNOWN_TYPE', 'PROPERTY_ENUM_MISMATCH'],
        },
      }),
    ]);
    const after = await issuePoints();
    expect(countFor(after, reported) - countFor(before, reported)).toBe(2);
    expect(countFor(after, warned) - countFor(before, warned)).toBe(1);
  });

  it('enforce mode: warns with the rejected codes, counts errors as blocked, then throws', async () => {
    setMode('enforce');
    const blocked = labels('EVENT_UNKNOWN_ACTION', 'critical', 'enforce', 'blocked', 'pat');
    const warned = labels('PROPERTY_ENUM_MISMATCH', 'medium', 'enforce', 'warned', 'pat');
    const before = await issuePoints();

    const { outcome, handler } = await inRequest(() =>
      check([ruleReturning(issue('EVENT_UNKNOWN_ACTION'), warning('PROPERTY_ENUM_MISMATCH'))], 'pat')
    );

    expect(outcome).toBeInstanceOf(AppValidationException);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        appValidation: expect.objectContaining({
          area: 'components',
          source: 'pat',
          rejected: [{ code: 'EVENT_UNKNOWN_ACTION', path: 'button1.properties.text' }],
        }),
      }),
      expect.stringContaining('enforce')
    );
    expect(handler?.events[0]?.attributes).toMatchObject({ mode: 'enforce', blocked: 1, reported: 0, warned: 1 });
    const after = await issuePoints();
    expect(countFor(after, blocked) - countFor(before, blocked)).toBe(1);
    expect(countFor(after, warned) - countFor(before, warned)).toBe(1);
  });

  it('clean write: stamps write source, no event', async () => {
    setMode('report');
    const { server, handler } = await inRequest(() => check([ruleReturning()], 'ui'));
    expect(server?.attributes['tooljet.write_source']).toBe('ui');
    expect(handler?.events).toEqual([]);
  });

  it('a telemetry failure never breaks the write', async () => {
    setMode('report');
    const broken = () => {
      throw new Error('broken exporter');
    };
    // SDK counter class is not exported; reach its prototype through a probe instance.
    const counterPrototype = Object.getPrototypeOf(metrics.getMeter('probe').createCounter('probe')) as Counter;
    jest.spyOn(counterPrototype, 'add').mockImplementation(broken);
    jest.spyOn(requestSpan, 'setRequestSpanAttributes').mockImplementation(broken);
    jest.spyOn(trace, 'getActiveSpan').mockImplementation(broken);

    const { outcome } = await inRequest(() => check([ruleReturning(issue('COMPONENT_UNKNOWN_TYPE'))]));

    expect(outcome).toEqual({ errors: [issue('COMPONENT_UNKNOWN_TYPE')], warnings: [] });
    expect(counterPrototype.add).toHaveBeenCalled();
    expect(requestSpan.setRequestSpanAttributes).toHaveBeenCalled();
  });
});
