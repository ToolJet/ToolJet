import { Injectable, LoggerService } from '@nestjs/common';
import { RequestContext } from '@modules/request-context/service';
import { Logger as PinoBaseLogger } from 'pino';
import { ignoreLogPaths } from '../logging/constant';
import { buildBaseLogger } from './base-logger';

const SENSITIVE_KEYS = [
  'password',
  'current_password',
  'new_password',
  'token',
  'invitation_token',
  'access_token',
  'refresh_token',
  'secret',
  'api_key',
  'authorization',
  'cookie',
];

// Redact known-sensitive keys before an object gets flattened into the log message string —
// has to happen here, not downstream, since there's no object shape left to redact after.
function redact(value: unknown, seen = new WeakSet<object>()): unknown {
  if (typeof value !== 'object' || value === null) return value;
  if (seen.has(value)) return '[CIRCULAR]';
  seen.add(value);
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value)) {
    result[key] = SENSITIVE_KEYS.includes(key.toLowerCase()) ? '[REDACTED]' : redact(val, seen);
  }
  return result;
}

@Injectable()
export class TransactionLogger implements LoggerService {
  // Shared with nestjs-pino's HTTP/bootstrap logger (loader.ts) via buildBaseLogger().
  private readonly logger: PinoBaseLogger = buildBaseLogger();

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
    // A logging call must never crash its caller — if redact/stringify blows up on some
    // exotic value (a throwing getter, a circular ref past the seen-set, etc.), fall back
    // to a placeholder for that one param instead of losing the whole log line.
    const formattedParams = optionalParams
      .map((param) => {
        if (typeof param !== 'object' || param === null) return param;
        try {
          return JSON.stringify(redact(param));
        } catch {
          return '[unloggable]';
        }
      })
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
    this.logger.info(...this.processData(message, ...optionalParams));
  }

  error(message: any, ...optionalParams: any[]) {
    if (this.shouldIgnoreLog()) {
      return;
    }
    this.logger.error(...this.processData(message, ...optionalParams));
  }

  warn(message: any, ...optionalParams: any[]) {
    if (this.shouldIgnoreLog()) {
      return;
    }
    this.logger.warn(...this.processData(message, ...optionalParams));
  }

  // Use for detailed debug level logs
  debug(message: any, ...optionalParams: any[]) {
    if (this.shouldIgnoreLog()) {
      return;
    }
    this.logger.debug(...this.processData(message, ...optionalParams));
  }

  // Use for detailed trace level logs
  trace(message: any, ...optionalParams: any[]) {
    if (this.shouldIgnoreLog()) {
      return;
    }
    this.logger.trace(...this.processData(message, ...optionalParams));
  }
}
