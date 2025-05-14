import { LicenseUpdateDto } from '../dto';

export interface ILicenseUtilService {
  validateHostnameSubpath(domainsList: any[]): void;
  validateLicenseUsersCount(licenseUsers: any): Promise<boolean>;
  validateLicenseAppsCount(appCount: number): Promise<boolean>;
  updateLicense(dto: LicenseUpdateDto): Promise<void>;
}
