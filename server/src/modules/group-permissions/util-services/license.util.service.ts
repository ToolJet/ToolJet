import { IGroupPermissionsLicenseUtilService } from '../interfaces/IUtilService';

export class GroupPermissionLicenseUtilService implements IGroupPermissionsLicenseUtilService {
  async isValidLicense(organizationId?: string): Promise<boolean> {
    return true;
  }
  async isFeatureEnabled(organizationId?: string): Promise<boolean> {
    return true;
  }
  async isRestrictedPlan(organizationId: string): Promise<boolean> {
    return false;
  }
}
