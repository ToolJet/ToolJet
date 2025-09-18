import { Injectable, LoggerService } from '@nestjs/common';
import { RequestContext } from '@modules/request-context/service';
import pino, { Logger as PinoBaseLogger } from 'pino';

@Injectable()
export class TransactionLogger implements LoggerService {
  // Detached base logger (no req/res auto attachment)
  private static baseLogger: PinoBaseLogger = pino({
    level: (() => {
      const logLevel = {
        production: 'info',
        development: 'debug',
        test: 'error',
      };
      return logLevel[process.env.NODE_ENV] || 'info';
    })(),
    ...(process.env.NODE_ENV !== 'production'
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

  private enrichLogData(message: any, ...optionalParams: any[]) {
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

  // Use detached logger so no req/res objects are appended
  log(message: any, ...optionalParams: any[]) {
    const data = this.enrichLogData(message, ...optionalParams);
    TransactionLogger.baseLogger.info(
      data.transactionId
        ? { route: data.route, transactionId: data.transactionId, checkPointer: data.checkPointer }
        : {},
      data.msg
    );
  }

  error(message: any, ...optionalParams: any[]) {
    const data = this.enrichLogData(message, ...optionalParams);
    TransactionLogger.baseLogger.error(
      { route: data.route, transactionId: data.transactionId, checkPointer: data.checkPointer },
      data.msg
    );
  }

  warn(message: any, ...optionalParams: any[]) {
    const data = this.enrichLogData(message, ...optionalParams);
    TransactionLogger.baseLogger.warn(
      { route: data.route, transactionId: data.transactionId, checkPointer: data.checkPointer },
      data.msg
    );
  }

  debug(message: any, ...optionalParams: any[]) {
    const data = this.enrichLogData(message, ...optionalParams);
    TransactionLogger.baseLogger.debug(
      { route: data.route, transactionId: data.transactionId, checkPointer: data.checkPointer },
      data.msg
    );
  }

  verbose(message: any, ...optionalParams: any[]) {
    const data = this.enrichLogData(message, ...optionalParams);
    TransactionLogger.baseLogger.info(
      { route: data.route, transactionId: data.transactionId, checkPointer: data.checkPointer },
      data.msg
    );
  }
}
