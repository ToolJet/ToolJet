import { Injectable, CanActivate, ExecutionContext, HttpException } from '@nestjs/common';
import License from '../configs/License';

@Injectable()
export class AuditLogGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!License.Instance.auditLog) {
      throw new HttpException('Audit log not enabled', 451);
    }
    return true;
  }
}
