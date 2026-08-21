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

// pino multistream destination — translates one serialized log line into an OTel LogRecord.
export class OtelLogStream {
  write(chunk: string): void {
    // Whole body guarded — a throw here would surface at the original appLogger.* call site.
    try {
      const logger = getServerLogger();
      if (!logger) return;

      const record: unknown = JSON.parse(chunk);
      if (!record || typeof record !== 'object') return;

      // trace_id/span_id/trace_flags kept out of attributes — emit() already fills the
      // record's native spanContext with them.
      const { level, msg, time, pid, hostname, trace_id, span_id, trace_flags, ...attributes } = record as Record<
        string,
        unknown
      >;

      const levelName =
        typeof level === 'string' ? level : typeof level === 'number' ? pino.levels.labels[level] || 'info' : 'info';

      logger.emit({
        severityNumber: SEVERITY_BY_LEVEL[levelName] ?? SeverityNumber.INFO,
        severityText: levelName.toUpperCase(),
        body: typeof msg === 'string' ? msg : undefined,
        timestamp: typeof time === 'number' ? time : Date.now(),
        attributes: attributes as LogAttributes, // JSON.parse output is always plain JSON, safe here
      });
    } catch {
      // never let a broken line, or a misbehaving SDK, break the write path
    }
  }
}
