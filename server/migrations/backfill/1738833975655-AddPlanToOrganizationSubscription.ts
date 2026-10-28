import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPlanToOrganizationSubscription1738833975655 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE organization_subscriptions 
            ADD COLUMN plan VARCHAR(200) NULL DEFAULT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE organization_subscriptions DROP COLUMN IF EXISTS plan');
  }
}
