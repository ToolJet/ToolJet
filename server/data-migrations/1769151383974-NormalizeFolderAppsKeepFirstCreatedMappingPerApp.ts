import { MigrationInterface, QueryRunner } from "typeorm";

export class NormalizeFolderAppsKeepFirstCreatedMappingPerApp1769151383974 implements MigrationInterface {

public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM folder_apps
      WHERE id IN (
        SELECT id FROM (
          SELECT id,
                 ROW_NUMBER() OVER (
                   PARTITION BY app_id
                   ORDER BY created_at ASC
                 ) AS rn
          FROM folder_apps
        ) t
        WHERE t.rn > 1
      );
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uniq_folder_apps_app_id
      ON folder_apps (app_id);
    `);
}
public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS uniq_folder_apps_app_id;
    `);
    }
}
