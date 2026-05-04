import { Injectable } from '@nestjs/common';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { LICENSE_FIELD } from '@modules/licensing/constants';
import { HealthResponse, IAppService } from './interfaces/IService';

@Injectable()
export class AppService implements IAppService {
  constructor(private readonly licenseTermsService: LicenseTermsService) {}

  async getHealth(): Promise<HealthResponse> {
    const licenseStatus = await this.licenseTermsService.getLicenseTermsInstance(LICENSE_FIELD.STATUS);

    return {
      works: 'yeah',
      license: {
        valid: licenseStatus?.isLicenseValid ?? false,
        expired: licenseStatus?.isExpired ?? true,
      },
    };
  }
}
