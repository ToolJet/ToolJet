import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Backfills co_relation_id = id for all rows where it is NULL.
 *
 * Strategy:
 *   - For every table except app_versions: unconditional WHERE co_relation_id IS NULL.
 *   - For app_versions: only non-stub rows (is_stub IS DISTINCT FROM true). Stubs are
 *     ephemeral placeholders created during git-pull hydration; they are deleted before
 *     hydration completes and must remain NULL so the partial NOT-NULL CHECK added in
 *     the follow-up migration (1777200000000) can allow them through.
 *   - apps was partially handled by data-migration 1773400000000, but the WHERE IS NULL
 *     guard makes this idempotent.
 *   - data_source_options is intentionally skipped (legacy table, live writes use
 *     data_source_version_options).
 */
export class BackfillCoRelationIds1777100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── apps ─────────────────────────────────────────────────────────────────────
    await queryRunner.query(`
      UPDATE apps
      SET co_relation_id = id
      WHERE co_relation_id IS NULL;
    `);

    // ── app_versions (non-stubs only) ────────────────────────────────────────────
    // First try to inherit from the parent app (preserves lineage where possible).
    await queryRunner.query(`
      UPDATE app_versions av
      SET co_relation_id = a.co_relation_id
      FROM apps a
      WHERE av.app_id = a.id
        AND av.co_relation_id IS NULL
        AND av.is_stub IS DISTINCT FROM true;
    `);
    // Any still-NULL non-stub rows fall back to the version's own id.
    await queryRunner.query(`
      UPDATE app_versions
      SET co_relation_id = id
      WHERE co_relation_id IS NULL
        AND is_stub IS DISTINCT FROM true;
    `);

    // ── pages ────────────────────────────────────────────────────────────────────
    await queryRunner.query(`
      UPDATE pages
      SET co_relation_id = id
      WHERE co_relation_id IS NULL;
    `);

    // ── components ───────────────────────────────────────────────────────────────
    await queryRunner.query(`
      UPDATE components
      SET co_relation_id = id
      WHERE co_relation_id IS NULL;
    `);

    // ── layouts ──────────────────────────────────────────────────────────────────
    await queryRunner.query(`
      UPDATE layouts
      SET co_relation_id = id
      WHERE co_relation_id IS NULL;
    `);

    // ── data_sources ─────────────────────────────────────────────────────────────
    await queryRunner.query(`
      UPDATE data_sources
      SET co_relation_id = id
      WHERE co_relation_id IS NULL;
    `);

    // ── data_queries ─────────────────────────────────────────────────────────────
    await queryRunner.query(`
      UPDATE data_queries
      SET co_relation_id = id
      WHERE co_relation_id IS NULL;
    `);

    // ── event_handlers ───────────────────────────────────────────────────────────
    await queryRunner.query(`
      UPDATE event_handlers
      SET co_relation_id = id
      WHERE co_relation_id IS NULL;
    `);

    // ── data_query_folders ───────────────────────────────────────────────────────
    await queryRunner.query(`
      UPDATE data_query_folders
      SET co_relation_id = id
      WHERE co_relation_id IS NULL;
    `);

    // ── data_query_folder_mappings ───────────────────────────────────────────────
    await queryRunner.query(`
      UPDATE data_query_folder_mappings
      SET co_relation_id = id
      WHERE co_relation_id IS NULL;
    `);

    // ── internal_tables ──────────────────────────────────────────────────────────
    await queryRunner.query(`
      UPDATE internal_tables
      SET co_relation_id = id
      WHERE co_relation_id IS NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Non-reversible: we cannot know which rows originally had NULL.
  }
}
