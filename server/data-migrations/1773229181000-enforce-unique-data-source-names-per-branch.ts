import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnforceUniqueDataSourceNamesPerBranch1773229181000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const manager = queryRunner.manager;

    // Total count
    const [{ total }] = await manager.query(`SELECT COUNT(*) as total FROM data_source_versions`);
    console.log(`[START] Enforce unique data source names | Total records: ${total}`);

    // Conflicts for idx_unique_active_name_branch (is_active=true, is_default=false, app_version_id IS NULL)
    const branchConflicts = await manager.query(`
      SELECT 
        name,
        COALESCE(branch_id::text, 'NULL') as branch_id,
        COUNT(*) as count
      FROM data_source_versions
      WHERE is_active = true AND is_default = false AND app_version_id IS NULL
      GROUP BY LOWER(name), COALESCE(branch_id, '00000000-0000-0000-0000-000000000000'), name, branch_id
      HAVING COUNT(*) > 1
    `);
    console.log(`[INFO] Conflicts for idx_unique_active_name_branch: ${branchConflicts.length}`);
    for (const row of branchConflicts) {
      console.log(`  - name: "${row.name}", branch_id: ${row.branch_id}, count: ${row.count}`);
    }

    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_unique_active_name_branch
      ON data_source_versions (
        LOWER(name),
        COALESCE(branch_id, '00000000-0000-0000-0000-000000000000')
      )
      WHERE is_active = true AND is_default = false AND app_version_id IS NULL
    `);

    // Conflicts for idx_unique_name_app_version (version-specific DSVs)
    const versionConflicts = await manager.query(`
      SELECT 
        name,
        app_version_id,
        COUNT(*) as count
      FROM data_source_versions
      WHERE is_active = true AND app_version_id IS NOT NULL
      GROUP BY LOWER(name), app_version_id, name
      HAVING COUNT(*) > 1
    `);
    console.log(`[INFO] Conflicts for idx_unique_name_app_version: ${versionConflicts.length}`);
    for (const row of versionConflicts) {
      console.log(`  - name: "${row.name}", app_version_id: ${row.app_version_id}, count: ${row.count}`);
    }

    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_unique_name_app_version
      ON data_source_versions (
        LOWER(name),
        app_version_id
      )
      WHERE is_active = true AND app_version_id IS NOT NULL
    `);

    // Conflicts for idx_unique_default_name (is_active=true, is_default=true)
    const defaultConflicts = await manager.query(`
      SELECT 
        name,
        COALESCE(branch_id::text, 'NULL') as branch_id,
        COUNT(*) as count
      FROM data_source_versions
      WHERE is_active = true AND is_default = true
      GROUP BY LOWER(name), name, branch_id
      HAVING COUNT(*) > 1
    `);
    console.log(`[INFO] Conflicts for idx_unique_default_name: ${defaultConflicts.length}`);
    for (const row of defaultConflicts) {
      console.log(`  - name: "${row.name}", branch_id: ${row.branch_id}, count: ${row.count}`);
    }

    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_unique_default_name
      ON data_source_versions (
        LOWER(name)
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
