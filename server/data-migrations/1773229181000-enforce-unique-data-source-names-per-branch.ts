import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnforceUniqueDataSourceNamesPerBranch1773229181000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const manager = queryRunner.manager;

    // Total count
    const [{ total }] = await manager.query(`SELECT COUNT(*) as total FROM data_source_versions`);
    console.log(`[START] Enforce unique data source names | Total records: ${total}`);

    // Conflicts for idx_unique_active_name_branch (is_active=true, is_default=false)
    const branchConflicts = await manager.query(`
      SELECT 
        name,
        COALESCE(branch_id::text, 'NULL') as branch_id,
        COUNT(*) as count
      FROM data_source_versions
      WHERE is_active = true AND is_default = false
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
      WHERE is_active = true AND is_default = false
    `);

    // Conflicts for idx_unique_default_name_org (is_active=true, is_default=true)
    const orgConflicts = await manager.query(`
      SELECT 
        name,
        COALESCE(branch_id::text, 'NULL') as branch_id,
        organization_id,
        COUNT(*) as count
      FROM data_source_versions
      WHERE is_active = true AND is_default = true
      GROUP BY LOWER(name), organization_id, name, branch_id
      HAVING COUNT(*) > 1
    `);
    console.log(`[INFO] Conflicts for idx_unique_default_name_org: ${orgConflicts.length}`);
    for (const row of orgConflicts) {
      console.log(
        `  - name: "${row.name}", branch_id: ${row.branch_id}, org_id: ${row.organization_id}, count: ${row.count}`
      );
    }

    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_unique_default_name_org
      ON data_source_versions (
        LOWER(name),
        organization_id
      )
      WHERE is_active = true AND is_default = true
    `);

    console.log(`[SUCCESS] Unique indexes created successfully.`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_unique_default_name_org
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_unique_active_name_branch
    `);
  }
}
