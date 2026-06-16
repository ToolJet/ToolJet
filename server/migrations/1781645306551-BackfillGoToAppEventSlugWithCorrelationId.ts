import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Replaces the `slug` key with a `correlationId` key in go-to-app event handlers so
 * cross-environment navigation resolves apps by passport (co_relation_id) instead of a
 * workspace-local slug. The `slug` key is removed; consumers must read `correlationId`.
 *
 * Schema context (post 1778000000000):
 *   - User-facing slug lives on `app_versions.slug` for front-end apps and modules.
 *   - `apps.slug` for those types is an `apps.id` UUID placeholder, not the user slug.
 *   - Workflows are exempt from that move (slug stays on `apps.slug`), but they are
 *     never targets of go-to-app, so this migration restricts the lookup to
 *     `apps.type = 'front-end'` per product spec.
 *   - Multiple `app_versions` rows can carry the same slug (multiple branches, old
 *     tag rows after a rename). The ordering below mirrors `findAppBySlug`'s runtime
 *     resolution so the backfill picks the same row a click would resolve to today.
 *
 * Sample row — BEFORE:
 *   event = { "actionId": "go-to-app", "slug": "checkout-flow", ... }
 * Sample row — AFTER:
 *   event = { "actionId": "go-to-app", "correlationId": "b71f3b0a-...", ... }
 *
 * Rows whose `slug` doesn't resolve to a front-end app in the same organization are
 * left untouched — the `slug` key stays as-is so operators can diagnose them later.
 * Resolved rows have `slug` removed; the transformation is one-way (originals aren't
 * retained, so `down()` is a no-op).
 */

const MIGRATION_NAME = 'BackfillGoToAppEventSlugWithCorrelationId1781645306551';
const BATCH_SIZE = 1000;

export class BackfillGoToAppEventSlugWithCorrelationId1781645306551 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const [{ count }] = await queryRunner.query(`
      SELECT COUNT(*) FROM event_handlers
      WHERE event::jsonb->>'actionId' = 'go-to-app'
        AND event::jsonb->>'slug' IS NOT NULL
        AND event::jsonb->>'slug' != ''
    `);

    const total = parseInt(count, 10);
    console.log(`${MIGRATION_NAME}: [START] Total event handlers to process: ${total}`);

    if (total === 0) {
      console.log(`${MIGRATION_NAME}: [SKIP] No records found.`);
      return;
    }

    // Per-batch slug→co_relation_id resolution probes app_versions.slug. Slug
    // uniqueness here is trigger-enforced (1778/1779/1779400000000); there is no
    // permanent index on the column, so the probe would degrade into sequential
    // scans on a large table. Back it with a temp partial index for this migration
    // only and drop it on completion (or rollback via the surrounding transaction).
    await queryRunner.query(`SET LOCAL statement_timeout = 0`);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS tmp_idx_av_slug_event_lookup
        ON app_versions (slug)
        WHERE slug IS NOT NULL
    `);

    try {
      let lastId = '00000000-0000-0000-0000-000000000000';
      let totalUpdated = 0;

      while (true) {
        // Cursor-paginated by `eh.id` so each batch is a small, bounded slice and the
        // migration is restart-safe within the same transaction.
        const rows: Array<{ id: string; slug: string; organization_id: string }> = await queryRunner.query(
          `
            SELECT
              eh.id,
              eh.event::jsonb->>'slug' AS slug,
              a.organization_id
            FROM event_handlers eh
            JOIN app_versions av ON av.id = eh.app_version_id
            JOIN apps a ON a.id = av.app_id
            WHERE eh.event::jsonb->>'actionId' = 'go-to-app'
              AND eh.event::jsonb->>'slug' IS NOT NULL
              AND eh.event::jsonb->>'slug' != ''
              AND eh.id > $1
            ORDER BY eh.id ASC
            LIMIT $2
          `,
          [lastId, BATCH_SIZE]
        );

        if (rows.length === 0) break;

        lastId = rows[rows.length - 1].id;

        // Group handlers by organization so the slug lookup runs once per org per batch.
        const orgToHandlers = new Map<string, Array<{ id: string; slug: string }>>();
        for (const row of rows) {
          if (!orgToHandlers.has(row.organization_id)) orgToHandlers.set(row.organization_id, []);
          orgToHandlers.get(row.organization_id)!.push({ id: row.id, slug: row.slug });
        }

        const updateMap = new Map<string, string>();

        for (const [orgId, handlers] of orgToHandlers) {
          const slugs = [...new Set(handlers.map((h) => h.slug))];

          // Resolve slug → co_relation_id via `app_versions.slug` (post-1778; apps.slug
          // is now a placeholder UUID for non-workflow apps). DISTINCT ON yields one
          // row per slug; the ORDER BY mirrors findAppBySlug's runtime resolution:
          //   1. Default-branch rows (git-enabled workspaces).
          //   2. Branchless rows (git-disabled / pre-git-sync legacy).
          //   3. Anything else (sub-branches, stale tag snapshots after rename).
          //   Within tier: newest updated_at, then id for determinism.
          const targetRows: Array<{ slug: string; co_relation_id: string }> = await queryRunner.query(
            `
              SELECT DISTINCT ON (av.slug)
                av.slug,
                a.co_relation_id
              FROM app_versions av
              JOIN apps a ON a.id = av.app_id
              LEFT JOIN workspace_branches wb ON wb.id = av.branch_id
              WHERE av.slug = ANY($1)
                AND a.organization_id = $2
                AND a.co_relation_id IS NOT NULL
                AND a.type = 'front-end'
              ORDER BY av.slug,
                       (CASE WHEN wb.is_default = true THEN 0
                             WHEN av.branch_id IS NULL THEN 1
                             ELSE 2 END) ASC,
                       av.updated_at DESC,
                       av.id ASC
            `,
            [slugs, orgId]
          );

          const slugToCorrelationId = new Map(targetRows.map((r) => [r.slug, r.co_relation_id]));

          for (const handler of handlers) {
            const correlationId = slugToCorrelationId.get(handler.slug);
            if (correlationId) updateMap.set(handler.id, correlationId);
          }
        }

        if (updateMap.size > 0) {
          const ids = [...updateMap.keys()];
          const correlationIds = ids.map((id) => updateMap.get(id)!);

          // Bulk update: drop the `slug` key and write the resolved value under
          // `correlationId`. `jsonb - 'slug'` removes the old key; the concatenation
          // adds the new one. Consumers must read `correlationId` going forward.
          await queryRunner.query(
            `
              UPDATE event_handlers
              SET event = ((event::jsonb - 'slug') || jsonb_build_object('correlationId', u.co_relation_id))::json
              FROM unnest($1::uuid[], $2::text[]) AS u(id, co_relation_id)
              WHERE event_handlers.id = u.id
            `,
            [ids, correlationIds]
          );

          totalUpdated += updateMap.size;
        }

        const percentage = total > 0 ? ((totalUpdated / total) * 100).toFixed(1) : '0.0';
        console.log(`${MIGRATION_NAME}: [PROGRESS] ${totalUpdated}/${total} (${percentage}%)`);
      }

      console.log(`${MIGRATION_NAME}: [SUCCESS] Finished. Total updated: ${totalUpdated}`);
    } finally {
      await queryRunner.query(`DROP INDEX IF EXISTS tmp_idx_av_slug_event_lookup`);
    }
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Not reversible — original slugs are not retained after replacement.
  }
}
