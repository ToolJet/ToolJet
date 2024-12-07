import { AsyncLocalStorage } from 'async_hooks';
import { Request, Response } from 'express';
import { User } from 'src/entities/user.entity';

export class RequestContext {
  static cls = new AsyncLocalStorage<RequestContext>();

  static get currentContext() {
    return this.cls.getStore();
  }

  constructor(public readonly req: Request, public readonly res: Response) {}

  get user() {
    return this.req.user as User;
  }
}
