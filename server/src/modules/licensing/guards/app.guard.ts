import { Injectable, CanActivate, ExecutionContext, HttpException } from '@nestjs/common';
import { LICENSE_FIELD, LICENSE_LIMIT } from '@modules/licensing/constants';
import { LicenseTermsService } from '../interfaces/IService';
import { AppsRepository } from '@modules/apps/repository';

@Injectable()
export class AppCountGuard implements CanActivate {
  constructor(protected licenseTermsService: LicenseTermsService, protected appsRepository: AppsRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const appCount = await this.licenseTermsService.getLicenseTerms(LICENSE_FIELD.APP_COUNT);
    if (appCount === LICENSE_LIMIT.UNLIMITED) {
      return true;
    }

    if (
      (await this.appsRepository.count({
        where: {
          type: 'front-end',
        },
      })) >= appCount
    ) {
      throw new HttpException('You have reached your maximum limit for apps.', 451);
    }
    return true;
  }
}
