import { Injectable, CanActivate, ExecutionContext, HttpException } from '@nestjs/common';
import { LicenseService } from '@services/license.service';
import { LICENSE_FIELD } from 'src/helpers/license.helper';

@Injectable()
export class LDAPGuard implements CanActivate {
  constructor(private licenseService: LicenseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const organizationId = request.organizationId;
    if (!(await this.licenseService.getLicenseTerms(LICENSE_FIELD.LDAP, organizationId))) {
      throw new HttpException('LDAP not enabled', 451);
    }
    return true;
  }
}
