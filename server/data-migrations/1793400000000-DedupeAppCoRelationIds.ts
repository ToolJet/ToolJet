import { randomUUID } from 'crypto';
import { MigrationInterface, QueryRunner } from 'typeorm';

const MIGRATION_NAME = 'DedupeAppCoRelationIds';

/**
 * One `apps` row per git identity, then an index that keeps it that way.
 *
 * `co_relation_id` is the identity git sends and every pull lookup keys on
 * (`fetchLatestVersionsForBranch`, `ensureAppRowsForImported` in
 * `ee/platform-git-sync/pull.service.ts`). Both collapse duplicates with a silent first-wins,
 * and they sort differently — so with two rows sharing an identity the pull resolves to one of
 * them arbitrarily, writes the name onto it, and `enforce_app_versions_app_name_branch_unique`
 * rejects the write because the sibling still holds that name. The pull fails on every run.
 *
 * Nothing prevented the duplicates: `idx_apps_co_relation_id` (1779900000000) is not unique, and
 * `CREATE TRIGGER` never validates existing rows — so whatever was already duplicated when the
 * uniqueness triggers went live (1781741000000) was adopted silently.
 *
 * What this does, per duplicated (organization, type, co_relation_id):
 *   - keeps the row with the most real content (see the ranking below), untouched;
 *   - gives every other row a fresh co_relation_id, a suffixed app_name, a slug of its own app
 *     id, and marks its versions unsynced.
 *
 * Unsynced is the load-bearing part: `removeOrphanedResources` only deletes rows where
 * `is_synced = true` ("Only synced rows are deletion candidates — unsynced local work
 * survives"), and `reconcileSyncedAppVersions` only re-syncs apps still present in git by
 * co_relation_id — which the re-keyed row no longer is. So the duplicate stays visible and
 * intact for its owner to review and delete, and no pull touches it again.
 *
 * Nothing is deleted. The rename and re-slug are both required: the name and slug triggers are
 * cross-app and read neither `is_synced` nor `co_relation_id`, so leaving either in place keeps
 * the collision alive — and a stale slug would make `resolveNonCollidingSlug` quietly rewrite
 * the KEPT app's slug to a UUID on the next pull, breaking its URL.
 *
 * Dry run — what this will change, without changing it: run the SELECT in step 1 as it stands.
 * It returns every app in every duplicated identity; dup_rank = 1 is the row that is kept, the
 * rest are detached. up() prints exactly that list before it writes anything.
 *
 * Irreversible: see down().
 */
/** One `apps` row inside a duplicated identity, as step 1 ranks it. */
interface DuplicateAppRow {
  app_id: string;
  organization_id: string;
  app_type: string;
  co_relation_id: string;
  app_name: string | null;
  created_at: Date | string | null;
  /** bigint columns — pg returns these as strings, so compare them with Number(). */
  non_stub_versions: string;
  released_versions: string;
  synced_versions: string;
  dup_rank: string;
}

/** Log-friendly timestamp. The driver hands back a Date, but not on every pg/TypeORM pairing. */
function formatTimestamp(value: Date | string | null): string {
  if (!value) return 'unknown';
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString();
}

