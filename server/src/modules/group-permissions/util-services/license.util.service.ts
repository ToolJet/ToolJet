import { IGroupPermissionsLicenseUtilService } from '../interfaces/IUtilService';

export class GroupPermissionLicenseUtilService implements IGroupPermissionsLicenseUtilService {
  async isValidLicense(organizationId?: string): Promise<boolean> {
    return true;
  }
}
