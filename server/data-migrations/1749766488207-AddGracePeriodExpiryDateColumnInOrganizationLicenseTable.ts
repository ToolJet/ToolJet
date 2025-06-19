import { getTooljetEdition } from '@helpers/utils.helper';
import { TOOLJET_EDITIONS } from '@modules/app/constants';
import { MigrationInterface, QueryRunner } from 'typeorm';
export class AddGracePeriodExpiryDateColumnInOrganizationLicenseTable1749766488207 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const edition: TOOLJET_EDITIONS = getTooljetEdition() as TOOLJET_EDITIONS;
    // If edition is not cloud, skip this migration
    if (edition !== 'cloud') {
      console.log('Migration is only restricted for cloud edition.');
      return; // Exit the migration early
    }
    await queryRunner.query('ALTER TABLE organization_license ADD COLUMN expiry_with_grace_period TIMESTAMP');

    // Update the new column with expiry_date + 14 days
    await queryRunner.query(`
            UPDATE organization_license 
            SET expiry_with_grace_period = expiry_date + INTERVAL '14 days'
        `);

    await queryRunner.query(`ALTER TABLE organization_license ALTER COLUMN expiry_with_grace_period SET NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE organization_license DROP COLUMN IF EXISTS expiry_with_grace_period');
  }
}
