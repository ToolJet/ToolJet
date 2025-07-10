import { Injectable } from '@nestjs/common';
import { LICENSE_FIELD, ORGANIZATION_INSTANCE_KEY } from '@modules/licensing/constants';
import { LicenseInitService } from '../interfaces/IService';
import { LicenseTermsService as ILicenseTermsService } from '../interfaces/IService';
import License from '../configs/License';
@Injectable()
export class LicenseTermsService extends ILicenseTermsService {
  constructor(protected readonly licenseInitService: LicenseInitService) {
    super(licenseInitService);
  }

  async getLicenseTermsInstance(type: LICENSE_FIELD | LICENSE_FIELD[]): Promise<any> {
    return this.getLicenseTerms(type, ORGANIZATION_INSTANCE_KEY);
  }

  // This function should be called to get a specific license term
  async getLicenseTerms(type: LICENSE_FIELD | LICENSE_FIELD[], organizationId: string): Promise<any> {
    await this.licenseInitService.init();

    if (Array.isArray(type)) {
      const result: any = {};

      type.forEach(async (key) => {
        result[key] = this.licenseInitService.getLicenseFieldValue(key, License.Instance());
      });

      return result;
    }
    return this.licenseInitService.getLicenseFieldValue(type, License.Instance());
  }
  async getOrganizationLicense(organizationId: string): Promise<any> {
    return null;
  }
}
