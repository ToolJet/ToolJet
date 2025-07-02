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
    const organizationId =
      typeof request.headers['tj-workspace-id'] === 'object'
        ? request.headers['tj-workspace-id'][0]
        : request.headers['tj-workspace-id'];
    const totalUsers = await this.licenseTermsService.getLicenseTerms(LICENSE_FIELD.TOTAL_USERS, organizationId);
    
    if (
      totalUsers !== LICENSE_LIMIT.UNLIMITED &&
      (await this.licenseCountsService.getUsersCount(organizationId)) >= totalUsers
    ) {
      throw new HttpException('License violation - Maximum user limit reached', 451);
    }
    return true;
  }
}
