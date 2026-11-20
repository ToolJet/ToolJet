import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDataSourcesGroupPermissionsTable1721716375696 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
        CREATE TABLE IF NOT EXISTS data_sources_group_permissions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            granular_permission_id UUID,
            can_configure BOOLEAN DEFAULT false,
            can_use BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_granular_permission_id FOREIGN KEY (granular_permission_id) REFERENCES granular_permissions(id) ON DELETE CASCADE
        );
            `
    );

    await queryRunner.query(
      `CREATE INDEX idx_ds_granular_permission_id ON data_sources_group_permissions(granular_permission_id);`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS data_sources_group_permissions`);
  }
}
