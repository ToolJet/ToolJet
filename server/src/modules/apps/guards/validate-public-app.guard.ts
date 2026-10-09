import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { LICENSE_FIELD } from '@modules/licensing/constants';
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
      const isPublicAppEnabled = await this.licenseTermsService.getLicenseTerms(
        LICENSE_FIELD.PUBLIC_APP,
        app.organizationId
      );
      if (!isPublicAppEnabled) {
        throw new ForbiddenException('public-app-plan-restricted');
      }
    }

    return true;
  }
}
