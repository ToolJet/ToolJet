import { BadRequestException, Injectable } from '@nestjs/common';
import { generatePayloadForLimits } from '../helper';
import { LicenseTermsService } from '../interfaces/IService';
import { LICENSE_FIELD, LICENSE_LIMIT, LICENSE_LIMITS_LABEL } from '../constants';
import { LicenseCountsService } from './count.service';
import { dbTransactionWrap } from '@helpers/database.helper';
import { EntityManager } from 'typeorm';
import { ILicenseWorkflowsService } from '../interfaces/IService';

@Injectable()
export class LicenseWorkflowsService implements ILicenseWorkflowsService {
  constructor(
    protected readonly licenseTermsService: LicenseTermsService,
    protected readonly licenseCountService: LicenseCountsService
  ) {}
  async getWorkflowLimit(params: { limitFor: string; workspaceId?: string }) {
    if (params.limitFor === 'workspace' && !params.workspaceId) {
      throw new BadRequestException(`workspaceId is doesn't exist`);
    }

    const licenseTerms = await this.licenseTermsService.getLicenseTerms([
      LICENSE_FIELD.WORKFLOWS,
      LICENSE_FIELD.STATUS,
    ]);
    const totalCount =
      params.limitFor === 'workspace'
        ? licenseTerms[LICENSE_FIELD.WORKFLOWS].workspace.total
        : licenseTerms[LICENSE_FIELD.WORKFLOWS].instance.total;

    return await dbTransactionWrap(async (manager: EntityManager) => {
      return {
        appsCount: generatePayloadForLimits(
          totalCount !== LICENSE_LIMIT.UNLIMITED
            ? await this.licenseCountService.fetchTotalWorkflowsCount(
                params.limitFor === 'workspace' ? params?.workspaceId ?? '' : '',
                manager
              )
            : 0,
          totalCount,
          licenseTerms[LICENSE_FIELD.STATUS],
          LICENSE_LIMITS_LABEL.WORKFLOWS
        ),
      };
    });
  }
}
