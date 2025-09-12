import { EntityManager } from 'typeorm';
import { AuditLogFields } from '../types';
import { User } from 'src/entities/user.entity';
import { AuditLogsQuery } from '../types';
export interface IAuditLogService {
  perform(
    { userId, organizationId, resourceId, resourceType, actionType, resourceName, metadata }: AuditLogFields,
    manager?: EntityManager
  ): Promise<void>;
  findPerPage(user: User, query: AuditLogsQuery): Promise<any>;
}
