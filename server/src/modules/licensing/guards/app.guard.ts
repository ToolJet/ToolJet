import { Injectable, CanActivate, ExecutionContext, HttpException } from '@nestjs/common';
import { LICENSE_FIELD, LICENSE_LIMIT } from '@modules/licensing/constants';
import { LicenseTermsService } from '../interfaces/IService';
import { DataSource } from 'typeorm';
import { EntityManager } from 'typeorm';

@Injectable()
export class AppCountGuard implements CanActivate {
  constructor(protected licenseTermsService: LicenseTermsService, protected readonly _dataSource: DataSource) {}

  async appsCount(manager: EntityManager): Promise<number> {
    return manager
      .createQueryBuilder('apps', 'a')
      .innerJoin('organizations', 'o', 'a.organization_id = o.id')
      .where('a.type = :type', { type: 'front-end' })
      .andWhere('o.status = :status', { status: 'active' })
      .getCount();
  } //Dependancy error using licenseCountsService

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const appCount = await this.licenseTermsService.getLicenseTerms(LICENSE_FIELD.APP_COUNT);
    if (appCount === LICENSE_LIMIT.UNLIMITED) {
      return true;
    }

    if ((await this.appsCount(this._dataSource.manager)) >= appCount) {
      throw new HttpException('You have reached your maximum limit for apps.', 451);
    }
    return true;
  }
}
