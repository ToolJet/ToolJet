import { Injectable } from '@nestjs/common';
import { LicenseUpdateDto } from './dto';
import { ILicenseUtilService } from './interfaces/IUtilService';

@Injectable()
export class LicenseUtilService implements ILicenseUtilService {
  validateHostnameSubpath(domainsList: any[]): void {
    return;
  }
  validateLicenseUsersCount(licenseUsers: any): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  validateLicenseAppsCount(appCount: number): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  updateLicense(dto: LicenseUpdateDto): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
