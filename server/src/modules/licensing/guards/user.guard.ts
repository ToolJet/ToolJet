import { Injectable, CanActivate, ExecutionContext, HttpException } from '@nestjs/common';
import { LicenseTermsService } from '../interfaces/IService';
import { LicenseCountsService } from '../services/count.service';
import { LICENSE_FIELD, LICENSE_LIMIT } from '../constants';

@Injectable()
export class UserCountGuard implements CanActivate {
  constructor(
    protected licenseTermsService: LicenseTermsService,
    protected licenseCountsService: LicenseCountsService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const totalUsers = await this.licenseTermsService.getLicenseTerms(LICENSE_FIELD.TOTAL_USERS);
    if (totalUsers !== LICENSE_LIMIT.UNLIMITED && (await this.licenseCountsService.getUsersCount(true)) >= totalUsers) {
      throw new HttpException('License violation - Maximum user limit reached', 451);
    }
    return true;
  }
}
