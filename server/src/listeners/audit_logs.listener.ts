import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AuditLoggerService } from '@services/audit_logger.service';
import { Logger } from 'nestjs-pino';
import { ActionTypes, ResourceTypes } from 'src/entities/audit_log.entity';

@Injectable()
export class AuditLogsListener {
  constructor(private auditLoggerService: AuditLoggerService, private readonly logger: Logger) {}

  @OnEvent('auditLogEntry')
  async handleAuditLogEntry(args: {
    userId: string;
    organizationId: string;
    resourceId: string;
    resourceName: string;
    resourceType: ResourceTypes;
    actionType: ActionTypes;
    metadata: object;
  }) {
    const { userId, organizationId, resourceId, resourceName, resourceType, actionType, metadata } = args;

    try {
      await this.auditLoggerService.perform({
        userId,
        organizationId,
        resourceId,
        resourceName,
        resourceType,
        actionType,
        metadata,
      });
    } catch (error) {
      this.logger.error('Audit log entry failed with error:', error);
    }
  }
}
