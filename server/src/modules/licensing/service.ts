import { Injectable, HttpException } from '@nestjs/common';
import { PLAN_DETAILS } from './constants';
import { ILicenseService } from './interfaces/IService';
import { User } from '@entities/user.entity';

@Injectable()
export class LicenseService implements ILicenseService {
  getLicense(): Promise<any> {
    throw new Error('Method not implemented.');
  }
  getFeatureAccess(organizationId?: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
  getDomains(organizationId?: string): Promise<{ domains: any; licenseStatus: any }> {
    throw new Error('Method not implemented.');
  }
  getLicenseTerms(organizationId?: string): Promise<{ terms: any }> {
    throw new Error('Method not implemented.');
  }
  updateLicense(dto: any, user: User): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async plans(): Promise<{ plans: any }> {
    try {
      /* TODO API request to the cloud server to a specific version license plans */
    } catch {
      throw new HttpException('Failed to fetch plans', 500);
    }
    return { plans: PLAN_DETAILS };
  }
}
