import { EventEmitter2 } from '@nestjs/event-emitter';
import { Request } from 'express';
import * as requestIp from 'request-ip';
import { AuditLogFields } from '@modules/audit-logs/types';
import { RequestContext } from '@modules/request-context/service';

// Emits an entry with the request metadata ResponseInterceptor adds to v1 entries, for routes that
// write one entry per item instead of one per request.
export function emitRequestAuditLogEntry(eventEmitter: EventEmitter2, entry: Partial<AuditLogFields>): void {
  const context = RequestContext.currentContext;
  const request = context?.req as
    | (Request & { clientIp?: string; user?: { oauthGrantId?: string; oauthClientId?: string } })
    | undefined;
  const locals = context?.res?.locals;
  let metadata = { ...(entry.metadata ?? {}) };
  if (request?.user?.oauthGrantId) {
    metadata = {
      ...metadata,
      oauthGrantId: request.user.oauthGrantId,
      oauthClientId: request.user.oauthClientId,
    };
  }
  if (locals?.tj_transactionId) {
    metadata = {
      ...metadata,
      transactionId: locals.tj_transactionId,
      totalDuration: locals.tj_start_time ? Date.now() - locals.tj_start_time : 'unknown',
      route: locals.tj_route,
    };
  }
  eventEmitter.emit('auditLogEntry', {
    ...entry,
    metadata,
    ipAddress: request?.clientIp || (request && requestIp.getClientIp(request)),
    userAgent: request?.headers['user-agent'],
  });
}
