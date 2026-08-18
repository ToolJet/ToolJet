import { SeverityNumber } from '@opentelemetry/api-logs';
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
    const logger = getServerLogger();
    if (!logger) return;

    let record: Record<string, unknown>;
    try {
      record = JSON.parse(chunk);
    } catch {
      return; // never let a malformed line break the write path
    }

    const { level, msg, time, pid, hostname, trace_id, span_id, ...attributes } = record as Record<string, any>;
    const levelName = typeof level === 'string' ? level : 'info';

    logger.emit({
      severityNumber: SEVERITY_BY_LEVEL[levelName] ?? SeverityNumber.INFO,
      severityText: levelName.toUpperCase(),
      body: msg,
      timestamp: typeof time === 'number' ? time : Date.now(),
      attributes: {
        ...attributes,
        ...(trace_id ? { trace_id } : {}),
        ...(span_id ? { span_id } : {}),
      },
    });
  }
}
