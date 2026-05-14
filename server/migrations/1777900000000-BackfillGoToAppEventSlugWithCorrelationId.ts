import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Replaces the `slug` key with a `correlationId` key in go-to-app event handlers so
 * cross-environment navigation resolves apps by passport (co_relation_id) instead of a
 * workspace-local slug. The `slug` key is removed; consumers must read `correlationId`.
 *
 * Ordering: runs between AddCoRelationIdNotNullConstraints1777200000000 (which makes
 * apps.co_relation_id NOT NULL) and AddMetadataColumnsToAppVersions1778000000000 (which
 * moves slug from apps.* to app_versions.* and nulls apps.slug). At this point apps.slug
 * is still the canonical source, so the slug→co_relation_id resolution reads from `apps`
 * directly — no need to join app_versions or branch on git-sync state.
 *
 * Sample row — BEFORE:
 *   id     = '8f2…'
 *   event  = {
 *     "actionId": "go-to-app",
 *     "slug":     "checkout-flow",       ← workspace-local slug from apps.slug
 *     "queryParams": [...],
 *     ...
 *   }
 *
 * Sample row — AFTER (assuming the apps row for slug='checkout-flow' has
 * co_relation_id='b71f3b0a-2c0d-4d7a-9b1b-9d3f2e5a1c44'):
 *   id     = '8f2…'
 *   event  = {
 *     "actionId":      "go-to-app",
 *     "correlationId": "b71f3b0a-2c0d-4d7a-9b1b-9d3f2e5a1c44",   ← new key (passport)
 *     "queryParams":   [...],
 *     ...
 *   }
 *
 * Rows whose `slug` doesn't resolve to any app in the same organization are left
 * untouched — the `slug` key stays as-is so they can be diagnosed later. Resolved rows
 * have `slug` removed; the transformation is one-way (originals aren't retained).
 */

const MIGRATION_NAME = 'BackfillGoToAppEventSlugWithCorrelationId1777900000000';
const BATCH_SIZE = 1000;

export class BackfillGoToAppEventSlugWithCorrelationId1777900000000 implements MigrationInterface {
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

    let lastId = '00000000-0000-0000-0000-000000000000';
    let totalUpdated = 0;

    while (true) {
      // Fetch batch of event handlers with their source app's organization.
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
        if (!orgToHandlers.has(row.organization_id)) {
          orgToHandlers.set(row.organization_id, []);
        }
        orgToHandlers.get(row.organization_id)!.push({ id: row.id, slug: row.slug });
      }

      const updateMap = new Map<string, string>();

      for (const [orgId, handlers] of orgToHandlers) {
        const slugs = [...new Set(handlers.map((h) => h.slug))];

        // Resolve slug → co_relation_id directly from the apps table. At this migration's
        // point in time apps.slug is still populated (the AddMetadataColumnsToAppVersions
        // migration hasn't moved metadata to app_versions yet).
        const targetRows: Array<{ slug: string; co_relation_id: string }> = await queryRunner.query(
          `
            SELECT slug, co_relation_id
            FROM apps
            WHERE slug = ANY($1)
              AND organization_id = $2
              AND co_relation_id IS NOT NULL
          `,
          [slugs, orgId]
        );

        const slugToCorrelationId = new Map(targetRows.map((r) => [r.slug, r.co_relation_id]));

        for (const handler of handlers) {
          const correlationId = slugToCorrelationId.get(handler.slug);
          if (correlationId) {
            updateMap.set(handler.id, correlationId);
          }
        }
      }

      if (updateMap.size > 0) {
        const ids = [...updateMap.keys()];
        const correlationIds = ids.map((id) => updateMap.get(id)!);

        // Bulk update: drop the `slug` key and write the resolved value under
        // `correlationId`. `jsonb - 'slug'` removes the old key; the concatenation adds
        // the new one. Consumers must read `correlationId` going forward.
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
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Not reversible — original slugs are not retained after replacement.
  }
}
