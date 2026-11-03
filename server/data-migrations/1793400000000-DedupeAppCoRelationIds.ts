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
 * The rename runs in two passes. The organization's DEFAULT branch first, where
 * `enforce_app_versions_app_name_branch_unique` exempts the app's own rows (`av.app_id <>
 * NEW.app_id`) so all of them can take one name — and where renaming the draft lets
 * `propagate_app_version_metadata`, which is branch-agnostic, carry that name and slug onto the
 * app's non-stub rows on every other branch.
 *
 * Then every row the first pass did not reach, one statement each. Leaving them is not an
 * option: `enforce_app_versions_default_branch_slug_unique` is instance-wide and carries NO
 * branch filter, so a slug left on a feature branch collides with the KEPT app's next write on
 * the default branch, and pull's recovery for that (`applyVersionMetadataWithSlug`) retries with
 * a UUID slug whose propagation raises an app_name violation it does not catch — the pull fails
 * on the default branch, which is the failure this migration exists to end. Writing the slug
 * everywhere is safe (both slug triggers are cross-app only). The name is not: a non-default
 * branch has no same-app exemption and may hold both a stub and a non-stub row for one app, so
 * one row per branch takes the plain name and the rest take it plus their own version id.
 *
 * Unsyncing is deliberately NOT branch-scoped. `removeOrphanedResources` is branch-scoped and
 * deletes any synced, git-touched version whose app is no longer in git by co_relation_id —
 * which a detached duplicate no longer is on any branch. A branch left synced would lose its
 * versions on its next pull.
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
  /** The organization's default branch — the only branch whose version rows are renamed. */
  default_branch_id: string | null;
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

/**
 * The name a detached duplicate is given — computed once per app and written as a literal.
 *
 * Never built in SQL by concatenating onto the row's current app_name:
 * `propagate_app_version_metadata` copies a renamed draft's name onto the app's other version
 * rows, so with a draft on a second branch the concatenation ran against an already-suffixed
 * name and produced "… (duplicate X) (duplicate X)". A literal makes every write idempotent,
 * which also turns the trigger's own fan-out into a no-op via its `IS DISTINCT FROM` guard.
 *
 * The suffix carries the whole app id, not just a timestamp and not a truncation of the id: two
 * duplicates of the same name are renamed in the same run, so anything they can share makes the
 * rename collide on the very trigger it is clearing. Only the full primary key is guaranteed
 * distinct. UTC so one run labels every app it touches identically.
 */
function detachedAppName(appName: string | null, appId: string, renamedAt: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  const stamp =
    `${renamedAt.getUTCFullYear()}${pad(renamedAt.getUTCMonth() + 1)}${pad(renamedAt.getUTCDate())}` +
    `${pad(renamedAt.getUTCHours())}${pad(renamedAt.getUTCMinutes())}`;
  return `${appName || 'app'} (duplicate ${stamp}-${appId})`;
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
    // The counts span every branch: they measure how much real content a row holds, and the
    // choice of which row keeps the git identity should not turn on where that content lives.
    // Only the rename in step 2 is default-branch-scoped.
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
                 (SELECT wb.id
                    FROM organization_git_sync_branches wb
                   WHERE wb.organization_id = a.organization_id AND wb.is_default = true
                   LIMIT 1) AS default_branch_id,
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
               default_branch_id, non_stub_versions, released_versions, synced_versions, dup_rank
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
          `(organization ${first.organization_id}, type ${first.app_type}, ` +
          `default branch ${first.default_branch_id ?? 'none'}): ${rows.length} apps`
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

    // PROPAGATES_ON_WRITE mirrors propagate_app_version_metadata's own guard, NULLs and all. The trigger bails with
    // `IF version_type <> 'version' OR status <> 'DRAFT' OR is_stub THEN RETURN NEW`, and in
    // PL/pgSQL a NULL condition does not take the branch — so a row whose status is NULL (the
    // column is nullable with no default, and legacy rows are exactly this migration's
    // population) is one the trigger DOES act on. Writing the predicate as `status = 'DRAFT'`
    // and its negation as `NOT (...)` put such a row in neither set: it was never renamed, and
    // had it been renamed in the batch statement its own propagation would have written a
    // sibling that statement had not reached yet. `IS NOT TRUE` is never NULL, so the two sets
    // stay exact complements.
    const PROPAGATES_ON_WRITE =
      `(version_type::text <> 'version') IS NOT TRUE ` +
      `AND (status::text <> 'DRAFT') IS NOT TRUE ` +
      `AND is_stub IS NOT TRUE`;
    const renamedAt = new Date();
    for (let i = 0; i < losers.length; i++) {
      const {
        app_id: appId,
        co_relation_id: previousCoRelationId,
        app_name: appName,
        default_branch_id: defaultBranchId,
      } = losers[i];

      // Generated here rather than with gen_random_uuid() + RETURNING: TypeORM hands back
      // [rows, rowCount] for an UPDATE, so reading the new value back is easy to get subtly
      // wrong, and the log line below has to be right — it is the only record of the change.
      const freshCoRelationId = randomUUID();
      await queryRunner.query(`UPDATE apps SET co_relation_id = $2 WHERE id = $1`, [appId, freshCoRelationId]);

      // Unsync every version row on every branch, before the rename. is_synced appears in no
      // trigger's UPDATE OF list, so this statement fires nothing — and doing it first leaves
      // the rename below writing only app_name and slug, which makes a repeat write of the same
      // literal a true no-op that the propagate trigger's WHEN clause skips entirely.
      await queryRunner.query(`UPDATE app_versions SET is_synced = false WHERE app_id = $1 AND is_synced = true`, [
        appId,
      ]);

      // The slug becomes the app id, matching the "slug defaults to app.id" convention the
      // earlier slug dedup used (1782250000000). See detachedAppName for the name.
      const detachedName = detachedAppName(appName, appId, renamedAt);
      const rename = `SET app_name = $2, slug = $3::text`;

      if (defaultBranchId) {
        // The propagating rows first, one statement each. The draft is the source of truth for
        // app_name and slug: sync_published_app_version_metadata_from_draft overwrites a
        // PUBLISHED row's NEW values with the draft's on every write, so renaming the published
        // rows before the draft would hand them straight back the name this is clearing.
        // Renaming the draft also fires propagate_app_version_metadata, which fans the new name
        // and slug across the app's other non-stub version rows, on every branch.
        //
        // One statement each because an app may hold more than one such row per branch — an
        // unsynced app is exempt from the single-draft index (1782100000000), and NULL-status
        // rows are never constrained by it at all. Batching them would let the trigger for one
        // row write a sibling the same statement had not reached yet, which PostgreSQL rejects
        // with "tuple to be updated was already modified by an operation triggered by the
        // current command".
        const propagatingIds: { id: string }[] = await queryRunner.query(
          `SELECT id FROM app_versions WHERE app_id = $1 AND branch_id = $2 AND ${PROPAGATES_ON_WRITE} ORDER BY id`,
          [appId, defaultBranchId]
        );
        for (const { id } of propagatingIds) {
          await queryRunner.query(`UPDATE app_versions ${rename} WHERE id = $1`, [id, detachedName, appId]);
        }

        // Then everything else on the branch, in one statement: the stub and PUBLISHED rows
        // propagate_app_version_metadata returns early for, and every row of an app that has no
        // draft at all. Nothing writes behind this one.
        await queryRunner.query(
          `UPDATE app_versions ${rename} WHERE app_id = $1 AND branch_id = $4 AND NOT (${PROPAGATES_ON_WRITE})`,
          [appId, detachedName, appId, defaultBranchId]
        );
      }

      // Second pass: every row the first one did not reach — the other branches, and (when the
      // organization has no default branch at all) the whole app. Read AFTER the first pass, so
      // the rows propagate_app_version_metadata already renamed are visible as such.
      const remainingRows: { id: string; branch_id: string | null; app_name: string | null }[] =
        await queryRunner.query(
          `SELECT id, branch_id, app_name FROM app_versions
           WHERE app_id = $1 AND ($2::uuid IS NULL OR branch_id IS DISTINCT FROM $2::uuid)
           ORDER BY branch_id, id`,
          [appId, defaultBranchId]
        );

      const byBranch = new Map<string, typeof remainingRows>();
      for (const row of remainingRows) {
        // '' keys rows with no branch at all. Defensive only: branch_id has been NOT NULL for
        // every type since 1782400000000 backfilled workflows (which this migration runs after),
        // so the group should be empty — workflows are branched, named and slugged like anything
        // else. Should one survive, every uniqueness trigger returns early on a NULL branch_id,
        // so such rows cannot collide and all take the plain name; they would still need the
        // rewrite, because the slug triggers' EXISTS has no branch filter and scans them when
        // another app writes on ITS default branch.
        const key = row.branch_id ?? '';
        const bucket = byBranch.get(key);
        if (bucket) bucket.push(row);
        else byBranch.set(key, [row]);
      }

      for (const [branchId, rows] of byBranch) {
        // Whichever row propagate already renamed keeps the plain name; with none, the first by
        // id takes it. The name carries the app id, so it can never collide with another app's
        // row on the branch — only with this app's own siblings, which is what the discriminated
        // names below are for.
        const plainNameHolder =
          branchId === '' ? null : (rows.find((row) => row.app_name === detachedName) ?? rows[0]).id;
        for (const row of rows) {
          const name = branchId === '' || row.id === plainNameHolder ? detachedName : `${detachedName}-${row.id}`;
          await queryRunner.query(`UPDATE app_versions ${rename} WHERE id = $1`, [row.id, name, appId]);
        }
      }

      console.log(
        `${MIGRATION_NAME}: [PROGRESS] ${i + 1}/${losers.length} (${Math.round(
          ((i + 1) / losers.length) * 100
        )}%) app ${appId} "${appName ?? '(unnamed)'}" co_relation_id ${previousCoRelationId} -> ${freshCoRelationId}` +
          ` renamed to "${detachedName}"` +
          (defaultBranchId ? '' : ' (organization has no default branch)')
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
