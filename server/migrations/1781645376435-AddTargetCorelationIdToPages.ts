import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Adds `target_corelation_id` (uuid, nullable) to `pages` and backfills it for pages
 * whose existing `app_id` column holds a slug pointing at another app (cross-app
 * page navigation feature). Going forward, runtime navigation resolves the target
 * app via co_relation_id so it stays consistent across environments, branches and
 * clones.
 *
 * Schema context (post 1778000000000):
 *   - User-facing slug lives on `app_versions.slug` for front-end apps and modules.
 *   - `apps.slug` for those types is an `apps.id` UUID placeholder, not the user slug.
 *   - Workflows are exempt from that move (slug stays on `apps.slug`), but cross-app
 *     page navigation only targets front-end apps per product spec — the lookup is
 *     restricted to `apps.type = 'front-end'`.
 *   - Multiple `app_versions` rows can carry the same slug (multiple branches, old
 *     tag rows after a rename). The ordering below mirrors `findAppBySlug`'s runtime
 *     resolution so the backfill picks the same row a click would resolve to today.
 *
 * Sample row — BEFORE:
 *   id                   = 'c1a...'
 *   app_id               = 'checkout-flow'              -- slug of the target app
 *   target_corelation_id = (column does not exist yet)
 *
 * Sample row — AFTER (assuming an app_versions row with slug='checkout-flow' whose
 * owning front-end app has co_relation_id='b71f3b0a-...'):
 *   id                   = 'c1a...'
 *   app_id               = 'checkout-flow'              -- preserved for diagnostic value
 *   target_corelation_id = 'b71f3b0a-...'
 *
 * Failure mode (slug not resolvable):
 *   - app_id is left untouched.
 *   - target_corelation_id stays NULL (the column is nullable).
 *   Operators can grep `pages WHERE app_id IS NOT NULL AND target_corelation_id IS NULL`
 *   to find stragglers and fix them manually.
 *
 * Lookup is scoped to the page's organization (via source app → org) to avoid
 * cross-workspace slug collisions.
 */
export class AddTargetCorelationIdToPages1781645376435 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 3 backfill is a single multi-join UPDATE across the whole pages table —
    // slow enough to trip statement_timeout (57014) on a large instance. Disable it
    // for this transaction; SET LOCAL reverts on commit/rollback.
    await queryRunner.query(`SET LOCAL statement_timeout = 0`);

    // Step 1: Add the new column.
    await queryRunner.addColumn(
      'pages',
      new TableColumn({
        name: 'target_corelation_id',
        type: 'uuid',
        isNullable: true,
      })
    );

    // Step 2: Temp partial index on app_versions(slug). Slug uniqueness here is
    // trigger-enforced, not index-enforced — without this the backfill's slug join
    // degrades into a sequential scan on app_versions for every page row. Dropped
    // in `finally` so operators running with `transaction: 'none'` don't end up
    // with an orphan index on partial failure.
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS tmp_idx_av_slug_target_lookup
        ON app_versions (slug)
        WHERE slug IS NOT NULL
    `);

    try {
      // Step 3: Backfill target_corelation_id by treating pages.app_id as a slug
      // and resolving it against app_versions.slug within the same organization as
      // the page's source app. DISTINCT ON ensures one update per page; the
      // ORDER BY mirrors findAppBySlug's runtime resolution:
      //   1. Default-branch rows (git-enabled workspaces).
      //   2. Branchless rows (git-disabled / pre-git-sync legacy).
      //   3. Anything else (sub-branches, stale tag snapshots after rename).
      //   Within tier: newest updated_at, then id for determinism.
      // `pages.type = 'app'` guards against junk app_id values on non-app pages.
      // Unresolvable slugs leave target_corelation_id NULL.
      await queryRunner.query(`
        UPDATE pages p
        SET target_corelation_id = sub.target_co_relation_id
        FROM (
          SELECT DISTINCT ON (p2.id)
            p2.id AS page_id,
            target_app.co_relation_id AS target_co_relation_id
          FROM pages p2
          JOIN app_versions src_av ON src_av.id = p2.app_version_id
          JOIN apps source_app ON source_app.id = src_av.app_id
          JOIN app_versions target_av ON target_av.slug = p2.app_id
          JOIN apps target_app
            ON target_app.id = target_av.app_id
            AND target_app.organization_id = source_app.organization_id
          LEFT JOIN organization_git_sync_branches wb ON wb.id = target_av.branch_id
          WHERE p2.app_id IS NOT NULL
            AND p2.app_id <> ''
            AND p2.type = 'app'
            AND target_app.co_relation_id IS NOT NULL
            AND target_app.type = 'front-end'
          ORDER BY p2.id,
                   (CASE WHEN wb.is_default = true THEN 0
                         WHEN target_av.branch_id IS NULL THEN 1
                         ELSE 2 END) ASC,
                   target_av.updated_at DESC,
                   target_av.id ASC
        ) sub
        WHERE p.id = sub.page_id
      `);
    } finally {
      // Step 4: Drop the temp index — runtime lookups go through co_relation_id,
      // not slug, so the index is dead weight after the backfill completes.
      await queryRunner.query(`DROP INDEX IF EXISTS tmp_idx_av_slug_target_lookup`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('pages', 'target_corelation_id');
  }
}
