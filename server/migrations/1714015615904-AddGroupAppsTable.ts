import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGroupAppsTable1714015615904 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
    CREATE TABLE IF NOT EXISTS group_apps (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        app_id UUID,
        apps_group_permissions_id UUID,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_app_id FOREIGN KEY (app_id) REFERENCES apps(id) ON DELETE CASCADE,
        CONSTRAINT fk_apps_group_permissions_id FOREIGN KEY (apps_group_permissions_id) REFERENCES apps_group_permissions(id) ON DELETE CASCADE,
        CONSTRAINT unique_app_and_permission UNIQUE (app_id, apps_group_permissions_id)
);
            `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS group_apps`);
  }
}
