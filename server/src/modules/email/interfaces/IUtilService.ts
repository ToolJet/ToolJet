import { OrganizationsLicense } from '@entities/organization_license.entity';

export interface IEmailUtilService {
  retrieveWhiteLabelSettings(organizationId?: string | null): Promise<any>;
  retrieveSmtpSettings(): Promise<any>;
  sendEmailWithSettings(
    to: string | string[],
    subject: string,
    templateData: any,
    smtp: any,
    fromName: string
  ): Promise<any>;
  licenseUpdateEmailInternal(
    oldOrganizationLicense: OrganizationsLicense,
    newOrganizationLicense: Partial<OrganizationsLicense>,
    period: { start: Date; end: Date }
  ): Promise<any>;
}
