import { Injectable, CanActivate, ExecutionContext, HttpException, BadRequestException } from '@nestjs/common';
import { LICENSE_FIELD, LICENSE_LIMIT } from '@modules/licensing/constants';
import { LicenseTermsService } from '../interfaces/IService';
import { EntityManager } from 'typeorm';
import { dbTransactionWrap } from '@helpers/database.helper';
import { App } from '@entities/app.entity';
import { APP_TYPES } from '@modules/apps/constants';
import { getTooljetEdition } from '@helpers/utils.helper';
import { TOOLJET_EDITIONS } from '@modules/app/constants';
import { WORKSPACE_STATUS } from '@modules/users/constants/lifecycle';

@Injectable()
export class AppCountGuard implements CanActivate {
  constructor(protected licenseTermsService: LicenseTermsService) {}

  //Dependancy error using licenseCountsService need to check
  async fetchTotalAppCount(manager: EntityManager, organizationId: string): Promise<number> {
    const edition: TOOLJET_EDITIONS = getTooljetEdition() as TOOLJET_EDITIONS;
    const whereCondition: any = {
      type: APP_TYPES.FRONT_END,
      organization: {
        status: WORKSPACE_STATUS.ACTIVE,
      },
    };
    // Fetch apps using organization ID only for cloud
    if (edition === TOOLJET_EDITIONS.Cloud) {
      if (!organizationId) {
        throw new BadRequestException('Invalid Organization Id');
      }
      whereCondition.organization.id = organizationId;
    }
    const apps = await manager.find(App, {
      where: whereCondition,
      relations: ['organization'],
    });

    return apps.length;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const organizationId = request?.user?.organizationId;
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const appCount = await this.licenseTermsService.getLicenseTerms(LICENSE_FIELD.APP_COUNT, organizationId);

      if (appCount === LICENSE_LIMIT.UNLIMITED) {
        return true;
      }

      if ((await this.fetchTotalAppCount(manager, organizationId)) >= appCount) {
        throw new HttpException('You have reached your maximum limit for apps.', 451);
      }

      return true;
    });
  }
}
