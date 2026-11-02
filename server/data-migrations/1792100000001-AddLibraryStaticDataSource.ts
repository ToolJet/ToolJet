import { MigrationInterface, QueryRunner } from 'typeorm';

const MIGRATION_NAME = 'AddLibraryStaticDataSource1792100000001';
const BATCH_SIZE = 1000;

// Gives every existing workspace the static `library` data source that library queries point at.
// New workspaces get it from DefaultDataSourceKinds (setup-organization). Mirrors
// createDefaultDataSource + createDataSourceInAllEnvironments: the data source, one data source
// version on the workspace's default branch, and empty options for every environment.
// Every workspace has a default branch (1781740800000-EnsureDefaultBranchForAllOrganizations).
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

    for (let start = 0; start < total; start += BATCH_SIZE) {
      const batch = organizations.slice(start, start + BATCH_SIZE).map(({ id }) => id);
      await queryRunner.query(
        `WITH created AS (
           INSERT INTO data_sources (name, kind, type, scope, organization_id, created_at, updated_at)
           SELECT 'librarydefault', 'library', 'static', 'global', id, NOW(), NOW() FROM unnest($1::uuid[]) AS id
           RETURNING id, organization_id
         ), versions AS (
           INSERT INTO data_source_versions (data_source_id, name, is_active, branch_id, created_at, updated_at)
           SELECT DISTINCT ON (c.id) c.id, 'librarydefault', true, b.id, NOW(), NOW()
             FROM created c
             JOIN organization_git_sync_branches b ON b.organization_id = c.organization_id AND b.is_default = true
            ORDER BY c.id, b.created_at
           RETURNING id, data_source_id
         )
         INSERT INTO data_source_version_options (data_source_version_id, environment_id, options, created_at, updated_at)
         SELECT v.id, e.id, '{}', NOW(), NOW()
           FROM versions v
           JOIN created c ON c.id = v.data_source_id
           JOIN app_environments e ON e.organization_id = c.organization_id`,
        [batch]
      );
      const done = start + batch.length;
      console.log(`${MIGRATION_NAME}: [PROGRESS] ${done}/${total} (${Math.round((done / total) * 100)}%)`);
    }

    console.log(`${MIGRATION_NAME}: [SUCCESS] Add librarydefault data source finished.`);
  }

  public async down(): Promise<void> {
    // Keep default sources: user queries may reference them, so removing them would invalidate those queries.
  }
}
