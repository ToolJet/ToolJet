// migration-lint: allow-destructive released code never writes these columns, so they stay NULL and the FKs cannot reject its writes
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCreatedByAndUpdatedByToOrganizationConstants1793874160728 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "organization_constants" ADD COLUMN IF NOT EXISTS "created_by" uuid`);
    await queryRunner.query(`ALTER TABLE "organization_constants" ADD COLUMN IF NOT EXISTS "updated_by" uuid`);
    await queryRunner.query(`
      ALTER TABLE "organization_constants"
      ADD CONSTRAINT "FK_organization_constants_created_by"
      FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "organization_constants"
      ADD CONSTRAINT "FK_organization_constants_updated_by"
      FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "organization_constants" DROP CONSTRAINT IF EXISTS "FK_organization_constants_updated_by"`
    );
    await queryRunner.query(
      `ALTER TABLE "organization_constants" DROP CONSTRAINT IF EXISTS "FK_organization_constants_created_by"`
    );
    await queryRunner.query(`ALTER TABLE "organization_constants" DROP COLUMN IF EXISTS "updated_by"`);
    await queryRunner.query(`ALTER TABLE "organization_constants" DROP COLUMN IF EXISTS "created_by"`);
  }
}
