import { EntityManager } from 'typeorm';
import { LicenseCountsService } from './count.service';
import { LICENSE_FIELD, LICENSE_LIMIT, LICENSE_LIMITS_LABEL } from '@modules/licensing/constants';
import { HttpException, Injectable } from '@nestjs/common';
import { LicenseTermsService } from '../interfaces/IService';
import { LicensePageService as ILicensePageService } from '../interfaces/IService';
import { dbTransactionWrap } from '@helpers/database.helper';
import { generatePayloadForLimits } from '../helper';

@Injectable()
export class LicensePageService extends ILicensePageService {
  constructor(
    protected readonly licenseTermsService: LicenseTermsService,
    protected readonly licenseCountsService: LicenseCountsService
  ) {
    super();
  }

  async validatePages(
    manager: EntityManager,
    appVersionId: string,
    organizationId: string,
    isPageGroup: boolean
  ): Promise<void> {
    if (isPageGroup) {
      const pageGroupsLimit = await this.licenseTermsService.getLicenseTerms(
        LICENSE_FIELD.APP_PAGE_GROUPS_LIMIT,
        organizationId
      );
      if (typeof pageGroupsLimit !== 'number') {
        return;
      }
      const pageGroupsCount = await this.licenseCountsService.fetchTotalPageGroupsCount(appVersionId, manager);
      if (pageGroupsCount > pageGroupsLimit) {
        throw new HttpException('You have reached your limit for number of page groups.', 451);
      }
      return;
    }

    const pagesLimit = await this.licenseTermsService.getLicenseTerms(LICENSE_FIELD.APP_PAGES_LIMIT, organizationId);
    if (typeof pagesLimit !== 'number') {
      return;
    }
    const pagesCount = await this.licenseCountsService.fetchTotalPagesCount(appVersionId, manager);
    if (pagesCount > pagesLimit) {
      throw new HttpException('You have reached your limit for number of pages.', 451);
    }
  }

  async getPagesLimit(organizationId: string): Promise<any> {
    const licenseTerms = await this.licenseTermsService.getLicenseTerms(
      [LICENSE_FIELD.APP_PAGES_LIMIT, LICENSE_FIELD.APP_PAGE_GROUPS_LIMIT, LICENSE_FIELD.STATUS],
      organizationId
    );
    const pagesLimit = licenseTerms[LICENSE_FIELD.APP_PAGES_LIMIT];
    const pageGroupsLimit = licenseTerms[LICENSE_FIELD.APP_PAGE_GROUPS_LIMIT];
    const licenseStatus = licenseTerms[LICENSE_FIELD.STATUS];

    return await dbTransactionWrap(async (manager: EntityManager) => {
      return {
        pagesCount: generatePayloadForLimits(
          typeof pagesLimit === 'number'
            ? await this.licenseCountsService.fetchMaxPagesCount(organizationId, manager)
            : 0,
          typeof pagesLimit === 'number' ? pagesLimit : LICENSE_LIMIT.UNLIMITED,
          licenseStatus,
          LICENSE_LIMITS_LABEL.PAGES
        ),
        pageGroupsCount: generatePayloadForLimits(
          typeof pageGroupsLimit === 'number'
            ? await this.licenseCountsService.fetchMaxPageGroupsCount(organizationId, manager)
            : 0,
          typeof pageGroupsLimit === 'number' ? pageGroupsLimit : LICENSE_LIMIT.UNLIMITED,
          licenseStatus,
          LICENSE_LIMITS_LABEL.PAGE_GROUPS
        ),
      };
    });
  }
}
