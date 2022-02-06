import { InjectRepository } from '@nestjs/typeorm';
import { ActionTypes, AuditLog, ResourceTypes } from 'src/entities/audit_log.entity';
import { Repository } from 'typeorm';

import * as requestIp from 'request-ip';

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
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>
  ) {}

  public async perform({
    request,
    userId,
    organizationId,
    resourceId,
    resourceType,
    actionType,
    resourceName = null,
    metadata = {},
  }: AuditLogFields): Promise<AuditLog> {
    return await this.auditLogRepository.save(
      this.auditLogRepository.create({
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
  }
}
