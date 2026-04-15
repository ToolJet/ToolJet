import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnforceUniqueDataSourceNamesPerBranch1773229181000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const manager = queryRunner.manager;

    // Total count
    const [{ total }] = await manager.query(`SELECT COUNT(*) as total FROM data_source_versions`);
    console.log(`[START] Enforce unique data source names | Total records: ${total}`);

    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_unique_active_name_branch
      ON data_source_versions (
        LOWER(name),
        COALESCE(branch_id, '00000000-0000-0000-0000-000000000000')
      )
      WHERE is_active = true AND is_default = false AND app_version_id IS NULL
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_unique_name_app_version
      ON data_source_versions (
        LOWER(name),
        app_version_id
      )
      WHERE is_active = true AND app_version_id IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_unique_default_name
      ON data_source_versions (
        data_source_id
      )
      WHERE is_active = true AND is_default = true
    `);

    console.log(`[SUCCESS] Unique indexes created successfully.`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_unique_default_name
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_unique_name_app_version
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_unique_active_name_branch
    `);
  }
}
