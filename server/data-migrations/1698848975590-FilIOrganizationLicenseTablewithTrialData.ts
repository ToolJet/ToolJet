import { MigrationInterface, QueryRunner } from 'typeorm';
import { LICENSE_TYPE } from 'src/helpers/license.helper';
import { OrganizationsLicense } from 'src/entities/organization_license.entity';

export class FilIOrganizationLicenseTablewithTrialData1698848975590 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const organizations = await queryRunner.query(`SELECT id, "ownerId" AS ownerId FROM organizations`);
    const BATCH_SIZE = 1000;

    for (let i = 0; i < organizations.length; i += BATCH_SIZE) {
      const batch = organizations.slice(i, i + BATCH_SIZE);

      await entityManager.transaction(async (transactionalEntityManager) => {
        for (const org of batch) {
          const license = new OrganizationsLicense();

          license.organizationId = org.id;
          license.licenseKey = ''; // keeping it empty initially
          license.licenseType = LICENSE_TYPE.TRIAL;
          const currentDate = new Date();
          const expiryDate = new Date(currentDate);
          expiryDate.setDate(currentDate.getDate() + 14);

          license.terms = {
            expiry: expiryDate.toISOString().split('T')[0],
            type: LICENSE_TYPE.TRIAL, // Assuming 'trial' here as default
            workspaceId: org.id,
            users: {
              total: 15,
              editor: 5,
              viewer: 10,
              superadmin: 1,
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
          await transactionalEntityManager.save(OrganizationsLicense, license);
        }
      });
    }
  }
  public async down(queryRunner: QueryRunner): Promise<void> {}
}
