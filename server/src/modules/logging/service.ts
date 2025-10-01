import { Injectable, LoggerService } from '@nestjs/common';
import { RequestContext } from '@modules/request-context/service';
import pino, { Logger as PinoBaseLogger } from 'pino';
import { ConfigService } from '@nestjs/config';
import { ignoreLogPaths } from '../logging/constant';

@Injectable()
export class TransactionLogger implements LoggerService {
  private static baseLogger: PinoBaseLogger;

  constructor(private readonly configService: ConfigService) {
    // Initialize only once
    if (!TransactionLogger.baseLogger) {
      const env = this.configService.get<string>('NODE_ENV', 'development');
      const level =
        this.configService.get<string>('TRANSACTION_LOGGING_LEVEL') ||
        {
          production: 'info',
          development: 'trace',
          test: 'error',
        }[env] ||
        'trace';

      TransactionLogger.baseLogger = pino({
        level,
        ...(env !== 'production'
          ? {
              transport: {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  levelFirst: true,
                  translateTime: 'UTC:mm/dd/yyyy, h:MM:ss TT Z',
                },
              },
            }
          : {}),
      });
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
