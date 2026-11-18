import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Request, Response } from 'express';
import { RequestContext } from './service';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware<Request, Response> {
  use(req: Request, res: Response, next: () => void) {
    RequestContext.cls.run(new RequestContext(req, res), () => {
      // Generate a 15-digit random transaction ID
      const transactionId = Math.floor(100000000000000 + Math.random() * 900000000000000).toString();

      // Create route string in the format [METHOD] originalUrl
      const route = `[${req?.method}] ${req?.originalUrl}`;

      // Set transaction ID and route in locals
      RequestContext.setLocals('tj_transactionId', transactionId);
      RequestContext.setLocals('tj_route', route);
      RequestContext.setLocals('tj_start_time', Date.now());

      // Correlates every audit event written by this request; also returned to the client.
      const requestId = randomUUID();
      RequestContext.setLocals('tj_request_id', requestId);
      res.setHeader('X-Request-Id', requestId);

      next();
    });
  }
}
