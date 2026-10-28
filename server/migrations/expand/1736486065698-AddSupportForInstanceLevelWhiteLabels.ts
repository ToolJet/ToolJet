import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSupportForInstanceLevelWhiteLabels1736486065698 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Make 'organization_id' nullable
    await queryRunner.query(`
        ALTER TABLE "white_labelling"
        ALTER COLUMN "organization_id" DROP NOT NULL;
      `);

    // Remove the current unique constraint from 'organization_id'
    await queryRunner.query(`
          ALTER TABLE "white_labelling" DROP CONSTRAINT IF EXISTS "UQ_organization_id";
        `);

    // Add a partial unique index for 'organization_id' to allow a single row with NULL
    await queryRunner.query(`
          CREATE UNIQUE INDEX "UQ_organization_id_nullable" 
          ON "white_labelling" ("organization_id")
          WHERE "organization_id" IS NOT NULL;
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove the partial unique index
    await queryRunner.query(`
          DROP INDEX "UQ_organization_id_nullable";
        `);

    // Reinstate the original unique constraint on 'organization_id'
    await queryRunner.query(`
          ALTER TABLE "white_labelling" ADD CONSTRAINT "UQ_organization_id" UNIQUE ("organization_id");
        `);
  }
}
