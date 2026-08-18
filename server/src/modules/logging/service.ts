import { Injectable, LoggerService } from '@nestjs/common';
import { RequestContext } from '@modules/request-context/service';
import pino, { Logger as PinoBaseLogger } from 'pino';
import { ConfigService } from '@nestjs/config';
import { ignoreLogPaths } from '../logging/constant';
import { OtelLogStream } from './otel-log-stream';

// Decision: server logs ride the same ENABLE_OTEL flag as everything else — no separate
// toggle. Ship info/warn/error to OTLP; stdout's own verbosity (ORM_LOGGING-driven) is untouched.
const OTEL_STREAM_LEVEL = 'info';

@Injectable()
export class TransactionLogger implements LoggerService {
  private static baseLogger: PinoBaseLogger;

  constructor(private readonly configService: ConfigService) {
    // Initialize only once
    if (!TransactionLogger.baseLogger) {
      const env = this.configService.get<string>('NODE_ENV', 'development');
      // Level follows ORM_LOGGING outside dev/test so one env var drives all log verbosity
      const level =
        env === 'development'
          ? 'trace'
          : env === 'test'
            ? 'error'
            : ({ all: 'debug', warn: 'warn', error: 'error' } as Record<string, string>)[
                this.configService.get('ORM_LOGGING') ?? ''
              ] || 'warn';

      const otelLoggingEnabled = this.configService.get<string>('ENABLE_OTEL') === 'true';

      // pino's own `level` option is a hard floor beneath which NOTHING reaches ANY stream —
      // if ORM_LOGGING left it at 'warn'/'error', info-level lines never even get dispatched
      // for the OTLP stream to see. Lower the floor only when OTEL logging is actually on;
      // stdout keeps its original verbosity via its own per-stream level below.
      const effectiveLevel =
        otelLoggingEnabled && pino.levels.values[level] > pino.levels.values[OTEL_STREAM_LEVEL]
          ? OTEL_STREAM_LEVEL
          : level;

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
            { stream: new OtelLogStream(), level: OTEL_STREAM_LEVEL },
          ])
        : consoleStream;

      TransactionLogger.baseLogger = pino(
        {
          level: effectiveLevel,
          // Numeric levels (30/40/50) are opaque in production JSON — a self-hosted admin
          // tailing `docker logs` has no way to know 30 means info. String labels cost nothing.
          formatters: { level: (label) => ({ level: label }) },
        },
        destination
      );
    }
  }

  private enrichLogData(
    message: any,
    ...optionalParams: any[]
  ): {
    route?: string;
    transactionId?: string;
    checkPointer?: number;
    msg?: string;
  } {
    const transactionId = RequestContext.getTransactionId();
    const route = RequestContext.getRoute();
    const startTime = RequestContext.getStartTime();
    const formattedParams = optionalParams
      .map((param) => (typeof param === 'object' ? JSON.stringify(param) : param))
      .join(' ')
      .trim();

    const msg = formattedParams ? `${message} ${formattedParams}` : `${message}`;

    return {
      route,
      transactionId,
      checkPointer: startTime ? Date.now() - startTime : undefined,
      msg, // only original message (with params), no prefixed route/transactionId
    };
  }

  private processData(
    message: any,
    ...optionalParams: any[]
  ): [{ route?: string; transactionId?: string; checkPointer?: number }, string] {
    const data = this.enrichLogData(message, ...optionalParams);
    return [
      data.transactionId
        ? { route: data.route, transactionId: data.transactionId, checkPointer: data.checkPointer }
        : {},
      data.msg,
    ];
  }
  private shouldIgnoreLog(): boolean {
    const route = RequestContext.getRoute();
    return route ? ignoreLogPaths.includes(route) : false;
  }

  // Use detached logger so no req/res objects are appended
  log(message: any, ...optionalParams: any[]) {
    if (this.shouldIgnoreLog()) {
      return;
    }
    TransactionLogger.baseLogger.info(...this.processData(message, ...optionalParams));
  }

  error(message: any, ...optionalParams: any[]) {
    if (this.shouldIgnoreLog()) {
      return;
    }
    TransactionLogger.baseLogger.error(...this.processData(message, ...optionalParams));
  }

  warn(message: any, ...optionalParams: any[]) {
    if (this.shouldIgnoreLog()) {
      return;
    }
    TransactionLogger.baseLogger.warn(...this.processData(message, ...optionalParams));
  }

  // Use for detailed debug level logs
  debug(message: any, ...optionalParams: any[]) {
    if (this.shouldIgnoreLog()) {
      return;
    }
    TransactionLogger.baseLogger.debug(...this.processData(message, ...optionalParams));
  }

  // Use for detailed trace level logs
  trace(message: any, ...optionalParams: any[]) {
    if (this.shouldIgnoreLog()) {
      return;
    }
    TransactionLogger.baseLogger.trace(...this.processData(message, ...optionalParams));
  }
}
