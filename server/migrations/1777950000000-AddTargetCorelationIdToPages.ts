import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Adds `target_corelation_id` (uuid, nullable) to `pages` and backfills it for pages
 * whose existing `app_id` column holds a slug pointing at another app (cross-app page
 * navigation feature). Going forward, runtime navigation should resolve the target app
 * via co_relation_id so it stays consistent across environments / clones.
 *
 * Ordering: runs after BackfillGoToAppEventSlugWithCorrelationId1777900000000 (which
 * does the same slug→correlationId rewrite for go-to-app event handlers) and before
 * AddMetadataColumnsToAppVersions1778000000000 (which nulls apps.slug). At this point
 * apps.slug is still populated, so the lookup reads `apps` directly.
 *
 * Sample row — BEFORE:
 *   id                   = 'c1a…'
 *   app_id               = 'checkout-flow'              ← slug of the target app
 *   target_corelation_id = (column does not exist yet)
 *
 * Sample row — AFTER (assuming the apps row for slug='checkout-flow' has
 * co_relation_id='b71f3b0a-2c0d-4d7a-9b1b-9d3f2e5a1c44'):
 *   id                   = 'c1a…'
 *   app_id               = 'checkout-flow'              ← preserved for diagnostic value
 *   target_corelation_id = 'b71f3b0a-2c0d-4d7a-9b1b-9d3f2e5a1c44'
 *
 * Failure mode (slug not resolvable):
 *   - app_id is left untouched.
 *   - target_corelation_id stays NULL (the column is nullable).
 *   Operators can grep `pages WHERE app_id IS NOT NULL AND target_corelation_id IS NULL`
 *   to find stragglers and fix them manually.
 *
 * Lookup is scoped to the page's organization: the page's app_version → app → org gives
 * us the source organization; we only match target apps in the same org so a slug
 * collision across workspaces doesn't pull in the wrong app.
 */
export class AddTargetCorelationIdToPages1777950000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // The Step 2 backfill is a single multi-join UPDATE across the whole pages
    // table — slow enough to trip statement_timeout (57014) on a large instance.
    // Disable it for this transaction; SET LOCAL reverts on commit/rollback.
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

    // Step 2: Backfill target_corelation_id by treating `pages.app_id` as a slug and
    // resolving it against apps.slug within the same organization as the page's source
    // app. Postgres's UPDATE-FROM doesn't allow joining the target table (pages) in the
    // FROM clause, so the resolution is computed in a subquery and joined on p.id.
    // Unresolvable slugs leave target_corelation_id NULL.
    await queryRunner.query(`
      UPDATE pages p
      SET target_corelation_id = sub.target_co_relation_id
      FROM (
        SELECT
          p2.id AS page_id,
          target_app.co_relation_id AS target_co_relation_id
        FROM pages p2
        JOIN app_versions av ON av.id = p2.app_version_id
        JOIN apps source_app ON source_app.id = av.app_id
        JOIN apps target_app
          ON target_app.slug = p2.app_id
          AND target_app.organization_id = source_app.organization_id
        WHERE p2.app_id IS NOT NULL
          AND p2.app_id <> ''
          AND target_app.co_relation_id IS NOT NULL
      ) sub
      WHERE p.id = sub.page_id
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('pages', 'target_corelation_id');
  }
}
