import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPlanToOrganizationLicense1738759782116 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE organization_license 
        ADD COLUMN plan VARCHAR(200) NULL DEFAULT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE organization_license DROP COLUMN IF EXISTS plan');
  }
}
