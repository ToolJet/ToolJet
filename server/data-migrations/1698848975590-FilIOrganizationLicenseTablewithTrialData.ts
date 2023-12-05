import { MigrationInterface, QueryRunner } from 'typeorm';
import { LICENSE_TYPE } from 'src/helpers/license.helper';
import { OrganizationsLicense } from 'src/entities/organization_license.entity';
import { MigrationProgress } from 'src/helpers/migration.helper';

const paidCustomers = [
  {
    workspaceId: 'af1d700b-cd1c-4bc1-9950-94aa2d029a14',
    type: LICENSE_TYPE.ENTERPRISE,
    expiry: 'monthly',
    email: 'znelson@nebraskachildren.org',
    builders: 2,
    viewers: 3,
    customerId: 'd683dd04-3dd8-450c-b526-3a2242e08a70',
    name: 'Administration',
  },
  {
    workspaceId: '8c00b479-d633-417e-b241-010e387c484d',
    type: LICENSE_TYPE.ENTERPRISE,
    expiry: 'monthly',
    email: 'znelson@nebraskachildren.org',
    builders: 2,
    viewers: 3,
    customerId: 'd683dd04-3dd8-450c-b526-3a2242e08a70',
    name: 'Data Collection Tools',
  },
  {
    workspaceId: 'c6d238f8-7ac7-4fb1-ae2b-f23d2753b08f',
    type: LICENSE_TYPE.ENTERPRISE,
    expiry: 'monthly',
    email: 'znelson@nebraskachildren.org',
    builders: 2,
    viewers: 3,
    customerId: 'd683dd04-3dd8-450c-b526-3a2242e08a70',
    name: 'NCFF Sandbox',
  },
  {
    workspaceId: 'ef289e8f-1c29-4076-afff-99a259512d4c',
    type: LICENSE_TYPE.ENTERPRISE,
    expiry: 'monthly',
    email: 'znelson@nebraskachildren.org',
    builders: 2,
    viewers: 3,
    customerId: 'd683dd04-3dd8-450c-b526-3a2242e08a70',
    name: 'Community Lens Database',
  },
  {
    workspaceId: '78f6eb9a-26e2-4061-8c36-fbebf10dbc37',
    expiry: '2024-11-27',
    email: 'k.szuminski@droader.com',
    builders: 2,
    viewers: 8,
    customerId: 'e682a381-20ff-4751-929c-fe7bcc36353c',
    name: 'koszty',
  },
  {
    workspaceId: '18ffa268-e2c0-4fe8-b724-5e779efba656',
    expiry: 'monthly',
    email: 'adm@intratec.us',
    builders: 1,
    viewers: 1,
    customerId: '21c6ad5d-0fab-4da0-ae81-fa44ac9b12ca',
    name: 'Marketing',
  },
  {
    workspaceId: '31189d1b-ebc7-4294-8685-6c3febbd4fe2',
    type: LICENSE_TYPE.ENTERPRISE,
    expiry: '2024-04-25',
    email: 'james.bender@bfkn.com',
    builders: 2,
    viewers: 230,
    customerId: '1013feac-b77b-446e-ba98-57373a5ab86a',
    name: 'BFKN',
  },
  {
    workspaceId: '70ebd7af-fc2c-477d-a178-fc7e4c505a07',
    expiry: 'monthly',
    email: 'scott@crozierscott.com',
    builders: 1,
    viewers: 1,
    customerId: 'd2d5b5be-31a6-4877-90a9-d27e0b2321cf',
    name: 'Crozier Scott LTD',
  },
  {
    workspaceId: '1d89c866-802d-4e0a-a9ef-05660d38a0f4',
    type: LICENSE_TYPE.ENTERPRISE,
    expiry: '2040-12-31',
    email: 'navaneeth@tooljet.com',
    builders: 20,
    viewers: 40,
    customerId: 'ddc14cb0-3d96-4d43-b736-89892170b0ac',
    name: 'ToolJet-real',
  },
];

const getMonthlySubscriptionExpiry = () => {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 30);
  return expiryDate.toISOString().split('T')[0];
};

export class FilIOrganizationLicenseTablewithTrialData1698848975590 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const organizations = await queryRunner.query(`SELECT id, owner_id, name FROM organizations`);

    const migrationProgress = new MigrationProgress(
      'FilIOrganizationLicenseTablewithTrialData1698848975590',
      paidCustomers.length
    );

    for (const org of organizations) {
      const license = new OrganizationsLicense();

      license.organizationId = org.id;
      license.licenseKey = ''; // keeping it empty initially

      const customer = paidCustomers.find((e) => e.workspaceId === org.id);

      if (customer) {
        license.licenseType = customer.type || LICENSE_TYPE.BUSINESS;

        let expiryDate = customer.expiry;

        if (expiryDate === 'monthly') {
          expiryDate = getMonthlySubscriptionExpiry();
        }

        license.expiryDate = new Date(`${expiryDate} 23:59:59`);
        license.terms = {
          expiry: expiryDate,
          type: customer.type || LICENSE_TYPE.BUSINESS,
          workspaceId: org.id,
          users: {
            total: parseInt(customer.builders + '') + parseInt(customer.viewers + ''),
            editor: customer.builders,
            viewer: customer.viewers,
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
            customerId: org.owner_id || org.id,
            customerName: org.name,
          },
        };
        if (org.name !== customer.name) {
          console.error(`Name mismatch for organization ${org.id}`);
        }
        migrationProgress.show();
      } else {
        license.licenseType = LICENSE_TYPE.TRIAL;
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 14);

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
            customerId: org.owner_id || org.id,
            customerName: org.name,
          },
        };
      }
      // Save the new license entry
      await entityManager.save(OrganizationsLicense, license);
    }
  }
  public async down(queryRunner: QueryRunner): Promise<void> {}
}
