import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGroupDataSourceTable1721716629902 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
    CREATE TABLE IF NOT EXISTS group_data_sources (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        data_source_id UUID,
        data_sources_group_permissions_id UUID,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_data_source_id FOREIGN KEY (data_source_id) REFERENCES data_sources(id) ON DELETE CASCADE,
        CONSTRAINT fk_data_sources_permissions_id FOREIGN KEY (data_sources_group_permissions_id) REFERENCES data_sources_group_permissions(id) ON DELETE CASCADE
);
            `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS group_data_sources`);
  }
}
