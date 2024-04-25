import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGroupAppsTable1714015615904 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
    CREATE TABLE IF NOT EXISTS group_apps (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        app_id UUID,
        apps_group_permissions_id UUID,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_app_id FOREIGN KEY (app_id) REFERENCES app(id) ON DELETE CASCADE,
        CONSTRAINT fk_apps_group_permissions_id FOREIGN KEY (apps_group_permissions_id) REFERENCES apps_group_permissions(id) ON DELETE CASCADE
);
            `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS group_apps`);
  }
}
