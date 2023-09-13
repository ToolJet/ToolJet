import { Injectable, CanActivate, ExecutionContext, HttpException } from '@nestjs/common';
import { LicenseService } from '@services/license.service';
import { LICENSE_FIELD } from 'src/helpers/license.helper';

@Injectable()
export class LicenseExpiryGuard implements CanActivate {
  constructor(private licenseService: LicenseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (await this.licenseService.getLicenseTerms(LICENSE_FIELD.VALID)) {
      throw new HttpException('License expired', 451);
    }
    return true;
  }
}
