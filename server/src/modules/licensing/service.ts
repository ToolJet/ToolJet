import { Injectable, HttpException } from '@nestjs/common';
import { PLAN_DETAILS } from './constants';
import { ILicenseService } from './interfaces/IService';

@Injectable()
export class LicenseService implements ILicenseService {
  getLicense(): Promise<any> {
    throw new Error('Method not implemented.');
  }
  getFeatureAccess(): Promise<any> {
    throw new Error('Method not implemented.');
  }
  getDomains(): Promise<{ domains: any; licenseStatus: any }> {
    throw new Error('Method not implemented.');
  }
  getLicenseTerms(): Promise<{ terms: any }> {
    throw new Error('Method not implemented.');
  }
  updateLicense(dto: any): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async plans(): Promise<{ plans: any }> {
    try {
      /* TODO API request to the cloud server to a specific version license plans */
    } catch (error) {
      throw new HttpException('Failed to fetch plans', 500);
    }
    return { plans: PLAN_DETAILS };
  }
}
