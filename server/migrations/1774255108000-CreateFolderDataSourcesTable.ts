import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDataSourceFoldersTable1774255108000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add creator_id column to folders table
    await queryRunner.query(
      `ALTER TABLE folders ADD COLUMN creator_id UUID REFERENCES users(id) ON DELETE SET NULL`
    );

    // Create data_source_folders join table
    await queryRunner.query(`
      CREATE TABLE data_source_folders (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        folder_id UUID NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
        data_source_id UUID NOT NULL REFERENCES data_sources(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT data_source_folder_unique UNIQUE (folder_id, data_source_id)
      )
    `);

    await queryRunner.query(`CREATE INDEX idx_data_source_folders_folder_id ON data_source_folders(folder_id)`);
    await queryRunner.query(`CREATE INDEX idx_data_source_folders_data_source_id ON data_source_folders(data_source_id)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS data_source_folders`);
    await queryRunner.query(`ALTER TABLE folders DROP COLUMN IF EXISTS creator_id`);
  }
}
