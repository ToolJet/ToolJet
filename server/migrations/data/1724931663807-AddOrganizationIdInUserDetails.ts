import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrganizationIdInUserDetails1724931663807 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE user_details 
            SET organization_id = (SELECT organization_id FROM users WHERE users.id = user_details.user_id)`
    );

    //delete records where organization_id is still null
    await queryRunner.query(`
      DELETE FROM "user_details" 
      WHERE "organization_id" IS NULL
    `);

    //after data is populated, make the column non-nullable
    await queryRunner.query(`
      ALTER TABLE "user_details"
      ALTER COLUMN "organization_id" SET NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
