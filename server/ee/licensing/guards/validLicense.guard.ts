import { Injectable, CanActivate, ExecutionContext, HttpException } from '@nestjs/common';
import { LicenseService } from '@services/license.service';
import { LICENSE_FIELD } from 'src/helpers/license.helper';

@Injectable()
export class ValidateLicenseGuard implements CanActivate {
  constructor(private licenseService: LicenseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const organizationId = request.headers['tj-workspace-id'];
    if (!(await this.licenseService.getLicenseTerms(LICENSE_FIELD.VALID, organizationId))) {
      throw new HttpException('Not allowed in basic plan', 451);
    }
    return true;
  }
}
