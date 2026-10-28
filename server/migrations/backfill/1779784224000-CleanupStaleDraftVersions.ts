import { MigrationInterface, QueryRunner } from 'typeorm';

const MIGRATION_NAME = 'CleanupStaleDraftVersions1779784224000';

/**
 * Removes orphaned duplicate DRAFT versions that were created by a bug in the
 * export logic (PR #16541) which serialized ALL app_versions instead of only the
 * one being committed. On pull, each serialized version became a separate DRAFT
 * on the same branch, leaving stale rows that are never updated.
 *
 * Strategy: For each (app_id, branch_id) pair that has MORE than one non-stub
 * DRAFT, keep only the one with the latest `pulled_at` (the actively-maintained
 * draft) and delete the rest along with their child entities (pages → components
 * cascade, data_queries, data_sources, event_handlers, data_query_folders,
 * data_query_folder_mappings).
 */
export class CleanupStaleDraftVersions1779784224000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Find all stale draft version IDs (all but the newest per app+branch)
    const staleVersions: { id: string; app_id: string; branch_id: string }[] = await queryRunner.query(`
      SELECT id, app_id, branch_id
      FROM (
        SELECT
          id,
          app_id,
          branch_id,
          ROW_NUMBER() OVER (
            PARTITION BY app_id, branch_id
            ORDER BY pulled_at DESC NULLS LAST, created_at DESC
          ) AS rn
        FROM app_versions
        WHERE status = 'DRAFT'
          AND is_stub = false
          AND branch_id IS NOT NULL
          AND pulled_at IS NOT NULL
      ) ranked
      WHERE rn > 1
    `);

    const total = staleVersions.length;
    console.log(`${MIGRATION_NAME}: [START] Cleanup stale draft versions | Total: ${total}`);

    if (total === 0) {
      console.log(`${MIGRATION_NAME}: [SUCCESS] No stale drafts found. Nothing to do.`);
      return;
    }

    const staleIds = staleVersions.map((r) => r.id);

    // Delete non-cascading child entities explicitly
    // (data_query_folder_mappings and data_query_folders lack ON DELETE CASCADE)
    await queryRunner.query(
      `DELETE FROM data_query_folder_mappings
       WHERE (child_type = 'query' AND child_id IN (SELECT id FROM data_queries WHERE app_version_id = ANY($1::uuid[])))
          OR (child_type = 'folder' AND child_id IN (SELECT id FROM data_query_folders WHERE app_version_id = ANY($1::uuid[])))
          OR (parent_id IN (SELECT id FROM data_query_folders WHERE app_version_id = ANY($1::uuid[])))`,
      [staleIds]
    );
    console.log(`${MIGRATION_NAME}: [PROGRESS] 1/3 — Deleted data_query_folder_mappings`);

    await queryRunner.query(`DELETE FROM data_query_folders WHERE app_version_id = ANY($1::uuid[])`, [staleIds]);
    console.log(`${MIGRATION_NAME}: [PROGRESS] 2/3 — Deleted data_query_folders`);

    // Delete the stale versions — all other child tables (pages, components,
    // data_queries, data_sources, event_handlers) cascade via ON DELETE CASCADE.
    await queryRunner.query(`DELETE FROM app_versions WHERE id = ANY($1::uuid[])`, [staleIds]);
    console.log(`${MIGRATION_NAME}: [PROGRESS] 3/3 — Deleted ${total} stale app_versions`);

    console.log(`${MIGRATION_NAME}: [SUCCESS] Cleanup stale draft versions finished. Removed ${total} orphan drafts.`);
  }

  public async down(): Promise<void> {
    // Data migration — not reversible (deleted rows cannot be reconstructed)
    console.log(`${MIGRATION_NAME}: [DOWN] Not reversible — stale versions were already orphaned.`);
  }
}
