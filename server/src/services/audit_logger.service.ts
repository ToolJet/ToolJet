import { ActionTypes, AuditLog, ResourceTypes } from 'src/entities/audit_log.entity';
import { EntityManager } from 'typeorm';
import * as requestIp from 'request-ip';
import { dbTransactionWrap } from 'src/helpers/utils.helper';
import { RequestContext } from 'src/models/request-context.model';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { Inject } from '@nestjs/common';
import { auditlog } from 'src/helpers/logger.helper';
import { LicenseService } from './license.service';
import { LICENSE_FIELD } from 'src/helpers/license.helper';
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
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private licenseService: LicenseService
  ) {}
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
      const logData = {
        userId,
        organizationId,
        resourceId,
        resourceType,
        actionType,
        resourceName,
        ipAddress: clientIp || (request && requestIp.getClientIp(request)),
        metadata: {
          userAgent: request?.headers['user-agent'],
          tooljetVersion: globalThis.TOOLJET_VERSION,
          ...metadata,
        },
      };

      const auditLogsEnabled = await this.licenseService.getLicenseTerms(LICENSE_FIELD.AUDIT_LOGS);
      if (auditLogsEnabled) {
        const logDataWrapper = auditlog(logData);
        this.logger.info(
          `PERFORM ${logData.actionType} OF ${logData.resourceName} ${logData.resourceType}`,
          logDataWrapper
        );
      }

      return await manager.save(manager.create(AuditLog, logData));
    }, manager);
  }
}
