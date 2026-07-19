import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { LICENSE_FIELD } from '@modules/licensing/constants';

@Injectable()
export class ValidatePublicAppGuard implements CanActivate {
  constructor(protected readonly licenseTermsService: LicenseTermsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const app = request.tj_app;

    if (!app?.isPublic) {
      return true;
    }

    // Live-checked against the current license on every access, regardless of edition,
    // so a downgraded/expired plan blocks access immediately without needing the
    // app's is_public flag to be rewritten.
    const isAppPublicLicensed = await this.licenseTermsService.getLicenseTerms(
      LICENSE_FIELD.APP_PUBLIC,
      app.organizationId
    );

    if (!isAppPublicLicensed) {
      throw new ForbiddenException('public-app-plan-restricted');
    }

    return true;
  }
}
