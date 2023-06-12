import { Injectable, CanActivate, ExecutionContext, HttpException } from '@nestjs/common';
import { LicenseService } from '@services/license.service';
import { LICENSE_FIELD } from 'src/helpers/license.helper';

@Injectable()
export class AuditLogGuard implements CanActivate {
  constructor(private licenseService: LicenseService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!(await this.licenseService.getLicenseTerms(LICENSE_FIELD.AUDIT_LOGS))) {
      throw new HttpException('Audit log not enabled', 451);
    }
    return true;
  }
}
