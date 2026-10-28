import { MigrationInterface, QueryRunner } from 'typeorm';
import { MigrationProgress } from '@helpers/migration.helper';

const MIGRATION_NAME = 'ConsolidatedBranchModelSetup1773500000000';
const TOTAL_STEPS = 12;

/**
 * Consolidated branch-model / git-sync setup (lts -> final state).
 *
 * Replaces the ~30 incremental branch-model migrations (CreateWorkspaceBranchTables,
 * AddPlatformGitSyncSupport, SeedWorkspaceBranchData, EnforceBranchedAppVersionInvariants,
 * the metadata/slug/name triggers, DSV setup, etc.) that were folded into this one file.
 *
 * BETA GUARD: customers already on `main` have `organization_git_sync_branches`. For them
 * this migration is a no-op — they received the branch model incrementally and get the
 * remaining SET-2 migrations (main -> current) as normal incremental migrations. Only
 * fresh installs and lts upgraders (no branch table yet) run the body below.
 *
 * The body reproduces tooljet_cloud's final branch-model schema and wires up existing
 * data (verified: schema/functions/triggers match cloud exactly; every app_version is
 * attached to its org default branch; published rows preserved; git config wiped so the
 * customer reconfigures). It also adds a LOWER(slug) lookup index on app_versions.
 *
 * Depends on the kept-separate `enforce-unique-data-source-names` migration (dedups global
 * data source names per org) having run first — its earlier timestamp guarantees that.
 */
