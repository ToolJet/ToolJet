import { Injectable, CanActivate, ExecutionContext, HttpException } from '@nestjs/common';
import { LICENSE_FIELD, LICENSE_LIMIT } from '@modules/licensing/constants';
import { LicenseTermsService } from '../interfaces/IService';
import { EntityManager } from 'typeorm';
import { dbTransactionWrap } from '@helpers/database.helper';
import { App } from '@entities/app.entity';
import { APP_TYPES } from '@modules/apps/constants';

@Injectable()
export class AppCountGuard implements CanActivate {
  constructor(protected licenseTermsService: LicenseTermsService) {}

  //Dependancy error using licenseCountsService need to check
  async fetchTotalAppCount(manager: EntityManager): Promise<number> {
    const apps = await manager.find(App, {
      where: {
        type: APP_TYPES.FRONT_END,
        organization: {
          status: 'active',
        },
      },
      relations: ['organization'],
    });

    return apps.length;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const appCount = await this.licenseTermsService.getLicenseTerms(LICENSE_FIELD.APP_COUNT);

      if (appCount === LICENSE_LIMIT.UNLIMITED) {
        return true;
      }

      if ((await this.fetchTotalAppCount(manager)) >= appCount) {
        throw new HttpException('You have reached your maximum limit for apps.', 451);
      }

      return true;
    });
  }
}
