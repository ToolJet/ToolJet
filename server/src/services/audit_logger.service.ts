import { ActionTypes, AuditLog, ResourceTypes } from 'src/entities/audit_log.entity';
import { EntityManager } from 'typeorm';
import * as requestIp from 'request-ip';
import { dbTransactionWrap } from 'src/helpers/utils.helper';
import { RequestContext } from 'src/models/request-context.model';

interface AuditLogFields {
  userId: string;
  organizationId: string;
  resourceId: string;
  resourceType: ResourceTypes;
  actionType: ActionTypes;
  resourceName?: string;
  metadata?: object;
}

export class AuditLoggerService {
  public async perform(
    {
      userId,
      organizationId,
      resourceId,
      resourceType,
      actionType,
      resourceName = null,
      metadata = {},
    }: AuditLogFields,
    manager?: EntityManager
  ): Promise<AuditLog> {
    return await dbTransactionWrap(async (manager) => {
      const request = RequestContext?.currentContext?.req;
      const clientIp = (request as any)?.clientIp;
      return await manager.save(
        manager.create(AuditLog, {
          userId,
          organizationId,
          resourceId,
          resourceType,
          actionType,
          resourceName,
          ipAddress: clientIp || requestIp.getClientIp(request),
          metadata: {
            userAgent: request?.headers['user-agent'],
            tooljetVersion: globalThis.TOOLJET_VERSION,
            ...metadata,
          },
        })
      );
    }, manager);
  }
}
