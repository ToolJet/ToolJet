import pino from 'pino';
import { OtelLogStream } from './otel-log-stream';

// Single pino construction site. Previously built twice — once here, once inline in
// loader.ts's LoggerModule.forRoot() — with two independently-drifting copies of the same
// level-mapping logic ('trace' vs 'debug' for the exact same NODE_ENV=development case).
// Shared by nestjs-pino's HTTP/bootstrap logger (loader.ts) and TransactionLogger's injected
// appLogger.* calls (service.ts), so both get the OTLP stream identically — not just
// whichever one happened to get wired first.
let baseLogger: pino.Logger | undefined;

function validLevel(raw: string | undefined, fallback: string): string {
  return raw && raw in pino.levels.values ? raw : fallback;
}

export function buildBaseLogger(): pino.Logger {
  if (baseLogger) return baseLogger;

  const env = process.env.NODE_ENV || 'development';

  // LOG_LEVEL is the real app-verbosity knob. ORM_LOGGING only means what its name says —
  // SQL query logging (see typeorm-logger.service.ts) — but historically also drove this
  // floor, since it was the only lever anyone had. Kept as a fallback so existing deployments
  // leaning on ORM_LOGGING=all for general verbosity don't silently go quiet on upgrade;
  // new setups should reach for LOG_LEVEL directly.
  const explicitLevel = validLevel(process.env.LOG_LEVEL, '');
  const level =
    explicitLevel ||
    (env === 'development'
      ? 'trace'
      : env === 'test'
        ? 'error'
        : ({ all: 'debug', warn: 'warn', error: 'error' } as Record<string, string>)[process.env.ORM_LOGGING ?? ''] ||
          'warn');

  // Both gates matter: ENABLE_OTEL alone leaves the floor lowered (every info line fully
  // serialized) for a stream that resolves getServerLogger()=undefined and bins it — pure
  // per-request waste when OTEL_EXPORTER_OTLP_LOGS isn't also set.
  const otelLoggingEnabled = process.env.ENABLE_OTEL === 'true' && !!process.env.OTEL_EXPORTER_OTLP_LOGS;

  // The one operator-facing knob for Loki ingest volume, independent of stdout's own
  // ORM_LOGGING/LOG_LEVEL-driven verbosity. Deliberately not OTEL_LOG_LEVEL — that var
  // already gates the OTel SDK's own internal diagnostic logging (tracing.ts and friends),
  // an unrelated concern with 20+ existing call sites.
  const otelLevel = validLevel(process.env.OTEL_LOGS_LEVEL, 'info');

  // pino's own `level` option is a hard floor beneath which NOTHING reaches ANY stream — if
  // ORM_LOGGING/LOG_LEVEL left it above the OTLP stream's own level, those lines never even
  // get dispatched for that stream to see. Lower the floor only when OTEL logging is on;
  // stdout keeps its configured verbosity via its own per-stream level below.
  const effectiveLevel =
    otelLoggingEnabled && pino.levels.values[level] > pino.levels.values[otelLevel] ? otelLevel : level;

  const consoleStream =
    env !== 'production' && env !== 'test'
      ? pino.transport({
          target: 'pino-pretty',
          options: { colorize: true, levelFirst: true, translateTime: 'UTC:mm/dd/yyyy, h:MM:ss TT Z' },
        })
      : process.stdout;

  // Unchanged single destination when OTEL is off — byte-identical to today's output.
  const destination = otelLoggingEnabled
    ? pino.multistream([
        { stream: consoleStream, level },
        { stream: new OtelLogStream(), level: otelLevel },
      ])
    : consoleStream;

  baseLogger = pino(
    {
      level: effectiveLevel,
      // Numeric levels (30/40/50) are opaque in production JSON — a self-hosted admin
      // tailing `docker logs` has no way to know 30 means info. String labels cost nothing.
      // Applies to every consumer of this logger, not just TransactionLogger's slice —
      // unconditional by choice: readable prod logs are a win independent of OTEL, and
      // gating it would mean anyone not using OTEL never gets it.
      formatters: { level: (label) => ({ level: label }) },
    },
    destination
  );

  return baseLogger;
}

/** Test-only escape hatch — forces the next buildBaseLogger() call to construct fresh. */
export function __resetBaseLoggerForTests(): void {
  baseLogger = undefined;
}
