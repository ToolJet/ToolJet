import pino from 'pino';
import { OtelLogStream } from './otel-log-stream';

// Shared by loader.ts (HTTP/bootstrap logs) and service.ts (appLogger.*), so both reach OTLP.
let baseLogger: pino.Logger | undefined;

function validLevel(raw: string | undefined, fallback: string): string {
  return raw && raw in pino.levels.values ? raw : fallback;
}

export function buildBaseLogger(): pino.Logger {
  if (baseLogger) return baseLogger;

  const env = process.env.NODE_ENV || 'development';

  // LOG_LEVEL is the real app-verbosity knob; ORM_LOGGING (SQL-only by name) is kept as a
  // backward-compatible fallback.
  const level =
    validLevel(process.env.LOG_LEVEL, '') ||
    (env === 'development'
      ? 'trace'
      : env === 'test'
        ? 'error'
        : ({ all: 'debug', warn: 'warn', error: 'error' } as Record<string, string>)[process.env.ORM_LOGGING ?? ''] ||
          'warn');

  const otelOn = process.env.ENABLE_OTEL === 'true' && !!process.env.OTEL_EXPORTER_OTLP_LOGS;

  const consoleStream =
    env !== 'production' && env !== 'test'
      ? pino.transport({
          target: 'pino-pretty',
          options: { colorize: true, levelFirst: true, translateTime: 'UTC:mm/dd/yyyy, h:MM:ss TT Z' },
        })
      : process.stdout;

  // One level for every destination: a line in `docker logs` is a line in the logs backend and
  // vice versa. level:0 is required — multistream's own per-stream default is 'info', which would
  // silently clamp a LOG_LEVEL of debug/trace on both legs. Filtering happens once, on the
  // instance level below; if the backend ever needs to be quieter than stdout, that belongs in
  // the collector's filter processor, not a second app-side knob.
  const destination = otelOn
    ? pino.multistream([
        { stream: consoleStream, level: 0 },
        { stream: new OtelLogStream(), level: 0 },
      ])
    : consoleStream;

  // formatters.level applies always, not just when OTEL is on — readable prod JSON
  // ("info" instead of 30) is worth having either way.
  baseLogger = pino({ level, formatters: { level: (label) => ({ level: label }) } }, destination);

  return baseLogger;
}

export function __resetBaseLoggerForTests(): void {
  baseLogger = undefined;
}
