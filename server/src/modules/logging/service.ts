import { Injectable, LoggerService } from '@nestjs/common';
import { RequestContext } from '@modules/request-context/service';
import { Logger as PinoBaseLogger } from 'pino';
import { ignoreLogPaths } from '../logging/constant';
import { redactSensitiveKeys } from '@helpers/log-redaction.helper';
import { buildBaseLogger } from './base-logger';

@Injectable()
export class TransactionLogger implements LoggerService {
  // Shared with nestjs-pino's HTTP/bootstrap logger (loader.ts) — buildBaseLogger() is
  // memoized at module scope, so both consumers resolve to the exact same pino instance
  // regardless of which one happens to call it first. TransactionLogger's only job here is
  // route/transactionId enrichment on top of it, not owning construction.
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
    // Redact BEFORE stringify, not after — once an object param is flattened into the
    // message string, there's no structure left for any path-based redactor (pino's own
    // `redact` included) to match against. This is the only point in the pipeline where
    // the original object shape still exists.
    const formattedParams = optionalParams
      .map((param) => (typeof param === 'object' ? JSON.stringify(redactSensitiveKeys(param)) : param))
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
