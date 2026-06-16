import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Enforces the new "default branch always has a DRAFT version row" invariant
 * for git-enabled workspaces. Required by the metadata-resolution rewrite that
 * targets DRAFT rows on the default branch as the canonical metadata source.
 *
 * What this migration does:
 *
 *   1. For each app in a git-enabled workspace (a row in
 *      organization_git_sync_branches with is_default=true exists for the
 *      org), ensure there's a DRAFT VERSION-type row on the default branch.
 *      If absent and a PUBLISHED VERSION-type row exists on the default
 *      branch, INSERT a minimal new DRAFT row. The row is intentionally
 *      content-empty — its only purpose is to host metadata
 *      (app_name / slug / icon / is_public, added by the next migration
 *      1778000000000). Users pull from git or edit to populate child
 *      entities (pages, queries, etc.) afterwards.
 *
 *   2. Detach branch_id from PUBLISHED VERSION-type rows on default branches.
 *      Tag/release rows become branchless going forward — only the editor
 *      working state (DRAFT) is branch-scoped.
 *
 * Naturally excluded:
 *   - Workflows — branch_id is always NULL on workflow rows.
 *   - Sub-branch BRANCH-type rows — version_type='branch' (not 'version').
 *   - Apps with no PUBLISHED row on the default branch — skipped in step 1
 *     (no source to inherit co_relation_id from).
 *
 * Ordering: runs after AddTargetCorelationIdToPages1777950000000 and before
 * AddMetadataColumnsToAppVersions1778000000000.
 */
export class EnsureDefaultBranchDraftVersion1777970000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1 loops over every app in a git-enabled workspace doing per-app lookups
    // and an INSERT; on an instance with many apps the whole block can run past the
    // connection's statement_timeout (57014). Disable it for this transaction;
    // SET LOCAL reverts on commit/rollback. (Per-app probes are scoped by app_id, an
    // indexed FK, so no temp index is needed — only the timeout guard.)
    await queryRunner.query(`SET LOCAL statement_timeout = 0`);

    // Step 1: Minimal non-stub DRAFT row per app missing one on the default
    // branch. is_stub=false so the row surfaces as a real, hydrated version to
    // downstream `is_stub` readers (subscriber overlay, module ref resolution,
    // app listing). Real content is filled lazily on first open via Gate B in
    // AppsService.getOne, which fires because migration 1779600000000 stamps
    // `remote_updated_at = NOW()` on these rows while `pulled_at` stays NULL.
    //
    // Inherits only what's strictly needed:
    //   - co_relation_id (chk_app_versions_co_relation_id_when_not_stub requires
    //     a value for non-stub rows; inherit from the published row).
    //
    // `name` is set to a fixed sentinel UUID so 1779600000000 can find and
    // stamp/rename these rows. The sentinel collides per-app only with itself
    // (one INSERT per app) so (name, app_id) UNIQUE holds; 1779600000000 then
    // rewrites `name = id::text` so the sentinel doesn't linger.
    //
    // Everything else (definition, settings, home_page_id, …) is left at column
    // defaults / NULL — the row is a metadata host, content arrives lazily.
    await queryRunner.query(`
      DO $$
      DECLARE
        app_rec RECORD;
        published_rec RECORD;
        new_id UUID;
      BEGIN
        FOR app_rec IN
          SELECT DISTINCT a.id AS app_id, wb.id AS default_branch_id
          FROM apps a
          JOIN organization_git_sync_branches wb
            ON wb.organization_id = a.organization_id AND wb.is_default = true
          WHERE NOT EXISTS (
              SELECT 1 FROM app_versions av
              WHERE av.app_id = a.id
                AND av.version_type = 'version'
                AND av.status = 'DRAFT'
                AND av.branch_id = wb.id
            )
            AND EXISTS (
              SELECT 1 FROM app_versions av
              WHERE av.app_id = a.id
                AND av.version_type = 'version'
                AND av.status = 'PUBLISHED'
                AND av.branch_id = wb.id
            )
        LOOP
          SELECT id, co_relation_id
          INTO published_rec
          FROM app_versions
          WHERE app_id = app_rec.app_id
            AND version_type = 'version'
            AND status = 'PUBLISHED'
            AND branch_id = app_rec.default_branch_id
          ORDER BY updated_at DESC
          LIMIT 1;

          new_id := gen_random_uuid();

          INSERT INTO app_versions (
            id, name, app_id, status, version_type, branch_id, co_relation_id,
            parent_version_id, is_stub, created_at, updated_at
          ) VALUES (
            new_id,
            '00000000-0000-0000-0000-000077970000',
            app_rec.app_id,
            'DRAFT',
            'version',
            app_rec.default_branch_id,
            published_rec.co_relation_id,
            published_rec.id,
            false,
            NOW(),
            NOW()
          );
        END LOOP;
      END $$;
    `);

    // Step 2: Detach branch_id from PUBLISHED VERSION-type rows on default
    // branches. Released/tag rows become branchless — the only branch-scoped
    // VERSION-type rows after this migration are DRAFT rows.
    await queryRunner.query(`
      UPDATE app_versions
      SET branch_id = NULL
      WHERE version_type = 'version'
        AND status = 'PUBLISHED'
        AND branch_id IN (
          SELECT id FROM organization_git_sync_branches WHERE is_default = true
        );
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No down — re-attaching branch_id to PUBLISHED rows without knowing the
    // original default branch isn't safe, and the empty DRAFT rows are
    // indistinguishable from organic ones once the user starts editing.
  }
}
