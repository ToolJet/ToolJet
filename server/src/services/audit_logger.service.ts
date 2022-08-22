import { ActionTypes, AuditLog, ResourceTypes } from 'src/entities/audit_log.entity';
import { EntityManager } from 'typeorm';

import * as requestIp from 'request-ip';
import { dbTransactionWrap } from 'src/helpers/utils.helper';

interface AuditLogFields {
  request: any;
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
      request,
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
      return await manager.save(
        manager.create(AuditLog, {
          userId,
          organizationId,
          resourceId,
          resourceType,
          actionType,
          resourceName,
          ipAddress: request.clientIp || requestIp.getClientIp(request),
          metadata: {
            userAgent: request.headers['user-agent'],
            tooljetVersion: globalThis.TOOLJET_VERSION,
            ...metadata,
          },
        })
      );
    }, manager);
  }
}
