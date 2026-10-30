import { MigrationInterface, QueryRunner } from 'typeorm';

const MIGRATION_NAME = 'AddLibraryStaticDataSource1792100000001';

// Gives every existing workspace the static `library` data source that library queries point at.
// New workspaces get it from DefaultDataSourceKinds (setup-organization). Mirrors
// createDefaultDataSource + createDataSourceInAllEnvironments: the data source, one data source
// version on the workspace's default branch, and empty options for every environment.
export class AddLibraryStaticDataSource1792100000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const organizations: { id: string }[] = await queryRunner.query(`
      SELECT o.id FROM organizations o
       WHERE NOT EXISTS (
         SELECT 1 FROM data_sources ds
          WHERE ds.organization_id = o.id AND ds.kind = 'library' AND ds.type = 'static'
       )`);
    const total = organizations.length;
    console.log(`${MIGRATION_NAME}: [START] Add librarydefault data source to workspaces: ${total}`);

    for (const [index, { id: organizationId }] of organizations.entries()) {
      const [{ id: dataSourceId }] = await queryRunner.query(
        `INSERT INTO data_sources (name, kind, type, scope, organization_id, created_at, updated_at)
         VALUES ('librarydefault', 'library', 'static', 'global', $1, NOW(), NOW())
         RETURNING id`,
        [organizationId]
      );

      const [defaultBranch] = await queryRunner.query(
        `SELECT id FROM organization_git_sync_branches WHERE organization_id = $1 AND is_default = true LIMIT 1`,
        [organizationId]
      );
      if (defaultBranch) {
        const [{ id: dataSourceVersionId }] = await queryRunner.query(
          `INSERT INTO data_source_versions (data_source_id, name, is_active, branch_id, created_at, updated_at)
           VALUES ($1, 'librarydefault', true, $2, NOW(), NOW())
           RETURNING id`,
          [dataSourceId, defaultBranch.id]
        );
        await queryRunner.query(
          `INSERT INTO data_source_version_options (data_source_version_id, environment_id, options, created_at, updated_at)
           SELECT $1, e.id, '{}', NOW(), NOW() FROM app_environments e WHERE e.organization_id = $2`,
          [dataSourceVersionId, organizationId]
        );
      } else {
        console.log(
          `${MIGRATION_NAME}: workspace ${organizationId} has no default branch; data source version skipped`
        );
      }

      const done = index + 1;
      console.log(`${MIGRATION_NAME}: [PROGRESS] ${done}/${total} (${Math.round((done / total) * 100)}%)`);
    }

    console.log(`${MIGRATION_NAME}: [SUCCESS] Add librarydefault data source finished.`);
  }

  public async down(): Promise<void> {
    // Keep default sources: user queries may reference them, so removing them would invalidate those queries.
  }
}
