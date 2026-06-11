import { IGroupPermissionsLicenseUtilService, IPromoteAndReleaseFeatures } from '../interfaces/IUtilService';

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

  async isPromoteAndReleaseEnabled(organizationId: string): Promise<IPromoteAndReleaseFeatures> {
    return { promote: false, release: false };
  }

  async isCustomGroupsEnabled(organizationId: string): Promise<boolean> {
    return false;
  }
}
