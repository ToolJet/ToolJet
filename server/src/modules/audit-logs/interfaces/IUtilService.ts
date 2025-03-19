import { AuditLog } from '@entities/audit_log.entity';
export interface IAuditLogUtilService {
  getData(organizationId: string, page: number, perPage: number, searchParams: any): Promise<[AuditLog[], number]>;
}
