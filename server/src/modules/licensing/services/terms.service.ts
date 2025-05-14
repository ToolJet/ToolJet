import { Injectable } from '@nestjs/common';
import { LICENSE_FIELD } from '@modules/licensing/constants';
import { LicenseInitService } from '../interfaces/IService';
import { LicenseTermsService as ILicenseTermsService } from '../interfaces/IService';

@Injectable()
export class LicenseTermsService extends ILicenseTermsService {
  constructor(protected readonly licenseInitService: LicenseInitService) {
    super(licenseInitService);
  }

  // This function should be called to get a specific license term
  async getLicenseTerms(type?: LICENSE_FIELD | LICENSE_FIELD[]): Promise<any> {
    await this.licenseInitService.init();

    if (Array.isArray(type)) {
      const result: any = {};

      type.forEach(async (key) => {
        result[key] = this.licenseInitService.getLicenseFieldValue(key);
      });

      return result;
    }
    return this.licenseInitService.getLicenseFieldValue(type);
  }
}
