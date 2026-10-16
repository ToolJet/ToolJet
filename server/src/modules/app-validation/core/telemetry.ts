import { Counter, metrics, trace } from '@opentelemetry/api';
import { ATTR, METRIC, VALIDATION_ATTR } from '@otel/semconv';
import { setRequestSpanAttributes } from '@otel/request-span';
import { Issue, ValidationArea, ValidationMode, ValidationResult, WriteSource } from '../types';

// What the caller got: rejected (enforce error), would-block returned as warning (report error), or a warning.
type Outcome = 'blocked' | 'reported' | 'warned';

let issuesCounter: Counter | undefined;

// Lazy: a meter taken before the SDK starts stays a no-op for good.
const counter = (): Counter =>
  (issuesCounter ??= metrics.getMeter('tooljet-app').createCounter(METRIC.APP_VALIDATION_ISSUES, {
    description: 'App validation issues, by area, write source, mode, rule code, severity and outcome',
    unit: '1',
  }));

// Telemetry must never fail the write.
const safely = (fn: () => void): void => {
  try {
    fn();
  } catch {
    // ignore
  }
};

export const recordWriteSource = (source: WriteSource): void =>
  safely(() => setRequestSpanAttributes({ [ATTR.WRITE_SOURCE]: source }));

export function recordValidation(
  area: ValidationArea,
  source: WriteSource,
  mode: ValidationMode,
  { errors, warnings }: ValidationResult
): void {
  if (!errors.length && !warnings.length) return;
  safely(() => {
    const errorOutcome: Outcome = mode === 'enforce' ? 'blocked' : 'reported';
    const outcomes: [Outcome, Issue[]][] = [
      [errorOutcome, errors],
      ['warned', warnings],
    ];
    const counts: Record<Outcome, number> = { blocked: 0, reported: 0, warned: 0 };
    for (const [outcome, issues] of outcomes) {
      counts[outcome] += issues.length;
      for (const { code, severity } of issues) {
        counter().add(1, {
          [VALIDATION_ATTR.AREA]: area,
          [VALIDATION_ATTR.SOURCE]: source,
          [VALIDATION_ATTR.MODE]: mode,
          [VALIDATION_ATTR.CODE]: code,
          [VALIDATION_ATTR.SEVERITY]: severity,
          [VALIDATION_ATTR.OUTCOME]: outcome,
        });
      }
    }
    trace.getActiveSpan()?.addEvent('app_validation', {
      [VALIDATION_ATTR.AREA]: area,
      [VALIDATION_ATTR.SOURCE]: source,
      [VALIDATION_ATTR.MODE]: mode,
      ...counts,
      [VALIDATION_ATTR.CODES]: [...new Set([...errors, ...warnings].map(({ code }) => code))],
    });
  });
}
