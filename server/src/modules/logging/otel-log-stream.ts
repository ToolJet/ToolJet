import pino from 'pino';
import { SeverityNumber, LogAttributes } from '@opentelemetry/api-logs';
import { getServerLogger } from '@otel/logs';

const SEVERITY_BY_LEVEL: Record<string, SeverityNumber> = {
  trace: SeverityNumber.TRACE,
  debug: SeverityNumber.DEBUG,
  info: SeverityNumber.INFO,
  warn: SeverityNumber.WARN,
  error: SeverityNumber.ERROR,
  fatal: SeverityNumber.FATAL,
};

/**
 * A pino multistream destination that forwards each log line to the OTel Logs SDK.
 *
 * Looks up the server logger lazily on every write (rather than once at construction)
 * so it doesn't matter whether initializeOtelLogs() has run yet — before that, or when
 * OTEL_EXPORTER_OTLP_LOGS isn't set at all, getServerLogger() returns undefined and this
 * is a silent no-op, same gate the frontend error logger already uses.
 */
export class OtelLogStream {
  write(chunk: string): void {
    // The whole body is guarded, not just JSON.parse — this stream sits in the same
    // synchronous multistream fan-out as stdout, and TransactionLogger IS Nest's app
    // logger. Anything thrown here (a malformed record, or the SDK's own emit()
    // raising) would otherwise surface at the original this.logger.log(...) call site —
    // turning an ordinary log call into a request failure. Observability must never
    // break the app it's observing.
    try {
      const logger = getServerLogger();
      if (!logger) return;

      // JSON.parse's return type is `any` by definition (TS can't know the shape of
      // arbitrary text) — cast to `unknown` immediately so nothing downstream can smuggle
      // an unchecked `any` further into the call. Every field used below is narrowed by
      // typeof before use, not assumed.
      const record: unknown = JSON.parse(chunk);
      if (!record || typeof record !== 'object') return;

      // trace_id/span_id/trace_flags are named here only to keep them OUT of attributes —
      // emit() already reads the active span from context and fills the record's native
      // spanContext (traceId/spanId/traceFlags), which is what Grafana's trace-to-logs link
      // actually follows. Re-adding them as attributes was a redundant second copy; trace_flags
      // wasn't even named before, so it leaked through into attributes by accident.
      const { level, msg, time, pid, hostname, trace_id, span_id, trace_flags, ...attributes } = record as Record<
        string,
        unknown
      >;
      // typeof level === 'string' holds today only because service.ts's formatters.level
      // hook guarantees it — an implicit coupling with no test tying the two files together.
      // Fall back through pino's own label table first, so this file stays correct even if
      // that formatter is ever reverted elsewhere.
      const levelName =
        typeof level === 'string' ? level : typeof level === 'number' ? pino.levels.labels[level] || 'info' : 'info';

      logger.emit({
        severityNumber: SEVERITY_BY_LEVEL[levelName] ?? SeverityNumber.INFO,
        severityText: levelName.toUpperCase(),
        body: typeof msg === 'string' ? msg : undefined,
        timestamp: typeof time === 'number' ? time : Date.now(),
        // Safe: everything in `attributes` came out of JSON.parse, so by construction it can
        // only be string/number/boolean/null/array/plain-object — exactly LogAttributes'
        // own shape. Nothing JSON-incompatible (a function, Uint8Array, Symbol) can appear here.
        attributes: attributes as LogAttributes,
      });
    } catch {
      // never let a broken line, or a misbehaving SDK, break the write path
    }
  }
}
