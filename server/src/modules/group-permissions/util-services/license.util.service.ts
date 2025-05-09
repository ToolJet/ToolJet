import { IGroupPermissionsLicenseUtilService } from '../interfaces/IUtilService';

export class GroupPermissionLicenseUtilService implements IGroupPermissionsLicenseUtilService {
  async isValidLicense(): Promise<boolean> {
    return true;
  }
}
