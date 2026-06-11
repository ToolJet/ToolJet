import { OrganizationsLicense } from '@entities/organization_license.entity';

export interface IEmailUtilService {
  retrieveWhiteLabelSettings(): Promise<any>;
  retrieveSmtpSettings(): Promise<any>;
  licenseUpdateEmailInternal(
    oldOrganizationLicense: OrganizationsLicense,
    newOrganizationLicense: Partial<OrganizationsLicense>,
    period: { start: Date; end: Date }
  ): Promise<any>;
}
