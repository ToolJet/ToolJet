import { propagation, ROOT_CONTEXT } from '@opentelemetry/api';
import { BasicTracerProvider, InMemorySpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { BaggageAttributesSpanProcessor, ExtractOnlyBaggagePropagator } from '@otel/baggage';

describe('BaggageAttributesSpanProcessor', () => {
  const exporter = new InMemorySpanExporter();
  const provider = new BasicTracerProvider({
    spanProcessors: [new BaggageAttributesSpanProcessor(), new SimpleSpanProcessor(exporter)],
  });
  const tracer = provider.getTracer('test');

  afterEach(() => exporter.reset());

  it('copies allowlisted baggage only, capped at 128 chars', () => {
    const baggage = propagation.createBaggage({
      'tooljet.origin': { value: 'ai' },
      'gen_ai.conversation.id': { value: 'x'.repeat(500) },
      'user.email': { value: 'a@b.c' },
    });
    tracer.startSpan('s', {}, propagation.setBaggage(ROOT_CONTEXT, baggage)).end();
    const attrs = exporter.getFinishedSpans()[0].attributes;
    expect(attrs['tooljet.origin']).toBe('ai');
    expect(attrs['gen_ai.conversation.id']).toHaveLength(128);
    expect(attrs).not.toHaveProperty('user.email');
  });

  it('does nothing without baggage', () => {
    tracer.startSpan('s', {}, ROOT_CONTEXT).end();
    expect(exporter.getFinishedSpans()[0].attributes).not.toHaveProperty('tooljet.origin');
  });
});

describe('ExtractOnlyBaggagePropagator', () => {
  const propagator = new ExtractOnlyBaggagePropagator();
  const getter = {
    get: (c: Record<string, string>, k: string) => c[k],
    keys: (c: Record<string, string>) => Object.keys(c),
  };
  const setter = { set: (c: Record<string, string>, k: string, v: string) => (c[k] = v) };

  it('extracts incoming baggage', () => {
    const ctx = propagator.extract(ROOT_CONTEXT, { baggage: 'tooljet.origin=ai' }, getter);
    expect(propagation.getBaggage(ctx)?.getEntry('tooljet.origin')?.value).toBe('ai');
  });

  it('never injects baggage on outbound calls', () => {
    const ctx = propagation.setBaggage(ROOT_CONTEXT, propagation.createBaggage({ 'tooljet.origin': { value: 'ai' } }));
    const carrier: Record<string, string> = {};
    propagator.inject(ctx, carrier, setter);
    expect(carrier).toEqual({});
  });
});
