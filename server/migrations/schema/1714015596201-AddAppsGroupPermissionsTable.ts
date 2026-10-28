import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAppsGroupPermissionsTable1714015596201 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
        CREATE TABLE IF NOT EXISTS apps_group_permissions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            granular_permission_id UUID UNIQUE NOT NULL,
            can_edit BOOLEAN DEFAULT false,
            can_view BOOLEAN DEFAULT false,
            hide_from_dashboard BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_granular_permission_id FOREIGN KEY (granular_permission_id) REFERENCES granular_permissions(id) ON DELETE CASCADE
        );
            `
    );

    await queryRunner.query(
      `CREATE INDEX idx_granular_permission_id ON apps_group_permissions(granular_permission_id);`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS apps_group_permissions`);
  }
}
