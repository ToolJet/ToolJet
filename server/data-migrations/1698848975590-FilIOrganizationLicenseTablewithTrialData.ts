import { MigrationInterface, QueryRunner } from 'typeorm';
import { LICENSE_TYPE } from 'src/helpers/license.helper';
import { OrganizationsLicense } from 'src/entities/organization_license.entity';

export class FilIOrganizationLicenseTablewithTrialData1698848975590 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const organizations = await queryRunner.query(`SELECT id FROM organizations`);

    for (const org of organizations) {
      const license = new OrganizationsLicense();

      license.organizationId = org.id;
      license.licenseKey = ''; // keeping it empty initially
      license.licenseType = LICENSE_TYPE.TRIAL;
      const currentDate = new Date();
      const expiryDate = new Date(currentDate);
      expiryDate.setDate(currentDate.getDate() + 14);

      license.expiryDate = new Date(`${expiryDate.toISOString().split('T')[0]} 23:59:59`);
      license.terms = {
        expiry: expiryDate.toISOString().split('T')[0],
        type: LICENSE_TYPE.TRIAL, // Assuming 'trial' here as default
        workspaceId: org.id,
        users: {
          total: 15,
          editor: 5,
          viewer: 10,
          superadmin: 0,
        },
        database: {
          table: '',
        },
        features: {
          oidc: true,
          auditLogs: true,
          ldap: true,
          customStyling: true,
        },
        meta: {
          generatedFrom: 'API',
          customerId: org.id,
        },
      };

      // Save the new license entry
      await entityManager.save(OrganizationsLicense, license);
    }
  }
  public async down(queryRunner: QueryRunner): Promise<void> {}
}
