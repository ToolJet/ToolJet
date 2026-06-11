import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { LICENSE_FIELD, LICENSE_TYPE } from '@modules/licensing/constants';
import { getTooljetEdition } from '@helpers/utils.helper';
import { TOOLJET_EDITIONS } from '@modules/app/constants';

@Injectable()
export class ValidatePublicAppGuard implements CanActivate {
  constructor(protected readonly licenseTermsService: LicenseTermsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const app = request.tj_app;

    if (!app?.isPublic) {
      return true;
    }

    if (getTooljetEdition() === TOOLJET_EDITIONS.Cloud) {
      const licenseTerms = await this.licenseTermsService.getLicenseTerms(
        [LICENSE_FIELD.STATUS, LICENSE_FIELD.PLAN],
        app.organizationId
      );
      const { licenseType } = licenseTerms[LICENSE_FIELD.STATUS] ?? {};
      const planType: string | undefined = licenseTerms[LICENSE_FIELD.PLAN];
      if (licenseType === LICENSE_TYPE.BASIC || licenseType === LICENSE_TYPE.TRIAL || planType === 'starter') {
        throw new ForbiddenException('public-app-plan-restricted');
      }
    }

    return true;
  }
}
