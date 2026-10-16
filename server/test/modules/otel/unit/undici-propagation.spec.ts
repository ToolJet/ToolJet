import { createServer, IncomingHttpHeaders } from 'http';
import { AddressInfo } from 'net';
import { propagation, ROOT_CONTEXT, trace } from '@opentelemetry/api';
import { CompositePropagator, W3CTraceContextPropagator } from '@opentelemetry/core';
import { UndiciInstrumentation } from '@opentelemetry/instrumentation-undici';
import { InMemorySpanExporter, NodeTracerProvider, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { ExtractOnlyBaggagePropagator } from '@otel/baggage';
import { undiciRequestHook } from '@otel/http-span';

describe('outbound fetch', () => {
  const exporter = new InMemorySpanExporter();
  const provider = new NodeTracerProvider({ spanProcessors: [new SimpleSpanProcessor(exporter)] });
  const instrumentation = new UndiciInstrumentation({ requestHook: undiciRequestHook });
  let seen: IncomingHttpHeaders = {};
  const server = createServer((req, res) => {
    seen = req.headers;
    res.end('ok');
  });
  const base = () => `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  beforeAll(async () => {
    provider.register({
      propagator: new CompositePropagator({
        propagators: [new W3CTraceContextPropagator(), new ExtractOnlyBaggagePropagator()],
      }),
    });
    instrumentation.setTracerProvider(provider);
    instrumentation.enable();
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  });

  afterAll(async () => {
    instrumentation.disable();
    await provider.shutdown();
    server.close();
  });

  it('sends traceparent but no baggage', async () => {
    const ctx = propagation.setBaggage(ROOT_CONTEXT, propagation.createBaggage({ 'tooljet.origin': { value: 'ai' } }));
    const parent = trace.getTracer('test').startSpan('parent', {}, ctx);
    await trace.getTracer('test').startActiveSpan('parent-active', {}, trace.setSpan(ctx, parent), async (span) => {
      await (await fetch(`${base()}/`)).text();
      span.end();
    });
    parent.end();
    expect(seen.traceparent).toContain(parent.spanContext().traceId);
    expect(seen.baggage).toBeUndefined();
    expect(exporter.getFinishedSpans().some((s) => s.name.startsWith('GET'))).toBe(true);
  });

  it('redacts secret query values on the client span', async () => {
    exporter.reset();
    await (await fetch(`${base()}/x?api_key=s&page=2`)).text();
    const span = exporter.getFinishedSpans().find((s) => s.name.startsWith('GET'));
    expect(span?.attributes['url.full']).toBe(`${base()}/x?api_key=[REDACTED]&page=2`);
    expect(span?.attributes['url.query']).toBe('?api_key=[REDACTED]&page=2');
  });
});
