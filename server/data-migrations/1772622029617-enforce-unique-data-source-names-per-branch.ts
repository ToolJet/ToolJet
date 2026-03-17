import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnforceUniqueDataSourceNamesPerBranch1772000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_unique_active_name_branch
      ON data_source_versions (
        LOWER(name),
        COALESCE(branch_id, '00000000-0000-0000-0000-000000000000')
      )
      WHERE is_active = true;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_unique_active_name_branch;
    `);
  }
}