import { AsyncLocalStorage } from 'async_hooks';
import { Request, Response } from 'express';

export class RequestContext {
  static cls = new AsyncLocalStorage<RequestContext>();

  static get currentContext() {
    return this.cls.getStore();
  }

  static setLocals(key: string, data: any) {
    const context = this.currentContext;
    if (!context) {
      console.error('RequestContext is not set');
      return;
    }
    if (!context.res.locals) {
      context.res.locals = {};
    }
    context.res.locals[key] = data;
  }

  constructor(public readonly req: Request, public readonly res: Response) {}
}
