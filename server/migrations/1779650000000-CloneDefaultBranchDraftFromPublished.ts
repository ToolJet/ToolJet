import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Ensures every FRONT-END app and MODULE in a git-enabled workspace has a
 * DRAFT VERSION-type row on the default branch — cloned in full from its latest
 * PUBLISHED version.
 *
 * Context: earlier migrations detached `branch_id` from PUBLISHED VERSION rows
 * on default branches (they're branchless snapshots now). EnsureDefaultBranchDraftVersion
 * (1777970000000) only seeded a draft for apps whose PUBLISHED row was still
 * branch-scoped at the time — legacy apps, whose published rows were already
 * branchless, were left without a default-branch draft. This migration closes
 * that gap.
 *
 * What it does, per app/module in a git-enabled org (an org with a row in
 * organization_git_sync_branches where is_default=true):
 *
 *   1. Skip if the app already has ANY DRAFT VERSION-type row on the default
 *      branch — stub or non-stub. This is the idempotency guard: re-runs and
 *      apps that already carry a draft (including a lazily-hydrated stub) are
 *      left untouched, so no second draft is ever created.
 *   2. Otherwise pick the latest PUBLISHED VERSION-type, branchless
 *      (branch_id IS NULL) row — newest by updated_at, one per app_id.
 *   3. Clone that row verbatim into a new row, overriding only:
 *        - id              → fresh UUID (primary key)
 *        - name            → fresh UUID (kept unique per (name, app_id))
 *        - branch_id       → default branch id
 *        - status          → DRAFT
 *        - version_type    → version (unchanged; PUBLISHED source is already
 *                            a VERSION row, set explicitly for clarity)
 *        - remote_updated_at → now()  ┐ force a lazy git re-hydration on the
 *        - pulled_at         → NULL   ┘ user's first open of this draft.
 *      Every other column (definition, settings, co_relation_id, is_stub,
 *      metadata, …) is copied as-is from the published source.
 *
 * Why force hydration (remote_updated_at=now(), pulled_at=NULL): this INSERT
 * clones only the app_versions row — it does NOT clone child entities
 * (pages / components / queries / event handlers). The copied `definition`
 * blob alone is not enough for the editor, which renders from the normalized
 * child tables. Leaving the source's pulled_at/remote_updated_at as-is would
 * let AppsService.getOne treat the draft as up-to-date and open it with no
 * child rows. Setting remote_updated_at > pulled_at (here: now() vs NULL)
 * trips the staleness branch in getOne, so the first open pulls the latest
 * content from git and hydrates the child entities. These are git-enabled
 * orgs (the is_default JOIN guarantees it), so the app exists in the remote.
 *
 * Metadata guard: chk_app_versions_branch_metadata requires app_name and slug
 * to be non-null on any branched row, so both are COALESCE'd to app_id::text
 * when the source row left them NULL.
 *
 * Collision handling (why this is a per-row loop, not one set-based INSERT):
 *   The default branch carries two uniqueness constraints that a verbatim clone
 *   can violate — collisions are real because apps.name uniqueness only covers
 *   creation_mode='DEFAULT', so a non-git app can share a name/slug with a git
 *   app (or two git apps can collide) in the same workspace:
 *
 *     a) slug  — enforce_app_versions_default_branch_slug_unique (1779400000000)
 *        is INSTANCE-WIDE across every org's default branch, scoped by
 *        apps.type, case-insensitive. If the cloned slug already exists on ANY
 *        workspace's default branch (same app_type), we replace it with a fresh
 *        UUID — a slug only needs to be stable, not meaningful.
 *
 *     b) app_name — enforce_app_versions_app_name_branch_unique (1779700000000)
 *        is per default branch (branch_id), scoped by apps.type, case-insensitive.
 *        If the cloned app_name already exists on THIS workspace's default
 *        branch (same app_type), we append a timestamp (epoch ms; a counter is
 *        added on the rare chance the timestamped name itself collides — note
 *        now() is constant within the transaction).
 *
 *   Both checks mirror their trigger's EXISTS predicate exactly, so resolving
 *   them here means the trigger never fires on our INSERT regardless of whether
 *   1779700000000 has already run. Each row is inserted before the next is
 *   processed, so collisions BETWEEN two cloned rows self-resolve in loop order.
 *
 *   When slug and/or app_name is rewritten, the new value is propagated to the
 *   app's other version_type='version' rows (the branchless PUBLISHED snapshots)
 *   so app-level metadata stays consistent across versions. Those rows have
 *   branch_id IS NULL, so both default-branch triggers early-return and the
 *   propagation UPDATE is safe.
 *
 * Naturally excluded:
 *   - Workflows — apps.type filter ('front-end','module' only).
 *   - Orgs without a default branch — the is_default JOIN yields no rows.
 *   - Apps already carrying a default-branch DRAFT — the NOT EXISTS guard.
 *
 * Ordering:
 *   Runs AFTER AddRemoteUpdatedAtToAppVersions (1779600000000) — its
 *   remote_updated_at column is referenced below. It is also slotted before
 *   ExtendAppNameUniqueToDefaultBranch (1779700000000), but the explicit
 *   collision handling above no longer depends on that ordering for correctness.
 */