export class ConsolidatedBranchModelSetup1773500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const [{ exists }] = await queryRunner.query(
      `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organization_git_sync_branches') AS exists`
    );
    if (exists) {
      // Beta customer (already on main) — branch model present, nothing to consolidate.
      console.log(`${MIGRATION_NAME}: [SKIP] organization_git_sync_branches exists (beta/main install) — no-op.`);
      return;
    }

    // Bulk set-based SQL below (no per-row loops), but the backfill touches every
    // app_version / data_source; MigrationProgress reports step-level progress %.
    const progress = new MigrationProgress(MIGRATION_NAME, TOTAL_STEPS);
    console.log(`${MIGRATION_NAME}: [START] Consolidated branch-model setup (lts/fresh upgrade path).`);

    await queryRunner.query(`SET LOCAL statement_timeout = 0`);

    // 1. Wipe git-sync configuration (customers reconfigure post-upgrade)
    console.log(`${MIGRATION_NAME}: [START] Step 1/12 - wiping git-sync configuration.`);
    await queryRunner.query(`DELETE FROM organization_git_https`);
    await queryRunner.query(`DELETE FROM organization_git_ssh`);
    await queryRunner.query(`DELETE FROM organization_gitlab`);
    const [, wipedConfigs] = await queryRunner.query(`DELETE FROM organization_git_sync`);
    await queryRunner.query(`DROP TABLE IF EXISTS app_git_sync`);
    console.log(`${MIGRATION_NAME}: [SUCCESS] Step 1/12 - git-sync config wiped (${wipedConfigs ?? 0} org configs).`);
    progress.show();

    // 2. Enum + config columns on organization_git_sync
    console.log(`${MIGRATION_NAME}: [START] Step 2/12 - enum + organization_git_sync columns.`);
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='app_version_type') THEN
          CREATE TYPE public.app_version_type AS ENUM ('version','branch');
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      ALTER TABLE organization_git_sync
        ADD COLUMN IF NOT EXISTS is_branching_enabled boolean NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS schema_version character varying NOT NULL DEFAULT '1.0.0',
        ADD COLUMN IF NOT EXISTS webhook_enabled boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS webhook_secret character varying(64) DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS webhook_events jsonb NOT NULL DEFAULT '["push", "pull_request", "delete"]'::jsonb
    `);
    console.log(`${MIGRATION_NAME}: [SUCCESS] Step 2/12 - enum + config columns added.`);
    progress.show();

    // 3. Branch-model tables (final structure)
    console.log(`${MIGRATION_NAME}: [START] Step 3/12 - creating branch-model tables.`);
    await queryRunner.query(`
      CREATE TABLE public.organization_git_sync_branches (
        id uuid DEFAULT gen_random_uuid() NOT NULL,
        organization_id uuid NOT NULL,
        branch_name character varying(255) NOT NULL,
        is_default boolean DEFAULT false NOT NULL,
        source_branch_id uuid,
        created_at timestamp without time zone DEFAULT now() NOT NULL,
        updated_at timestamp without time zone DEFAULT now() NOT NULL,
        created_by character varying(255) DEFAULT NULL,
        last_synced_commit character varying(64) DEFAULT NULL,
        apps_git_tree_sha character varying(64) DEFAULT NULL,
        modules_git_tree_sha character varying(64) DEFAULT NULL,
        data_sources_git_tree_sha character varying(64) DEFAULT NULL,
        CONSTRAINT organization_git_sync_branches_pkey PRIMARY KEY (id),
        CONSTRAINT organization_git_sync_branches_organization_id_branch_name_key UNIQUE (organization_id, branch_name),
        CONSTRAINT organization_git_sync_branches_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE,
        CONSTRAINT organization_git_sync_branches_source_branch_id_fkey FOREIGN KEY (source_branch_id) REFERENCES public.organization_git_sync_branches(id) ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`
      CREATE TABLE public.data_source_versions (
        id uuid DEFAULT gen_random_uuid() NOT NULL,
        data_source_id uuid NOT NULL,
        version_from_id uuid,
        name character varying(255) NOT NULL,
        is_active boolean DEFAULT true NOT NULL,
        is_default boolean DEFAULT false NOT NULL,
        branch_id uuid NOT NULL,
        created_at timestamp without time zone DEFAULT now() NOT NULL,
        updated_at timestamp without time zone DEFAULT now() NOT NULL,
        is_synced boolean DEFAULT false NOT NULL,
        git_tree_sha character varying(64) DEFAULT NULL,
        CONSTRAINT data_source_versions_pkey PRIMARY KEY (id),
        CONSTRAINT data_source_versions_data_source_id_branch_id_key UNIQUE (data_source_id, branch_id),
        CONSTRAINT data_source_versions_data_source_id_fkey FOREIGN KEY (data_source_id) REFERENCES public.data_sources(id) ON DELETE CASCADE,
        CONSTRAINT data_source_versions_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.organization_git_sync_branches(id) ON DELETE CASCADE,
        CONSTRAINT data_source_versions_version_from_id_fkey FOREIGN KEY (version_from_id) REFERENCES public.data_source_versions(id) ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`
      CREATE TABLE public.data_source_version_options (
        id uuid DEFAULT gen_random_uuid() NOT NULL,
        data_source_version_id uuid NOT NULL,
        environment_id uuid NOT NULL,
        options jsonb DEFAULT '{}'::jsonb NOT NULL,
        created_at timestamp without time zone DEFAULT now() NOT NULL,
        updated_at timestamp without time zone DEFAULT now() NOT NULL,
        CONSTRAINT data_source_version_options_pkey PRIMARY KEY (id),
        CONSTRAINT data_source_version_options_data_source_version_id_environm_key UNIQUE (data_source_version_id, environment_id),
        CONSTRAINT data_source_version_options_data_source_version_id_fkey FOREIGN KEY (data_source_version_id) REFERENCES public.data_source_versions(id) ON DELETE CASCADE,
        CONSTRAINT data_source_version_options_environment_id_fkey FOREIGN KEY (environment_id) REFERENCES public.app_environments(id) ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE public.git_sync_webhook_events (
        id uuid DEFAULT gen_random_uuid() NOT NULL,
        organization_id uuid NOT NULL,
        delivery_id character varying(255) NOT NULL,
        provider character varying(20) NOT NULL,
        event_type character varying(50) NOT NULL,
        branch_name character varying(255),
        status character varying(20) DEFAULT 'received'::character varying NOT NULL,
        error_message text,
        duration_ms integer,
        attempts integer DEFAULT 0,
        payload_summary jsonb,
        processed_at timestamp with time zone,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT git_sync_webhook_events_pkey PRIMARY KEY (id),
        CONSTRAINT git_sync_webhook_events_provider_check CHECK (((provider)::text = ANY ((ARRAY['github'::character varying, 'gitlab'::character varying])::text[]))),
        CONSTRAINT git_sync_webhook_events_status_check CHECK (((status)::text = ANY ((ARRAY['received'::character varying, 'queued'::character varying, 'processing'::character varying, 'processed'::character varying, 'skipped'::character varying, 'failed'::character varying, 'dead'::character varying])::text[]))),
        CONSTRAINT fk_webhook_events_org FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_webhook_events_created ON public.git_sync_webhook_events USING btree (created_at)`);
    await queryRunner.query(`CREATE INDEX idx_webhook_events_org_status ON public.git_sync_webhook_events USING btree (organization_id, status, created_at DESC)`);
    await queryRunner.query(`CREATE UNIQUE INDEX idx_webhook_events_org_delivery ON public.git_sync_webhook_events USING btree (organization_id, delivery_id)`);
    await queryRunner.query(`CREATE UNIQUE INDEX idx_unique_active_name_branch ON public.data_source_versions USING btree (name, branch_id) WHERE (is_active = true)`);
    console.log(`${MIGRATION_NAME}: [SUCCESS] Step 3/12 - branch-model tables created (branches, DSV, DSVO, webhook_events).`);
    progress.show();

    // 4. app_versions branch-model columns (branch_id nullable during backfill)
    console.log(`${MIGRATION_NAME}: [START] Step 4/12 - adding branch-model columns to app_versions / folder_apps.`);
    await queryRunner.query(`
      ALTER TABLE app_versions
        ADD COLUMN IF NOT EXISTS version_type public.app_version_type NOT NULL DEFAULT 'version',
        ADD COLUMN IF NOT EXISTS is_stub boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS branch_id uuid,
        ADD COLUMN IF NOT EXISTS module_reference_id uuid,
        ADD COLUMN IF NOT EXISTS slug character varying,
        ADD COLUMN IF NOT EXISTS app_name character varying,
        ADD COLUMN IF NOT EXISTS icon character varying,
        ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false,
        ADD COLUMN IF NOT EXISTS is_synced boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS git_tree_sha character varying(64) DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS pulled_at timestamp without time zone DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS remote_updated_at timestamp without time zone DEFAULT NULL
    `);
    // pulled_at / remote_updated_at are transitional: kept migrations (CleanupStaleDraftVersions,
    // EnsureDefaultBranchDraftVersion, CloneDefaultBranchDraftFromPublished) read them, and the
    // kept SET-2 migration DropPulledAtAndRemoteUpdatedAt (1785600000000) drops them at the end.
    // organization_users.last_branch_id is added by the kept SET-2 migration
    // AddLastBranchIdToOrganizationUsers (1782200000000) — leave it to that migration.
    //
    // folder_apps.branch_id (column + unique-index swap + FK + backfill) is intentionally NOT
    // done here. It lives in the kept data-phase migration AddBranchIdToFolderApps (1777100000000),
    // which must run AFTER NormalizeFolderAppsKeepFirstCreatedMappingPerApp (1769151383974) dedupes
    // folder_apps and creates uniq_folder_apps_app_id — the unique indexes can't build on the
    // still-duplicated LTS data at schema-migration time. Only the non-unique folder_id index
    // (from the folded 1779800000000) is safe to create here.
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_folder_apps_folder_id ON folder_apps (folder_id)`);
    console.log(`${MIGRATION_NAME}: [SUCCESS] Step 4/12 - branch-model columns added.`);
    progress.show();

    // 5. Default branch for EVERY organization (universal branch model)
    console.log(`${MIGRATION_NAME}: [START] Step 5/12 - creating default branch per organization.`);
    await queryRunner.query(`
      INSERT INTO organization_git_sync_branches (organization_id, branch_name, is_default)
      SELECT id, 'main', true FROM organizations
      ON CONFLICT (organization_id, branch_name) DO NOTHING
    `);
    // INSERT rowCount isn't surfaced by queryRunner.query the way UPDATE/DELETE is; the
    // table was just created empty, so a COUNT gives the exact number inserted.
    const [{ count: defaultBranches }] = await queryRunner.query(
      `SELECT count(*)::int AS count FROM organization_git_sync_branches`
    );
    console.log(`${MIGRATION_NAME}: [SUCCESS] Step 5/12 - created ${defaultBranches} default branches.`);
    progress.show();

    // 6. App metadata backfill from apps (+ defensive null heal)
    console.log(`${MIGRATION_NAME}: [START] Step 6/12 - backfilling app_versions metadata from apps.`);
    const [, metaBackfilled] = await queryRunner.query(`
      UPDATE app_versions av
      SET icon = a.icon, is_public = a.is_public, slug = a.slug, app_name = a.name
      FROM apps a WHERE av.app_id = a.id
    `);
    await queryRunner.query(`
      UPDATE app_versions av
      SET app_name = COALESCE(av.app_name, a.slug, a.id::text),
          slug     = COALESCE(av.slug, a.slug, a.id::text)
      FROM apps a WHERE av.app_id = a.id AND (av.app_name IS NULL OR av.slug IS NULL)
    `);
    console.log(`${MIGRATION_NAME}: [SUCCESS] Step 6/12 - metadata backfilled on ${metaBackfilled ?? 0} app_versions.`);
    progress.show();

    // 7. Wire up branch_id -> org default branch
    console.log(`${MIGRATION_NAME}: [START] Step 7/12 - wiring app_versions / folder_apps to default branch.`);
    const [, avBranched] = await queryRunner.query(`
      UPDATE app_versions av SET branch_id = wb.id
      FROM apps a JOIN organization_git_sync_branches wb ON wb.organization_id = a.organization_id AND wb.is_default = true
      WHERE av.app_id = a.id
    `);
    // folder_apps.branch_id backfill is handled by the kept data migration AddBranchIdToFolderApps
    // (1777100000000), together with its column add + unique-index swap + FK (see Step 4 note).
    console.log(`${MIGRATION_NAME}: [SUCCESS] Step 7/12 - branch_id set on ${avBranched ?? 0} app_versions.`);
    progress.show();

    // 7b. INTENTIONALLY no draft dedup / status rewrite. The lts->latest flow preserves every
    //     version's DRAFT/PUBLISHED status exactly as-is and only attaches it to the default
    //     branch. Nothing is synced yet (config wiped; is_synced stays false), so the
    //     single-draft unique index (… WHERE is_synced = true) is empty and multiple drafts are
    //     allowed. The customer creates/collapses drafts themselves when they configure git sync.
    //     (Kept migrations that used to dedup/create drafts are neutralised on this path:
    //      MakeAppVersionBranchIdNotNull no longer flags lts rows is_synced=true;
    //      EnsureDefaultBranchDraftVersion / CloneDefaultBranchDraftFromPublished no longer create
    //      drafts; UpdateAppVersionStatusAndFields only backfills a NULL status.)

    // 7c. RELEASE modules. MODULES are the one exception to "preserve status as-is": LTS has no
    //     module versioning — a module is a single 'v1' DRAFT that was never released. The new
    //     model can only EMBED a module that has a released (PUBLISHED) version; an unreleased
    //     module errors with "Release the module first" and its consumers' version pins can't
    //     resolve. So promote each module's canonical (non-stub, default-branch) 'v1' version to
    //     PUBLISHED and point apps.current_version_id at it (mirrors the original
    //     PromoteAndReleaseExistingModuleVersions, which we keep neutralised because it is a
    //     data-phase migration — too late).
    //
    //     ORDERING IS THE POINT: this runs here (consolidated, ts 1773500000000) BEFORE
    //     GenerateCoRelationIdForModules (schema, ts 1776470400000). That later migration rewrites
    //     each consuming ModuleViewer's moduleVersionId pin to the module's RELEASED version's
    //     module_reference_id (linking consumers to the v1 release); if the module were still a
    //     DRAFT at that point it would instead collapse the pin to '' (unpinned). Releasing here
    //     is what makes the version-level linkage land on the v1 release. (moduleAppId ->
    //     co_relation_id is handled entirely by that later migration.)
    //
    //     LTS invariant: exactly one non-stub 'version' row per module. If a beta edge ever had
    //     several, all its non-stub default-branch version rows publish and current_version_id
    //     takes the latest — still a valid released state.
    console.log(`${MIGRATION_NAME}: [START] Step 7c - releasing modules (v1 DRAFT -> PUBLISHED + current_version_id).`);
    const [, modulesReleased] = await queryRunner.query(`
      UPDATE app_versions av
      SET status = 'PUBLISHED',
          current_environment_id = COALESCE((
            SELECT e.id FROM app_environments e
            WHERE e.organization_id = a.organization_id
            ORDER BY (e."default" IS TRUE) DESC, e.priority ASC
            LIMIT 1
          ), av.current_environment_id)
      FROM apps a
      JOIN organization_git_sync_branches wb ON wb.organization_id = a.organization_id AND wb.is_default = true
      WHERE av.app_id = a.id
        AND a.type = 'module'
        AND av.version_type = 'version'
        AND av.is_stub = false
        AND av.branch_id = wb.id
    `);
    await queryRunner.query(`
      UPDATE apps a
      SET current_version_id = (
        SELECT av.id FROM app_versions av
        JOIN organization_git_sync_branches wb ON wb.id = av.branch_id AND wb.is_default = true
        WHERE av.app_id = a.id AND av.version_type = 'version' AND av.is_stub = false AND av.status = 'PUBLISHED'
        ORDER BY av.updated_at DESC, av.id
        LIMIT 1
      )
      WHERE a.type = 'module'
    `);
    console.log(`${MIGRATION_NAME}: [SUCCESS] Step 7c - released ${modulesReleased ?? 0} module versions (named v1).`);

    // 8. Data source versions + options for global data sources.
    //    Self-contained DS-name dedup (per org) — the branch model requires unique
    //    (name, branch_id); we cannot rely on the data-phase enforce-unique-data-source-names
    //    migration since schema migrations run before all data migrations.
    console.log(`${MIGRATION_NAME}: [START] Step 8/12 - deduping DS names + seeding data_source_versions.`);
    await queryRunner.query(`
      DO $$
      DECLARE rec RECORD; new_name text; suffix int;
      BEGIN
        FOR rec IN
          SELECT id, name, organization_id FROM (
            SELECT id, name, organization_id,
              ROW_NUMBER() OVER (PARTITION BY LOWER(name), organization_id ORDER BY created_at, id) rn
            FROM data_sources WHERE scope = 'global' AND app_version_id IS NULL
          ) x WHERE rn > 1
        LOOP
          suffix := 1;
          LOOP
            new_name := rec.name || '_' || suffix;
            EXIT WHEN NOT EXISTS (
              SELECT 1 FROM data_sources
              WHERE organization_id = rec.organization_id AND LOWER(name) = LOWER(new_name) AND scope = 'global'
            );
            suffix := suffix + 1;
          END LOOP;
          UPDATE data_sources SET name = new_name WHERE id = rec.id;
        END LOOP;
      END $$;
    `);
    await queryRunner.query(`
      INSERT INTO data_source_versions (data_source_id, branch_id, name, is_active)
      SELECT ds.id, wb.id, ds.name, true
      FROM data_sources ds
      JOIN organization_git_sync_branches wb ON wb.organization_id = ds.organization_id AND wb.is_default = true
      WHERE ds.scope = 'global' AND ds.app_version_id IS NULL
      ON CONFLICT (data_source_id, branch_id) DO NOTHING
    `);
    await queryRunner.query(`
      INSERT INTO data_source_version_options (data_source_version_id, environment_id, options)
      SELECT dsv.id, dso.environment_id, COALESCE(dso.options, '{}'::json)::jsonb
      FROM data_source_options dso
      JOIN data_sources ds ON ds.id = dso.data_source_id
      JOIN data_source_versions dsv ON dsv.data_source_id = ds.id
      WHERE ds.scope = 'global' AND ds.app_version_id IS NULL
      ON CONFLICT (data_source_version_id, environment_id) DO NOTHING
    `);
    // NB: data_source_options is NOT dropped here — kept data-phase migrations
    // (e.g. BackfillMssqlDatasourceAuthType) still read it; the kept
    // DropDataSourceOptionsTable (1773300000000, data phase) drops it after them.
    // Both tables were just created empty, so a COUNT is the exact inserted total.
    const [{ count: dsvCreated }] = await queryRunner.query(`SELECT count(*)::int AS count FROM data_source_versions`);
    const [{ count: dsvoCreated }] = await queryRunner.query(
      `SELECT count(*)::int AS count FROM data_source_version_options`
    );
    console.log(
      `${MIGRATION_NAME}: [SUCCESS] Step 8/12 - created ${dsvCreated} data_source_versions, ${dsvoCreated} options.`
    );
    progress.show();

    // 9. NOT NULL + FKs + CHECK constraints (data now satisfies them)
    console.log(`${MIGRATION_NAME}: [START] Step 9/12 - adding FKs + CHECK constraints.`);
    await queryRunner.query(`ALTER TABLE app_versions ADD CONSTRAINT fk_app_versions_branch FOREIGN KEY (branch_id) REFERENCES organization_git_sync_branches(id) ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE app_versions ADD CONSTRAINT chk_app_versions_branch_type_implies_draft_branched CHECK ((version_type <> 'branch'::public.app_version_type) OR ((status = 'DRAFT'::public.version_status_enum) AND (branch_id IS NOT NULL)))`);
    // branch_id NOT NULL is set later by the kept SET-2 migration
    // MakeAppVersionBranchIdNotNullAndGitSyncFlags (1781741000000), after the draft-ensuring
    // migrations create their (temporarily branchless) rows — matching main's ordering.
    // NOTE: chk_app_versions_branch_metadata is intentionally NOT added here. Kept
    // migrations that run after this file (EnsureDefaultBranchDraftVersion,
    // CloneDefaultBranchDraftFromPublished) create draft/stub rows with temporarily-NULL
    // metadata that SET-2 (MakeAppVersionBranchIdNotNullAndGitSyncFlags) later heals. The
    // constraint is added at the end by 1786800000000-FinalizeBranchModelConstraints, after
    // that heal — matching main's ordering (AddMetadataColumns added it after those inserts).
    // folder_apps.branch_id FK (and NOT NULL) are handled by the kept data migrations
    // AddBranchIdToFolderApps (1777100000000, FK) and BackfillFolderAppsDefaultBranchIdAndEnforceNotNull
    // (1785700000000, NOT NULL) — see the Step 4 note.
    console.log(`${MIGRATION_NAME}: [SUCCESS] Step 9/12 - FKs + CHECK constraints added.`);
    progress.show();

    // 10. Indexes on app_versions (+ the new LOWER(slug) lookup index)
    console.log(`${MIGRATION_NAME}: [START] Step 10/12 - creating app_versions indexes (incl. LOWER(slug)).`);
    await queryRunner.query(`CREATE INDEX idx_app_versions_app_id_branch_id ON app_versions USING btree (app_id, branch_id)`);
    await queryRunner.query(`CREATE INDEX idx_app_versions_branch_id ON app_versions USING btree (branch_id) WHERE (branch_id IS NOT NULL)`);
    await queryRunner.query(`CREATE INDEX idx_app_versions_module_ref_branch ON app_versions USING btree (module_reference_id, branch_id) WHERE (module_reference_id IS NOT NULL)`);
    await queryRunner.query(`CREATE UNIQUE INDEX app_versions_app_default_branch_draft_unique ON app_versions USING btree (app_id, branch_id) WHERE ((status = 'DRAFT'::public.version_status_enum) AND (version_type = 'version'::public.app_version_type) AND (is_stub = false) AND (is_synced = true))`);
    await queryRunner.query(`CREATE UNIQUE INDEX app_versions_app_default_branch_draft_unique_ensure_single_stub ON app_versions USING btree (app_id, branch_id) WHERE ((status = 'DRAFT'::public.version_status_enum) AND (version_type = 'version'::public.app_version_type) AND (is_stub = true) AND (is_synced = true))`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_app_versions_lower_slug ON app_versions USING btree (LOWER(slug)) WHERE (slug IS NOT NULL)`);
    console.log(`${MIGRATION_NAME}: [SUCCESS] Step 10/12 - indexes created.`);
    progress.show();

    // 11. Trigger functions (created after backfill so backfill UPDATEs don't fire them)
    console.log(`${MIGRATION_NAME}: [START] Step 11/12 - creating trigger functions.`);
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION public.bump_app_updated_at_from_version() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN IF NEW.app_id IS NOT NULL THEN UPDATE apps SET updated_at = NOW() WHERE id = NEW.app_id; END IF; RETURN NEW; END; $$
    `);
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION public.bump_app_version_updated_at_direct() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN IF NEW.app_version_id IS NOT NULL THEN UPDATE app_versions SET updated_at = NOW() WHERE id = NEW.app_version_id; END IF; RETURN NEW; END; $$
    `);
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION public.bump_app_version_updated_at_via_component() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN IF NEW.component_id IS NOT NULL THEN
          UPDATE app_versions SET updated_at = NOW()
          WHERE id = (SELECT p.app_version_id FROM components c JOIN pages p ON p.id = c.page_id WHERE c.id = NEW.component_id);
        END IF; RETURN NEW; END; $$
    `);
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION public.bump_app_version_updated_at_via_page() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN IF NEW.page_id IS NOT NULL THEN
          UPDATE app_versions SET updated_at = NOW() WHERE id = (SELECT app_version_id FROM pages WHERE id = NEW.page_id);
        END IF; RETURN NEW; END; $$
    `);
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION public.enforce_app_versions_app_name_branch_unique() RETURNS trigger LANGUAGE plpgsql AS $$
        DECLARE v_app_type varchar; v_is_default boolean;
        BEGIN
          IF NEW.app_name IS NULL OR NEW.branch_id IS NULL THEN RETURN NEW; END IF;
          SELECT type INTO v_app_type FROM apps WHERE id = NEW.app_id;
          IF v_app_type IS NULL THEN RETURN NEW; END IF;
          SELECT is_default INTO v_is_default FROM organization_git_sync_branches WHERE id = NEW.branch_id;
          PERFORM pg_advisory_xact_lock(hashtextextended('avn:' || NEW.branch_id::text || '|' || v_app_type || '|' || NEW.app_name, 0));
          IF EXISTS (SELECT 1 FROM app_versions av JOIN apps a ON a.id = av.app_id
            WHERE av.app_name = NEW.app_name AND av.branch_id = NEW.branch_id AND a.type = v_app_type AND av.id <> NEW.id
              AND ((v_is_default IS TRUE AND av.app_id <> NEW.app_id) OR (v_is_default IS NOT TRUE)))
          THEN RAISE EXCEPTION 'app_versions_app_name_branch_id_unique' USING ERRCODE = 'unique_violation'; END IF;
          RETURN NEW; END; $$
    `);
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION public.enforce_app_versions_default_branch_slug_unique() RETURNS trigger LANGUAGE plpgsql AS $$
        DECLARE v_app_type varchar; v_is_default boolean;
        BEGIN
          IF NEW.slug IS NULL THEN RETURN NEW; END IF;
          SELECT type INTO v_app_type FROM apps WHERE id = NEW.app_id;
          IF v_app_type IS NULL THEN RETURN NEW; END IF;
          IF v_app_type = 'workflow' THEN
            PERFORM pg_advisory_xact_lock(hashtextextended('avws:' || LOWER(NEW.slug), 0));
            IF EXISTS (SELECT 1 FROM app_versions av JOIN apps a ON a.id = av.app_id
              WHERE LOWER(av.slug) = LOWER(NEW.slug) AND a.type = 'workflow' AND av.app_id <> NEW.app_id)
            THEN RAISE EXCEPTION 'app_versions_workflow_slug_unique' USING ERRCODE = 'unique_violation'; END IF;
            RETURN NEW;
          END IF;
          IF NEW.branch_id IS NULL THEN RETURN NEW; END IF;
          SELECT is_default INTO v_is_default FROM organization_git_sync_branches WHERE id = NEW.branch_id;
          IF v_is_default IS NOT TRUE THEN RETURN NEW; END IF;
          PERFORM pg_advisory_xact_lock(hashtextextended('avdbs:' || v_app_type || '|' || LOWER(NEW.slug), 0));
          IF EXISTS (SELECT 1 FROM app_versions av JOIN apps a ON a.id = av.app_id
            WHERE LOWER(av.slug) = LOWER(NEW.slug) AND a.type = v_app_type AND av.app_id <> NEW.app_id AND av.id <> NEW.id)
          THEN RAISE EXCEPTION 'app_versions_default_branch_slug_unique' USING ERRCODE = 'unique_violation'; END IF;
          RETURN NEW; END; $$
    `);
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION public.enforce_app_versions_slug_branch_unique() RETURNS trigger LANGUAGE plpgsql AS $$
        DECLARE v_app_type varchar; v_is_default boolean;
        BEGIN
          IF NEW.slug IS NULL OR NEW.branch_id IS NULL THEN RETURN NEW; END IF;
          SELECT is_default INTO v_is_default FROM organization_git_sync_branches WHERE id = NEW.branch_id;
          IF v_is_default IS TRUE THEN RETURN NEW; END IF;
          SELECT type INTO v_app_type FROM apps WHERE id = NEW.app_id;
          IF v_app_type IS NULL THEN RETURN NEW; END IF;
          PERFORM pg_advisory_xact_lock(hashtextextended('avslug:' || v_app_type || '|' || LOWER(NEW.slug), 0));
          IF EXISTS (SELECT 1 FROM app_versions av JOIN apps a ON a.id = av.app_id
            WHERE LOWER(av.slug) = LOWER(NEW.slug) AND a.type = v_app_type AND av.app_id <> NEW.app_id AND av.id <> NEW.id)
          THEN RAISE EXCEPTION 'app_versions_slug_branch_id_unique' USING ERRCODE = 'unique_violation'; END IF;
          RETURN NEW; END; $$
    `);
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION public.propagate_app_version_metadata() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN
          IF pg_trigger_depth() > 1 THEN RETURN NEW; END IF;
          IF NEW.version_type::text <> 'version' OR NEW.status::text <> 'DRAFT' OR NEW.is_stub THEN RETURN NEW; END IF;
          UPDATE app_versions SET app_name = NEW.app_name, slug = NEW.slug, is_public = NEW.is_public, icon = NEW.icon
          WHERE app_id = NEW.app_id AND version_type = 'version' AND is_stub = false AND id <> NEW.id
            AND (app_name IS DISTINCT FROM NEW.app_name OR slug IS DISTINCT FROM NEW.slug
              OR is_public IS DISTINCT FROM NEW.is_public OR icon IS DISTINCT FROM NEW.icon);
          RETURN NEW; END; $$
    `);
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION public.sync_published_app_version_metadata_from_draft() RETURNS trigger LANGUAGE plpgsql AS $$
        DECLARE d RECORD;
        BEGIN
          IF NEW.version_type::text <> 'version' OR NEW.status::text <> 'PUBLISHED' OR NEW.is_stub THEN RETURN NEW; END IF;
          SELECT app_name, slug, is_public, icon INTO d FROM app_versions
          WHERE app_id = NEW.app_id AND version_type = 'version' AND status = 'DRAFT' AND is_stub = false AND is_synced = true
          ORDER BY is_synced DESC, updated_at DESC LIMIT 1;
          IF FOUND THEN NEW.app_name := d.app_name; NEW.slug := d.slug; NEW.is_public := d.is_public; NEW.icon := d.icon; END IF;
          RETURN NEW; END; $$
    `);

    // 12. Triggers.
    //     Only the bump-updated-at triggers are created here. The metadata/uniqueness triggers
    //     (name/slug/default-branch, propagate, sync-published) are created by the kept SET-2
    //     migration MakeAppVersionBranchIdNotNullAndGitSyncFlags (1781741000000) — it drops and
    //     recreates them, and creates propagate/sync without a preceding DROP, so creating them
    //     here would collide. The functions above are CREATE OR REPLACE, which SET-2 re-replaces.
    console.log(`${MIGRATION_NAME}: [SUCCESS] Step 11/12 - trigger functions created.`);
    progress.show();

    console.log(`${MIGRATION_NAME}: [START] Step 12/12 - creating bump-updated-at triggers.`);
    await queryRunner.query(`CREATE TRIGGER trg_app_versions_bump_apps_updated_at AFTER INSERT OR UPDATE ON app_versions FOR EACH ROW EXECUTE FUNCTION public.bump_app_updated_at_from_version()`);
    await queryRunner.query(`CREATE TRIGGER trg_components_bump_app_version_updated_at AFTER INSERT OR UPDATE ON components FOR EACH ROW EXECUTE FUNCTION public.bump_app_version_updated_at_via_page()`);
    await queryRunner.query(`CREATE TRIGGER trg_data_queries_bump_app_version_updated_at AFTER INSERT OR UPDATE ON data_queries FOR EACH ROW EXECUTE FUNCTION public.bump_app_version_updated_at_direct()`);
    await queryRunner.query(`CREATE TRIGGER trg_event_handlers_bump_app_version_updated_at AFTER INSERT OR UPDATE ON event_handlers FOR EACH ROW EXECUTE FUNCTION public.bump_app_version_updated_at_direct()`);
    await queryRunner.query(`CREATE TRIGGER trg_layouts_bump_app_version_updated_at AFTER INSERT OR UPDATE ON layouts FOR EACH ROW EXECUTE FUNCTION public.bump_app_version_updated_at_via_component()`);
    await queryRunner.query(`CREATE TRIGGER trg_pages_bump_app_version_updated_at AFTER INSERT OR UPDATE ON pages FOR EACH ROW EXECUTE FUNCTION public.bump_app_version_updated_at_direct()`);
    console.log(`${MIGRATION_NAME}: [SUCCESS] Step 12/12 - bump triggers created.`);
    progress.show();

    console.log(`${MIGRATION_NAME}: [SUCCESS] Consolidated branch-model setup complete.`);
  }

  public async down(): Promise<void> {
    // Irreversible: wipes git-sync config and rebuilds the branch model from scratch.
    // A rollback would need a restore from backup — no automated down path.
  }
}
