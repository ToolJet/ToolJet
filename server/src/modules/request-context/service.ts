import { AsyncLocalStorage } from 'async_hooks';
import { Logger } from '@nestjs/common';
import { Request, Response } from 'express';

export class RequestContext {
  private static readonly logger = new Logger(RequestContext.name);
  static cls = new AsyncLocalStorage<RequestContext>();

  static get currentContext() {
    return this.cls.getStore();
  }

  static setLocals(key: string, data: any) {
    const context = this.currentContext;
    if (!context) {
      RequestContext.logger.error('RequestContext is not set');
      return;
    }
    if (!context.res.locals) {
      context.res.locals = {};
    }
    context.res.locals[key] = data;
  }

  static getTransactionId(): string | undefined {
    const context = this.currentContext;
    return context?.res?.locals?.tj_transactionId || '';
  }

  static getRoute(): string | undefined {
    const context = this.currentContext;
    return context?.res?.locals?.tj_route || 'unknown';
  }

  static getStartTime(): number | undefined {
    const context = this.currentContext;
    return context?.res?.locals?.tj_start_time;
  }

  constructor(
    public readonly req: Request,
    public readonly res: Response
  ) {}
}
