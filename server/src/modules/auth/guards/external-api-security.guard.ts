import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LICENSE_FIELD } from '@modules/licensing/constants';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { AppsRepository } from '@modules/apps/repository';
@Injectable()
export class ExternalApiSecurityGuard implements CanActivate {
  constructor(
    protected configService: ConfigService,
    protected licenseTermsService: LicenseTermsService,
    protected appRepository: AppsRepository
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    // Check if external API is enabled
    const hasLicense = await this.licenseTermsService.getLicenseTermsInstance(LICENSE_FIELD.EXTERNAL_API);
    const isConfigEnabled = this.configService.get<string>('ENABLE_EXTERNAL_API') === 'true';
    if (!isConfigEnabled) {
      throw new ForbiddenException('External API is disabled');
    }
    if (!hasLicense) {
      throw new ForbiddenException('You do not have access to this resource');
    }
    // // Check the authorization header
    const authHeader = request.headers['authorization'];
    const externalApiAccessToken = this.configService.get<string>('EXTERNAL_API_ACCESS_TOKEN');

    if (!authHeader || authHeader !== `Basic ${externalApiAccessToken}`) {
      throw new ForbiddenException('Unauthorized');
    }

    return true;
  }
}
