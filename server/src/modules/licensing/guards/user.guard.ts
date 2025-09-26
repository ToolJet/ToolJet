import { Injectable, CanActivate, ExecutionContext, HttpException } from '@nestjs/common';
import { LicenseTermsService } from '../interfaces/IService';
import { LicenseCountsService } from '../services/count.service';
import { LICENSE_FIELD, LICENSE_LIMIT } from '../constants';
import { DataSource } from 'typeorm';

@Injectable()
export class UserCountGuard implements CanActivate {
  constructor(
    protected licenseTermsService: LicenseTermsService,
    protected licenseCountsService: LicenseCountsService,
    protected _dataSource: DataSource
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const organizationId = request.body.organizationId;
    const totalUsers = organizationId
      ? await this.licenseTermsService.getLicenseTerms(LICENSE_FIELD.TOTAL_USERS, organizationId)
      : await this.licenseTermsService.getLicenseTermsInstance(LICENSE_FIELD.TOTAL_USERS);
    if (
      totalUsers !== LICENSE_LIMIT.UNLIMITED &&
      (await this.licenseCountsService.getUsersCount(organizationId, true)) >= totalUsers
    ) {
      throw new HttpException('License violation - Maximum user limit reached', 451);
    }
    return true;
  }
}
