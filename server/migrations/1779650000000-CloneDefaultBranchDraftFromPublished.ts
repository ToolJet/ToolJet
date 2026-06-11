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
 * Naturally excluded:
 *   - Workflows — apps.type filter ('front-end','module' only).
 *   - Orgs without a default branch — the is_default JOIN yields no rows.
 *   - Apps already carrying a default-branch DRAFT — the NOT EXISTS guard.
 *
 * Ordering — MUST run BEFORE ExtendAppNameUniqueToDefaultBranch (1779700000000):
 *   That migration first DEDUPES app_name across default-branch version rows,
 *   then installs the stricter trigger that enforces app_name uniqueness on
 *   them. Until it runs, enforce_app_versions_app_name_branch_unique is
 *   branch-only and early-returns for version-type rows, so the inserts here
 *   bypass it. Running afterwards would expose these inserts to the active
 *   trigger while having skipped its dedupe pass — and app_name collisions are
 *   possible (apps.name uniqueness only covers creation_mode='DEFAULT'; GIT
 *   apps can share names), which would fail the migration. Slotting in before
 *   1779700000000 lets its dedupe absorb these rows before the constraint locks.
 *   Runs AFTER AddRemoteUpdatedAtToAppVersions (1779600000000) — its
 *   remote_updated_at column is referenced below.
 */
export class CloneDefaultBranchDraftFromPublished1779650000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // The set-based INSERT below scans app_versions and fires per-row BEFORE
    // triggers (slug/app_name uniqueness); on a large instance this can exceed
    // the connection's statement_timeout (57014). Disable it for this
    // transaction; SET LOCAL reverts on commit/rollback.
    await queryRunner.query(`SET LOCAL statement_timeout = 0`);

    await queryRunner.query(`
      INSERT INTO app_versions (
        id, name, definition, app_id, created_at, updated_at,
        current_environment_id, global_settings, show_viewer_navigation,
        home_page_id, promoted_from, page_settings, parent_version_id,
        status, description, published_at, released_at, version_type,
        created_by, co_relation_id, source_tag, is_stub, branch_id,
        pulled_at, module_reference_id, slug, app_name, icon, is_public,
        remote_updated_at
      )
      SELECT
        gen_random_uuid(),                              -- id (new PK)
        gen_random_uuid()::text,                        -- name (fresh UUID)
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
        'DRAFT',                                        -- status
        src.description,
        src.published_at,
        src.released_at,
        'version',                                      -- version_type
        src.created_by,
        src.co_relation_id,
        src.source_tag,
        false,                                          -- is_stub
        src.default_branch_id,                          -- branch_id
        NULL,                                           -- pulled_at (force re-hydration on first open)
        src.module_reference_id,
        COALESCE(src.slug, src.app_id::text),           -- branch-metadata guard
        COALESCE(src.app_name, src.app_id::text),       -- branch-metadata guard
        src.icon,
        src.is_public,
        now()                                           -- remote_updated_at (> pulled_at NULL ⇒ stale ⇒ hydrate)
      FROM (
        SELECT DISTINCT ON (av.app_id)
          av.*,
          wb.id AS default_branch_id
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
      ) src;
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No down — once a user opens or edits one of these drafts it's
    // indistinguishable from an organically-created default-branch draft, so a
    // blanket delete would risk discarding real working state.
  }
}