export class CloneDefaultBranchDraftFromPublished1779650000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // The loop below scans app_versions and fires per-row BEFORE triggers
    // (slug/app_name uniqueness); on a large instance this can exceed the
    // connection's statement_timeout (57014). Disable it for this transaction;
    // SET LOCAL reverts on commit/rollback.
    await queryRunner.query(`SET LOCAL statement_timeout = 0`);

    await queryRunner.query(`
      DO $$
      DECLARE
        src        RECORD;
        v_app_type varchar;
        v_slug     varchar;
        v_name     varchar;
        v_slug_changed boolean;
        v_name_changed boolean;
        v_new_id   uuid;
        candidate  varchar;
        suffix     int;
      BEGIN
        FOR src IN
          SELECT DISTINCT ON (av.app_id)
            av.*,
            a.type AS app_type,
            wb.id  AS default_branch_id
          FROM app_versions av
          JOIN apps a
            ON a.id = av.app_id
          JOIN organization_git_sync_branches wb
            ON wb.organization_id = a.organization_id
           AND wb.is_default = true
          WHERE a.type IN ('front-end', 'module')
            AND av.version_type = 'version'
            AND av.branch_id IS NULL
            AND av.status = 'PUBLISHED'
            AND NOT EXISTS (
              SELECT 1
              FROM app_versions d
              WHERE d.app_id = av.app_id
                AND d.branch_id = wb.id
                AND d.version_type = 'version'
                AND d.status = 'DRAFT'
            )
          ORDER BY av.app_id, av.updated_at DESC, av.id DESC
        LOOP
          v_app_type     := src.app_type;
          v_slug         := COALESCE(src.slug, src.app_id::text);     -- branch-metadata guard
          v_name         := COALESCE(src.app_name, src.app_id::text); -- branch-metadata guard
          v_slug_changed := false;
          v_name_changed := false;

          -- (a) slug: unique across ALL default-branch rows in the instance,
          -- scoped by apps.type (mirrors enforce_app_versions_default_branch_slug_unique).
          IF EXISTS (
            SELECT 1
            FROM app_versions av
            JOIN apps a ON a.id = av.app_id
            JOIN organization_git_sync_branches wb
              ON wb.id = av.branch_id AND wb.is_default = true
            WHERE LOWER(av.slug) = LOWER(v_slug)
              AND a.type = v_app_type
          ) THEN
            v_slug         := gen_random_uuid()::text;
            v_slug_changed := true;
          END IF;

          -- (b) app_name: unique on THIS workspace's default branch, scoped by
          -- apps.type (mirrors enforce_app_versions_app_name_branch_unique). On
          -- collision append a timestamp; loop a counter in case it also collides.
          IF EXISTS (
            SELECT 1
            FROM app_versions av
            JOIN apps a ON a.id = av.app_id
            WHERE LOWER(av.app_name) = LOWER(v_name)
              AND a.type = v_app_type
              AND av.branch_id = src.default_branch_id
              AND (
                av.version_type::text = 'branch'
                OR (av.version_type::text = 'version' AND av.branch_id IS NOT NULL)
              )
          ) THEN
            suffix := 0;
            LOOP
              candidate := v_name || '_' || (extract(epoch FROM now()) * 1000)::bigint
                           || CASE WHEN suffix = 0 THEN '' ELSE '_' || suffix END;
              EXIT WHEN NOT EXISTS (
                SELECT 1
                FROM app_versions av
                JOIN apps a ON a.id = av.app_id
                WHERE LOWER(av.app_name) = LOWER(candidate)
                  AND a.type = v_app_type
                  AND av.branch_id = src.default_branch_id
                  AND (
                    av.version_type::text = 'branch'
                    OR (av.version_type::text = 'version' AND av.branch_id IS NOT NULL)
                  )
              );
              suffix := suffix + 1;
            END LOOP;
            v_name         := candidate;
            v_name_changed := true;
          END IF;

          v_new_id := gen_random_uuid();

          INSERT INTO app_versions (
            id, name, definition, app_id, created_at, updated_at,
            current_environment_id, global_settings, show_viewer_navigation,
            home_page_id, promoted_from, page_settings, parent_version_id,
            status, description, published_at, released_at, version_type,
            created_by, co_relation_id, source_tag, is_stub, branch_id,
            pulled_at, module_reference_id, slug, app_name, icon, is_public,
            remote_updated_at
          ) VALUES (
            v_new_id,                       -- id (new PK)
            gen_random_uuid()::text,        -- name (fresh UUID)
            src.definition,
            src.app_id,
            src.created_at,
            src.updated_at,
            src.current_environment_id,
            src.global_settings,
            src.show_viewer_navigation,
            src.home_page_id,
            src.promoted_from,
            src.page_settings,
            src.parent_version_id,
            'DRAFT',                        -- status
            src.description,
            src.published_at,
            src.released_at,
            'version',                      -- version_type
            src.created_by,
            src.co_relation_id,
            src.source_tag,
            false,                          -- is_stub
            src.default_branch_id,          -- branch_id
            NULL,                           -- pulled_at (force re-hydration on first open)
            src.module_reference_id,
            v_slug,
            v_name,
            src.icon,
            src.is_public,
            now()                           -- remote_updated_at (> pulled_at NULL ⇒ stale ⇒ hydrate)
          );

          -- Propagate any rename to the app's other version-type rows so
          -- app-level slug/app_name stays consistent across versions. These are
          -- branchless (branch_id IS NULL), so the default-branch triggers
          -- early-return and the UPDATE is safe.
          IF v_slug_changed OR v_name_changed THEN
            UPDATE app_versions
            SET slug     = CASE WHEN v_slug_changed THEN v_slug ELSE slug END,
                app_name = CASE WHEN v_name_changed THEN v_name ELSE app_name END
            WHERE app_id = src.app_id
              AND version_type::text = 'version'
              AND id <> v_new_id;
          END IF;
        END LOOP;
      END $$;
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No down — once a user opens or edits one of these drafts it's
    // indistinguishable from an organically-created default-branch draft, so a
    // blanket delete would risk discarding real working state.
  }
}
