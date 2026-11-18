import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds the `all_apps` nav item type. One `all_apps` page expands, in the released app,
 * into links to every released app the viewer can open. `group_by_folder` picks whether
 * those links are grouped under their workspace folders or listed flat.
 */
export class AddAllAppsPageType1795400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "page_type_enum" ADD VALUE IF NOT EXISTS 'all_apps'`);
    await queryRunner.query(
      `ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "group_by_folder" boolean NOT NULL DEFAULT false`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "pages" DROP COLUMN IF EXISTS "group_by_folder"`);
    // PostgreSQL cannot drop a value from an enum type, so 'all_apps' stays in page_type_enum.
  }
}
