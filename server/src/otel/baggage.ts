import { Context, propagation } from '@opentelemetry/api';
import { W3CBaggagePropagator } from '@opentelemetry/core';
import type { ReadableSpan, Span, SpanProcessor } from '@opentelemetry/sdk-trace-node';
import { ATTR } from './semconv';

export const PROPAGATED_BAGGAGE_KEYS: readonly string[] = [ATTR.ORIGIN, ATTR.GEN_AI_CONVERSATION_ID];
const MAX_VALUE_LENGTH = 128;
// tooljet.origin is a spanmetrics dimension: unknown values would mint label series.
const ORIGIN_VALUES: readonly string[] = ['ai'];

// Makes AI-originated requests queryable on every span they cause.
export class BaggageAttributesSpanProcessor implements SpanProcessor {
  onStart(span: Span, parentContext: Context): void {
    const baggage = propagation.getBaggage(parentContext);
    if (!baggage) return;
    for (const key of PROPAGATED_BAGGAGE_KEYS) {
      const value = baggage.getEntry(key)?.value;
      if (!value || (key === ATTR.ORIGIN && !ORIGIN_VALUES.includes(value))) continue;
      span.setAttribute(key, value.slice(0, MAX_VALUE_LENGTH));
    }
  }

  onEnd(_span: ReadableSpan): void {}

  forceFlush(): Promise<void> {
    return Promise.resolve();
  }

  shutdown(): Promise<void> {
    return Promise.resolve();
  }
}

// Server is a leaf for baggage: read it, never forward it to data sources or third parties.
export class ExtractOnlyBaggagePropagator extends W3CBaggagePropagator {
  inject(_context: Context, _carrier: unknown, _setter: unknown): void {}
}
