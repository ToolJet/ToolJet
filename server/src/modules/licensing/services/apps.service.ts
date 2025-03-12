import { Injectable } from '@nestjs/common';
import { generatePayloadForLimits } from '../helper';
import { LicenseTermsService } from '../interfaces/IService';
import { LICENSE_FIELD, LICENSE_LIMIT, LICENSE_LIMITS_LABEL } from '../constants';
import { LicenseCountsService } from './count.service';
import { dbTransactionWrap } from '@helpers/database.helper';
import { EntityManager } from 'typeorm';
import { ILicenseAppsService } from '../interfaces/IService';

@Injectable()
export class LicenseAppsService implements ILicenseAppsService {
  constructor(
    protected readonly licenseTermsService: LicenseTermsService,
    protected readonly licenseCountService: LicenseCountsService
  ) {}
  async getAppsLimit() {
    const licenseTerms = await this.licenseTermsService.getLicenseTerms([
      LICENSE_FIELD.APP_COUNT,
      LICENSE_FIELD.STATUS,
    ]);
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return {
        appsCount: generatePayloadForLimits(
          licenseTerms[LICENSE_FIELD.APP_COUNT] !== LICENSE_LIMIT.UNLIMITED
            ? await this.licenseCountService.fetchTotalAppCount(manager)
            : 0,
          licenseTerms[LICENSE_FIELD.APP_COUNT],
          licenseTerms[LICENSE_FIELD.STATUS],
          LICENSE_LIMITS_LABEL.APPS
        ),
      };
    });
  }
}
