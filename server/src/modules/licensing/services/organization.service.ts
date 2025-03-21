import { EntityManager } from 'typeorm';
import { LicenseCountsService } from './count.service';
import { LICENSE_FIELD, LICENSE_LIMIT, LICENSE_LIMITS_LABEL } from '@modules/licensing/constants';
import { HttpException, Injectable } from '@nestjs/common';
import { LicenseTermsService } from '../interfaces/IService';
import { dbTransactionWrap } from '@helpers/database.helper';
import { generatePayloadForLimits } from '../helper';
import { ILicenseOrganizationService } from '../interfaces/IService';

@Injectable()
export class LicenseOrganizationService implements ILicenseOrganizationService {
  constructor(
    protected readonly licenseTermsService: LicenseTermsService,
    protected readonly licenseCountsService: LicenseCountsService
  ) {}

  async validateOrganization(manager: EntityManager): Promise<void> {
    const workspacesCount = await this.licenseTermsService.getLicenseTerms(LICENSE_FIELD.WORKSPACES);

    if (workspacesCount === LICENSE_LIMIT.UNLIMITED) {
      return;
    }

    if ((await this.licenseCountsService.organizationsCount(manager)) > workspacesCount) {
      throw new HttpException('You have reached your limit for number of workspaces.', 451);
    }
  }

  async limit(manager?: EntityManager): Promise<void> {
    const licenseTerms = await this.licenseTermsService.getLicenseTerms(LICENSE_FIELD.WORKSPACES);

    return await dbTransactionWrap(async (manager: EntityManager) => {
      return {
        workspacesCount: generatePayloadForLimits(
          licenseTerms[LICENSE_FIELD.WORKSPACES] !== LICENSE_LIMIT.UNLIMITED
            ? await this.licenseCountsService.organizationsCount(manager)
            : 0,
          licenseTerms[LICENSE_FIELD.WORKSPACES],
          licenseTerms[LICENSE_FIELD.STATUS],
          LICENSE_LIMITS_LABEL.WORKSPACES
        ),
      };
    }, manager);
  }
}