export class DedupeAppCoRelationIds1793400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`SET LOCAL statement_timeout = 0`);

    // Step 1: rank the rows inside every duplicated identity. Content first — losing a bare
    // stub costs nothing, losing a released app costs the customer. Sync state is a weak
    // signal here and deliberately ranks below content: in the field every duplicate of a
    // group is usually identically synced, so it discriminates nothing. app_id is the final
    // tiebreak so the choice is deterministic across re-runs and replicas.
    //
    // The partition matches the unique index created in step 4 exactly, including the
    // COALESCE — apps.type is nullable on legacy rows and NULLs are distinct in a unique
    // index on PG 13, which would leave a hole the dedup had not closed.
    const duplicated: DuplicateAppRow[] = await queryRunner.query(`
        WITH grouped AS (
          SELECT a.id AS app_id,
                 a.organization_id,
                 COALESCE(a.type::text, 'front-end') AS app_type,
                 a.co_relation_id,
                 a.created_at,
                 count(*) FILTER (WHERE av.is_stub = false) AS non_stub_versions,
                 count(*) FILTER (WHERE av.is_stub = false AND av.status::text = 'PUBLISHED') AS released_versions,
                 count(*) FILTER (WHERE av.is_synced = true) AS synced_versions,
                 max(av.updated_at) AS last_touched,
                 max(av.app_name) AS app_name
          FROM apps a
          LEFT JOIN app_versions av ON av.app_id = a.id
          WHERE a.co_relation_id IS NOT NULL
          GROUP BY a.id
        ),
        ranked AS (
          SELECT grouped.*,
                 row_number() OVER (
                   PARTITION BY organization_id, app_type, co_relation_id
                   ORDER BY non_stub_versions DESC,
                            released_versions DESC,
                            synced_versions DESC,
                            last_touched DESC NULLS LAST,
                            created_at ASC,
                            app_id ASC
                 ) AS dup_rank,
                 count(*) OVER (PARTITION BY organization_id, app_type, co_relation_id) AS group_size
          FROM grouped
        )
        SELECT app_id, organization_id, app_type, co_relation_id, app_name, created_at,
               non_stub_versions, released_versions, synced_versions, dup_rank
        FROM ranked
        WHERE group_size > 1
        ORDER BY organization_id, app_type, co_relation_id, dup_rank
      `);

    // Step 1b: print the whole affected set — every app in every duplicated identity, kept and
    // detached alike, with the counts the ranking decided on. The per-app log in step 2 records
    // only what changed; an owner asking "why was mine not the one kept?" needs to see the row
    // that beat it, and support needs the full blast radius before the first write lands.
    const groups = new Map<string, DuplicateAppRow[]>();
    for (const row of duplicated) {
      const key = `${row.organization_id}|${row.app_type}|${row.co_relation_id}`;
      const bucket = groups.get(key);
      if (bucket) bucket.push(row);
      else groups.set(key, [row]);
    }

    const losers = duplicated.filter((row) => Number(row.dup_rank) > 1);

    console.log(`${MIGRATION_NAME}: [START] detaching duplicate apps from their git identity: ${losers.length}`);
    console.log(
      `${MIGRATION_NAME}: [START] affected: ${groups.size} duplicated git ` +
        `${groups.size === 1 ? 'identity' : 'identities'} across ${duplicated.length} apps`
    );
    for (const rows of groups.values()) {
      const [first] = rows;
      console.log(
        `${MIGRATION_NAME}: [START]   identity ${first.co_relation_id} ` +
          `(organization ${first.organization_id}, type ${first.app_type}): ${rows.length} apps`
      );
      for (const row of rows) {
        console.log(
          `${MIGRATION_NAME}: [START]     ${Number(row.dup_rank) === 1 ? 'KEEP  ' : 'DETACH'} ` +
            `app ${row.app_id} "${row.app_name ?? '(unnamed)'}" ` +
            `non_stub=${row.non_stub_versions} released=${row.released_versions} ` +
            `synced=${row.synced_versions} created=${formatTimestamp(row.created_at)}`
        );
      }
    }

    // Step 2: detach each duplicate. One app at a time, so the old -> new co_relation_id
    // mapping lands in the logs: it is the only record of what was changed, and the only way
    // back if an owner says the wrong row was kept.
    for (let i = 0; i < losers.length; i++) {
      const { app_id: appId, co_relation_id: previousCoRelationId, app_name: appName } = losers[i];

      // Generated here rather than with gen_random_uuid() + RETURNING: TypeORM hands back
      // [rows, rowCount] for an UPDATE, so reading the new value back is easy to get subtly
      // wrong, and the log line below has to be right — it is the only record of the change.
      const freshCoRelationId = randomUUID();
      await queryRunner.query(`UPDATE apps SET co_relation_id = $2 WHERE id = $1`, [appId, freshCoRelationId]);

      // The suffix carries the whole app id, not just a timestamp and not a truncation of the
      // id: two duplicates of the same name are renamed in the same run, so anything they can
      // share makes the rename collide on the very trigger it is clearing. Only the full
      // primary key is guaranteed distinct. The slug becomes the app id too, matching the
      // "slug defaults to app.id" convention the earlier slug dedup used (1782250000000).
      //
      // The id is passed twice on purpose — once compared as uuid, once used as text. Binding a
      // single parameter to both would leave PostgreSQL to deduce one type for it and fail.
      const rename = `
        SET app_name = COALESCE(NULLIF(app_name, ''), 'app')
              || ' (duplicate ' || to_char(now(), 'YYYYMMDDHH24MI') || '-' || $2::text || ')',
            slug = $2::text,
            is_synced = false
      `;

      // Non-canonical rows first, in one statement: propagate_app_version_metadata returns
      // early for all of them (it only acts on a non-stub DRAFT), so nothing writes behind us.
      const CANONICAL_DRAFT = `status::text = 'DRAFT' AND version_type::text = 'version' AND is_stub = false`;
      await queryRunner.query(`UPDATE app_versions ${rename} WHERE app_id = $1 AND NOT (${CANONICAL_DRAFT})`, [
        appId,
        appId,
      ]);

      // Then the canonical DRAFT rows — one statement each. Updating one fires
      // propagate_app_version_metadata, which writes the new name and slug onto the app's other
      // version rows. Those already carry them from the statement above, so its
      // `IS DISTINCT FROM` guard makes it a no-op. Batching these instead would let the trigger
      // for one row write a sibling the same statement had not reached yet, which PostgreSQL
      // rejects with "tuple to be updated was already modified by an operation triggered by the
      // current command" — an app with a draft on more than one branch would hit it.
      const draftIds: { id: string }[] = await queryRunner.query(
        `SELECT id FROM app_versions WHERE app_id = $1 AND ${CANONICAL_DRAFT} ORDER BY id`,
        [appId]
      );
      for (const { id } of draftIds) {
        await queryRunner.query(`UPDATE app_versions ${rename} WHERE id = $1 AND app_id = $3`, [id, appId, appId]);
      }

      console.log(
        `${MIGRATION_NAME}: [PROGRESS] ${i + 1}/${losers.length} (${Math.round(
          ((i + 1) / losers.length) * 100
        )}%) app ${appId} "${appName ?? '(unnamed)'}" co_relation_id ${previousCoRelationId} -> ${freshCoRelationId}`
      );
    }

    console.log(`${MIGRATION_NAME}: [SUCCESS] duplicate apps detached.`);

    // Step 3: refuse to index over a duplicate this migration did not resolve, rather than
    // failing the upgrade inside CREATE UNIQUE INDEX with an error that names only a key.
    const remaining = await queryRunner.query(`
      SELECT organization_id, COALESCE(type::text, 'front-end') AS app_type, co_relation_id, count(*) AS rows
      FROM apps
      WHERE co_relation_id IS NOT NULL
      GROUP BY organization_id, COALESCE(type::text, 'front-end'), co_relation_id
      HAVING count(*) > 1
    `);
    if (remaining.length > 0) {
      throw new Error(
        `${MIGRATION_NAME}: ${remaining.length} co_relation_id group(s) still duplicated after dedup — ` +
          `refusing to create the unique index. First: ${JSON.stringify(remaining[0])}`
      );
    }

    // Step 4: the invariant every pull lookup already assumed.
    // migration-lint: allow-destructive one apps row per git identity is the invariant the pull
    // lookups assume; step 2 above guarantees the data satisfies it before this runs
    console.log(`${MIGRATION_NAME}: [START] creating the co_relation_id unique index: 1`);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_apps_org_type_co_relation_id_unique"
      ON "apps" ("organization_id", (COALESCE("type"::text, 'front-end')), "co_relation_id")
      WHERE "co_relation_id" IS NOT NULL
    `);
    console.log(`${MIGRATION_NAME}: [SUCCESS] unique index created.`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // The index drops cleanly. The data changes do not: the original co_relation_id, app_name
    // and slug of each detached duplicate are recoverable only from this migration's up() logs
    // (old -> new is printed per app). Restoring them would also re-create the collision that
    // made every pull fail, so it is a deliberate manual step, not an automatic rollback.
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_apps_org_type_co_relation_id_unique"`);
  }
}
