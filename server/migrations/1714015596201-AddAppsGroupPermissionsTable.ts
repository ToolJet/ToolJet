import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAppsGroupPermissionsTable1714015596201 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
        CREATE TABLE IF NOT EXISTS apps_group_permissions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            granular_permission_id UUID,
            can_edit BOOLEAN DEFAULT false,
            can_view BOOLEAN DEFAULT false,
            hide_from_dashboard BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_granular_permission_id FOREIGN KEY (granular_permission_id) REFERENCES granular_permissions(id) ON DELETE CASCADE
        );
            `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS apps_group_permissions`);
  }
}
